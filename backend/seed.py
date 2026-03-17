"""
Run this once after creating the DB to populate with sample data.
Usage: python seed.py
"""
from app import create_app
from extensions import db
from models import Skill, JobRole, JobSkillRequirement, Course

app = create_app()


SKILLS = [
    {"name": "Python", "category": "Programming", "demand_score": 9.5, "description": "General-purpose programming language"},
    {"name": "Machine Learning", "category": "Data Science", "demand_score": 9.2, "description": "Building predictive models"},
    {"name": "SQL", "category": "Data", "demand_score": 8.8, "description": "Relational database querying"},
    {"name": "React", "category": "Frontend", "demand_score": 8.7, "description": "JavaScript UI library"},
    {"name": "Data Analysis", "category": "Data Science", "demand_score": 8.5, "description": "Analysing datasets for insights"},
    {"name": "Deep Learning", "category": "Data Science", "demand_score": 8.3, "description": "Neural network architectures"},
    {"name": "NLP", "category": "Data Science", "demand_score": 8.0, "description": "Natural language processing"},
    {"name": "JavaScript", "category": "Programming", "demand_score": 8.8, "description": "Web scripting language"},
    {"name": "Docker", "category": "DevOps", "demand_score": 8.0, "description": "Containerisation platform"},
    {"name": "AWS", "category": "Cloud", "demand_score": 8.6, "description": "Amazon cloud services"},
    {"name": "Node.js", "category": "Backend", "demand_score": 7.9, "description": "Server-side JavaScript runtime"},
    {"name": "Statistics", "category": "Data Science", "demand_score": 7.8, "description": "Statistical analysis and inference"},
    {"name": "TensorFlow", "category": "Data Science", "demand_score": 7.7, "description": "Open-source ML framework"},
    {"name": "Git", "category": "DevOps", "demand_score": 8.2, "description": "Version control system"},
    {"name": "Flask", "category": "Backend", "demand_score": 7.5, "description": "Lightweight Python web framework"},
]

JOB_ROLES = [
    {
        "title": "Data Scientist",
        "industry": "Technology",
        "description": "Analyses complex data to generate actionable insights",
        "skills": [
            ("Python", 3), ("Machine Learning", 3), ("SQL", 2),
            ("Statistics", 2), ("Deep Learning", 2), ("Data Analysis", 3),
        ],
    },
    {
        "title": "Full Stack Developer",
        "industry": "Technology",
        "description": "Builds both frontend and backend of web applications",
        "skills": [
            ("JavaScript", 3), ("React", 2), ("Node.js", 2),
            ("SQL", 2), ("Git", 2), ("Docker", 1),
        ],
    },
    {
        "title": "ML Engineer",
        "industry": "Technology",
        "description": "Deploys and maintains machine learning systems",
        "skills": [
            ("Python", 3), ("Machine Learning", 3), ("TensorFlow", 2),
            ("Docker", 2), ("AWS", 2), ("Git", 2),
        ],
    },
    {
        "title": "NLP Engineer",
        "industry": "Technology",
        "description": "Builds systems that understand human language",
        "skills": [
            ("Python", 3), ("NLP", 3), ("Deep Learning", 2),
            ("Machine Learning", 2), ("TensorFlow", 2),
        ],
    },
]

