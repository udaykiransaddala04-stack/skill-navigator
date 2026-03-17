import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify
from dotenv import load_dotenv
from extensions import db, jwt, cors

load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-me")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///skill_navigator.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from routes.auth_routes import auth_bp
    from routes.skill_routes import skills_bp
    from routes.gap_routes import gap_bp
    from routes.job_routes import jobs_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(skills_bp)
    app.register_blueprint(gap_bp)
    app.register_blueprint(jobs_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "message": "Skill Navigator API is running"}), 200

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": "Authorization token required"}), 401

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return jsonify({"error": "Token has expired. Please log in again."}), 401

    return app

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=False)