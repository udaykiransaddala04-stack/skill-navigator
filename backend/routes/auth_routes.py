from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate required fields
    required = ["name", "email", "password"]
    for field in required:
        if field not in data or not data[field].strip():
            return jsonify({"error": f"{field} is required"}), 400

    # Check duplicate email
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        name=data["name"].strip(),
        email=data["email"].lower().strip(),
        password_hash=generate_password_hash(data["password"]),
        role=data.get("role", "learner"),
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    return jsonify({"message": "User registered successfully", "token": access_token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data.get("email", "").lower()).first()
    if not user or not check_password_hash(user.password_hash, data.get("password", "")):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({"token": access_token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if "name" in data:
        user.name = data["name"].strip()
    db.session.commit()
    return jsonify(user.to_dict()), 200
