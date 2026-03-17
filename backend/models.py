from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default="learner")  # learner | org_admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user_skills = db.relationship("UserSkill", backref="user", lazy=True)
    learning_paths = db.relationship("LearningPath", backref="user", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(100))        # e.g. "Programming", "Data Science"
    demand_score = db.Column(db.Float, default=0.0)   # 0.0 - 10.0, from job market data
    description = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "demand_score": self.demand_score,
            "description": self.description,
        }


class UserSkill(db.Model):
    """Skills a user currently has, with self-rated proficiency."""
    __tablename__ = "user_skills"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    proficiency = db.Column(db.Integer, default=1)   # 1=Beginner, 2=Intermediate, 3=Advanced
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    skill = db.relationship("Skill")

    def to_dict(self):
        return {
            "id": self.id,
            "skill": self.skill.to_dict(),
            "proficiency": self.proficiency,
            "added_at": self.added_at.isoformat(),
        }


class JobRole(db.Model):
    """Target job roles with required skills."""
    __tablename__ = "job_roles"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    industry = db.Column(db.String(100))
    description = db.Column(db.Text)

    required_skills = db.relationship("JobSkillRequirement", backref="job_role", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "industry": self.industry,
            "description": self.description,
            "required_skills": [r.to_dict() for r in self.required_skills],
        }


class JobSkillRequirement(db.Model):
    """Skills required for a specific job role with minimum proficiency."""
    __tablename__ = "job_skill_requirements"

    id = db.Column(db.Integer, primary_key=True)
    job_role_id = db.Column(db.Integer, db.ForeignKey("job_roles.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    min_proficiency = db.Column(db.Integer, default=2)   # minimum required level
    is_mandatory = db.Column(db.Boolean, default=True)

    skill = db.relationship("Skill")

    def to_dict(self):
        return {
            "skill": self.skill.to_dict(),
            "min_proficiency": self.min_proficiency,
            "is_mandatory": self.is_mandatory,
        }


class SkillGap(db.Model):
    """AI-computed gap between user's skills and a target job role."""
    __tablename__ = "skill_gaps"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    job_role_id = db.Column(db.Integer, db.ForeignKey("job_roles.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    current_level = db.Column(db.Integer, default=0)    # 0 = not present
    required_level = db.Column(db.Integer, default=2)
    gap_score = db.Column(db.Float, default=0.0)        # calculated gap severity
    analyzed_at = db.Column(db.DateTime, default=datetime.utcnow)

    skill = db.relationship("Skill")
    job_role = db.relationship("JobRole")

    def to_dict(self):
        return {
            "id": self.id,
            "skill": self.skill.to_dict(),
            "job_role": {"id": self.job_role.id, "title": self.job_role.title},
            "current_level": self.current_level,
            "required_level": self.required_level,
            "gap_score": self.gap_score,
            "analyzed_at": self.analyzed_at.isoformat(),
        }


class Course(db.Model):
    """Learning resources linked to skills."""
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    platform = db.Column(db.String(100))    # Coursera, Udemy, YouTube, etc.
    url = db.Column(db.String(500))
    duration_hours = db.Column(db.Float)
    level = db.Column(db.Integer, default=1)    # 1=Beginner, 2=Intermediate, 3=Advanced
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    rating = db.Column(db.Float, default=0.0)

    skill = db.relationship("Skill")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "platform": self.platform,
            "url": self.url,
            "duration_hours": self.duration_hours,
            "level": self.level,
            "skill": self.skill.to_dict(),
            "rating": self.rating,
        }


class LearningPath(db.Model):
    """AI-generated personalized learning path for a user targeting a job role."""
    __tablename__ = "learning_paths"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    job_role_id = db.Column(db.Integer, db.ForeignKey("job_roles.id"), nullable=False)
    title = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    estimated_hours = db.Column(db.Float, default=0.0)
    completion_percent = db.Column(db.Float, default=0.0)

    steps = db.relationship("LearningPathStep", backref="learning_path", lazy=True, order_by="LearningPathStep.order")
    job_role = db.relationship("JobRole")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "job_role": {"id": self.job_role.id, "title": self.job_role.title},
            "estimated_hours": self.estimated_hours,
            "completion_percent": self.completion_percent,
            "created_at": self.created_at.isoformat(),
            "steps": [s.to_dict() for s in self.steps],
        }


class LearningPathStep(db.Model):
    """Individual step (course) in a learning path."""
    __tablename__ = "learning_path_steps"

    id = db.Column(db.Integer, primary_key=True)
    learning_path_id = db.Column(db.Integer, db.ForeignKey("learning_paths.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    order = db.Column(db.Integer, nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    course = db.relationship("Course")

    def to_dict(self):
        return {
            "id": self.id,
            "order": self.order,
            "course": self.course.to_dict(),
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
