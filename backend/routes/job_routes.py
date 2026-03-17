from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import JobRole, JobSkillRequirement, Skill

jobs_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")


@jobs_bp.route("/", methods=["GET"])
def get_all_jobs():
    industry = request.args.get("industry")
    query = JobRole.query
    if industry:
        query = query.filter_by(industry=industry)
    jobs = query.all()
    return jsonify([j.to_dict() for j in jobs]), 200


@jobs_bp.route("/<int:job_id>", methods=["GET"])
def get_job(job_id):
    job = JobRole.query.get_or_404(job_id)
    return jsonify(job.to_dict()), 200


@jobs_bp.route("/industries", methods=["GET"])
def get_industries():
    industries = db.session.query(JobRole.industry).distinct().all()
    return jsonify([i[0] for i in industries if i[0]]), 200