COURSES = [
    {"title": "Python for Everybody", "platform": "Coursera", "skill": "Python", "level": 1, "duration_hours": 30, "rating": 4.8, "url": "https://coursera.org/python"},
    {"title": "Python Bootcamp", "platform": "Udemy", "skill": "Python", "level": 2, "duration_hours": 22, "rating": 4.6, "url": "https://udemy.com/python-bootcamp"},
    {"title": "Advanced Python", "platform": "Udemy", "skill": "Python", "level": 3, "duration_hours": 18, "rating": 4.5, "url": "https://udemy.com/advanced-python"},
    {"title": "Machine Learning by Andrew Ng", "platform": "Coursera", "skill": "Machine Learning", "level": 2, "duration_hours": 60, "rating": 4.9, "url": "https://coursera.org/ml-ng"},
    {"title": "ML Crash Course", "platform": "Google", "skill": "Machine Learning", "level": 1, "duration_hours": 15, "rating": 4.7, "url": "https://developers.google.com/ml"},
    {"title": "SQL for Data Science", "platform": "Coursera", "skill": "SQL", "level": 1, "duration_hours": 20, "rating": 4.5, "url": "https://coursera.org/sql"},
    {"title": "Advanced SQL", "platform": "Udemy", "skill": "SQL", "level": 3, "duration_hours": 14, "rating": 4.4, "url": "https://udemy.com/advanced-sql"},
    {"title": "React - The Complete Guide", "platform": "Udemy", "skill": "React", "level": 2, "duration_hours": 48, "rating": 4.7, "url": "https://udemy.com/react-complete"},
    {"title": "Statistics with Python", "platform": "Coursera", "skill": "Statistics", "level": 2, "duration_hours": 25, "rating": 4.5, "url": "https://coursera.org/stats-python"},
    {"title": "Deep Learning Specialisation", "platform": "Coursera", "skill": "Deep Learning", "level": 3, "duration_hours": 80, "rating": 4.9, "url": "https://coursera.org/deep-learning"},
    {"title": "NLP with Python", "platform": "Udemy", "skill": "NLP", "level": 2, "duration_hours": 30, "rating": 4.6, "url": "https://udemy.com/nlp-python"},
    {"title": "Docker for Beginners", "platform": "Udemy", "skill": "Docker", "level": 1, "duration_hours": 10, "rating": 4.5, "url": "https://udemy.com/docker-beginners"},
    {"title": "AWS Cloud Practitioner", "platform": "Udemy", "skill": "AWS", "level": 1, "duration_hours": 12, "rating": 4.6, "url": "https://udemy.com/aws-cp"},
    {"title": "Git Complete Guide", "platform": "Udemy", "skill": "Git", "level": 1, "duration_hours": 8, "rating": 4.5, "url": "https://udemy.com/git-guide"},
    {"title": "JavaScript The Complete Guide", "platform": "Udemy", "skill": "JavaScript", "level": 2, "duration_hours": 52, "rating": 4.7, "url": "https://udemy.com/js-complete"},
    {"title": "TensorFlow Developer", "platform": "Coursera", "skill": "TensorFlow", "level": 2, "duration_hours": 40, "rating": 4.7, "url": "https://coursera.org/tensorflow"},
    {"title": "Data Analysis with Pandas", "platform": "Udemy", "skill": "Data Analysis", "level": 2, "duration_hours": 20, "rating": 4.6, "url": "https://udemy.com/pandas"},
    {"title": "Flask Web Development", "platform": "Udemy", "skill": "Flask", "level": 2, "duration_hours": 16, "rating": 4.4, "url": "https://udemy.com/flask-dev"},
    {"title": "Node.js Complete Guide", "platform": "Udemy", "skill": "Node.js", "level": 2, "duration_hours": 40, "rating": 4.6, "url": "https://udemy.com/nodejs"},
]


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Insert skills
        skill_map = {}
        for s in SKILLS:
            skill = Skill(**s)
            db.session.add(skill)
            db.session.flush()
            skill_map[s["name"]] = skill

        # Insert job roles + requirements
        for jr in JOB_ROLES:
            job = JobRole(title=jr["title"], industry=jr["industry"], description=jr["description"])
            db.session.add(job)
            db.session.flush()

            for skill_name, min_prof in jr["skills"]:
                req = JobSkillRequirement(
                    job_role_id=job.id,
                    skill_id=skill_map[skill_name].id,
                    min_proficiency=min_prof,
                )
                db.session.add(req)

        # Insert courses
        for c in COURSES:
            skill = skill_map.get(c["skill"])
            if skill:
                course = Course(
                    title=c["title"],
                    platform=c["platform"],
                    skill_id=skill.id,
                    level=c["level"],
                    duration_hours=c["duration_hours"],
                    rating=c["rating"],
                    url=c["url"],
                )
                db.session.add(course)

        db.session.commit()
        print("✅ Database seeded successfully!")
        print(f"   {len(SKILLS)} skills | {len(JOB_ROLES)} job roles | {len(COURSES)} courses")


if __name__ == "__main__":
    seed()
