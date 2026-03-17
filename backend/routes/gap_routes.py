from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import UserSkill, JobRole, SkillGap, LearningPath, LearningPathStep, Course

gap_bp = Blueprint("gap", __name__, url_prefix="/api/gap")


def compute_gap_score(current_level: int, required_level: int, demand_score: float) -> float:
    """
    Calculate how critical a skill gap is.
    Formula: level_deficit × demand_weight
    Returns 0.0 if no gap.
    """
    deficit = max(0, required_level - current_level)
    if deficit == 0:
        return 0.0
    # Normalise demand_score (0-10) to weight (0.5 - 1.5)
    demand_weight = 0.5 + (demand_score / 10.0)
    return round(deficit * demand_weight, 2)


@gap_bp.route("/analyze/<int:job_role_id>", methods=["POST"])
@jwt_required()
def analyze_gap(job_role_id):
    """
    Compare user's current skills against a target job role.
    Returns list of skill gaps sorted by severity.
    """
    user_id = get_jwt_identity()

    job_role = JobRole.query.get_or_404(job_role_id)

    # Delete previous gaps for this user + job_role
    SkillGap.query.filter_by(user_id=user_id, job_role_id=job_role_id).delete()

    # Build a map of user's skills: {skill_id: proficiency}
    user_skill_map = {
        us.skill_id: us.proficiency
        for us in UserSkill.query.filter_by(user_id=user_id).all()
    }

    gaps = []
    for requirement in job_role.required_skills:
        skill = requirement.skill
        current_level = user_skill_map.get(skill.id, 0)
        required_level = requirement.min_proficiency
        gap_score = compute_gap_score(current_level, required_level, skill.demand_score)

        gap = SkillGap(
            user_id=user_id,
            job_role_id=job_role_id,
            skill_id=skill.id,
            current_level=current_level,
            required_level=required_level,
            gap_score=gap_score,
        )
        db.session.add(gap)
        gaps.append(gap)

    db.session.commit()

    # Sort by gap_score descending (most critical first)
    gaps.sort(key=lambda g: g.gap_score, reverse=True)
    actual_gaps = [g for g in gaps if g.gap_score > 0]

    return jsonify({
        "job_role": job_role.to_dict(),
        "total_required": len(gaps),
        "gaps_found": len(actual_gaps),
        "match_percent": round((1 - len(actual_gaps) / max(len(gaps), 1)) * 100, 1),
        "gaps": [g.to_dict() for g in actual_gaps],
    }), 200


@gap_bp.route("/history", methods=["GET"])
@jwt_required()
def gap_history():
    """Return all gap analyses for current user."""
    user_id = get_jwt_identity()
    gaps = SkillGap.query.filter_by(user_id=user_id).all()
    return jsonify([g.to_dict() for g in gaps]), 200


# ── Learning path generation ──────────────────────────────────────────────────

@gap_bp.route("/learning-path/<int:job_role_id>", methods=["POST"])
@jwt_required()
def generate_learning_path(job_role_id):
    """
    Generate a personalized learning path based on skill gaps.
    Picks the best-rated course for each gap, ordered by gap severity.
    """
    user_id = get_jwt_identity()
    job_role = JobRole.query.get_or_404(job_role_id)

    # Get existing gaps; re-analyze if none
    gaps = (
        SkillGap.query
        .filter_by(user_id=user_id, job_role_id=job_role_id)
        .filter(SkillGap.gap_score > 0)
        .order_by(SkillGap.gap_score.desc())
        .all()
    )

    if not gaps:
        return jsonify({"message": "No skill gaps found. Run /gap/analyze first or you already meet all requirements."}), 200

    # Remove existing learning path for same user + job_role
    old_path = LearningPath.query.filter_by(user_id=user_id, job_role_id=job_role_id).first()
    if old_path:
        LearningPathStep.query.filter_by(learning_path_id=old_path.id).delete()
        db.session.delete(old_path)

    learning_path = LearningPath(
        user_id=user_id,
        job_role_id=job_role_id,
        title=f"Path to {job_role.title}",
    )
    db.session.add(learning_path)
    db.session.flush()   # get ID before committing

    total_hours = 0.0
    order = 1

    for gap in gaps:
        # Find best course for this skill at the right level
        course = (
            Course.query
            .filter_by(skill_id=gap.skill_id)
            .filter(Course.level >= gap.required_level)
            .order_by(Course.rating.desc())
            .first()
        )

        if not course:
            # Fallback: any course for this skill
            course = (
                Course.query
                .filter_by(skill_id=gap.skill_id)
                .order_by(Course.rating.desc())
                .first()
            )

        if course:
            step = LearningPathStep(
                learning_path_id=learning_path.id,
                course_id=course.id,
                order=order,
            )
            db.session.add(step)
            total_hours += course.duration_hours or 0
            order += 1

    learning_path.estimated_hours = round(total_hours, 1)
    db.session.commit()

    return jsonify(learning_path.to_dict()), 201


@gap_bp.route("/learning-path/<int:path_id>/complete-step/<int:step_id>", methods=["PATCH"])
@jwt_required()
def complete_step(path_id, step_id):
    """Mark a step in a learning path as completed and update completion %."""
    from datetime import datetime

    user_id = get_jwt_identity()
    path = LearningPath.query.filter_by(id=path_id, user_id=user_id).first_or_404()
    step = LearningPathStep.query.filter_by(id=step_id, learning_path_id=path_id).first_or_404()

    step.is_completed = True
    step.completed_at = datetime.utcnow()

    total = len(path.steps)
    completed = sum(1 for s in path.steps if s.is_completed)
    path.completion_percent = round((completed / total) * 100, 1) if total else 0

    db.session.commit()
    return jsonify(path.to_dict()), 200
