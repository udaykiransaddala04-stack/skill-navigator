from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Skill, UserSkill

skills_bp = Blueprint("skills", __name__, url_prefix="/api/skills")


# ── Skill catalogue ──────────────────────────────────────────────────────────

@skills_bp.route("/", methods=["GET"])
def get_all_skills():
    """Return all skills, optionally filtered by category."""
    category = request.args.get("category")
    query = Skill.query
    if category:
        query = query.filter_by(category=category)
    skills = query.order_by(Skill.demand_score.desc()).all()
    return jsonify([s.to_dict() for s in skills]), 200


@skills_bp.route("/<int:skill_id>", methods=["GET"])
def get_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    return jsonify(skill.to_dict()), 200


@skills_bp.route("/categories", methods=["GET"])
def get_categories():
    categories = db.session.query(Skill.category).distinct().all()
    return jsonify([c[0] for c in categories if c[0]]), 200


# ── User skills ───────────────────────────────────────────────────────────────

@skills_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_skills():
    user_id = get_jwt_identity()
    user_skills = UserSkill.query.filter_by(user_id=user_id).all()
    return jsonify([us.to_dict() for us in user_skills]), 200


@skills_bp.route("/me", methods=["POST"])
@jwt_required()
def add_my_skill():
    """Add or update a skill for the current user."""
    user_id = get_jwt_identity()
    data = request.get_json()

    skill_id = data.get("skill_id")
    proficiency = data.get("proficiency", 1)

    if not skill_id:
        return jsonify({"error": "skill_id is required"}), 400
    if proficiency not in [1, 2, 3]:
        return jsonify({"error": "proficiency must be 1 (Beginner), 2 (Intermediate), or 3 (Advanced)"}), 400

    # Check skill exists
    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({"error": "Skill not found"}), 404

    # Upsert — update if exists, add if not
    existing = UserSkill.query.filter_by(user_id=user_id, skill_id=skill_id).first()
    if existing:
        existing.proficiency = proficiency
        db.session.commit()
        return jsonify(existing.to_dict()), 200

    user_skill = UserSkill(user_id=user_id, skill_id=skill_id, proficiency=proficiency)
    db.session.add(user_skill)
    db.session.commit()
    return jsonify(user_skill.to_dict()), 201


@skills_bp.route("/me/<int:skill_id>", methods=["DELETE"])
@jwt_required()
def remove_my_skill(skill_id):
    user_id = get_jwt_identity()
    user_skill = UserSkill.query.filter_by(user_id=user_id, skill_id=skill_id).first_or_404()
    db.session.delete(user_skill)
    db.session.commit()
    return jsonify({"message": "Skill removed"}), 200
