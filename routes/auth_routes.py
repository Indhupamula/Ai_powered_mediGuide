from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from utils.database import mongo  # Add this import at the top
import jwt
from datetime import datetime, timedelta
import logging
import re
from functools import wraps

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth_bp', __name__)

# --- Helper Functions ---

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

def create_token(user_id):
    payload = {
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow(),
        'sub': str(user_id)
    }
    token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    return token

# --- YEH NAYA FUNCTION ADD KIYA GAYA HAI ---
def verify_token_and_get_user():
    """
    Yeh function header se token nikalta hai, use verify karta hai,
    aur database se user ka data laata hai.
    """
    token = None
    if 'Authorization' in request.headers and request.headers['Authorization'].startswith('Bearer '):
        token = request.headers['Authorization'].split(" ")[1]

    if not token:
        return None, {'error': 'Token is missing!'}, 401

    try:
        data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        current_user = mongo.db.users.find_one({'_id': ObjectId(data['sub'])})
        
        if not current_user:
            return None, {'error': 'User not found for this token.'}, 404
            
        return current_user, None, None

    except jwt.ExpiredSignatureError:
        return None, {'error': 'Token has expired!'}, 401
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        return None, {'error': 'Token is invalid!'}, 401
# ---------------------------------------------------------

# --- Decorator for verifying JWT token ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user, error, status_code = verify_token_and_get_user()
        if error:
            return jsonify(error), status_code
        return f(user, *args, **kwargs)
    return decorated

# --- Main Authentication Routes ---

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint."""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password')

        if not all([name, email, password]):
            return jsonify({'success': False, 'error': 'Name, email, and password are required'}), 400
        
        if not validate_email(email):
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({'success': False, 'error': message}), 400
            
        if mongo.db.users.find_one({'email': email}):
            return jsonify({'success': False, 'error': 'User with this email already exists'}), 409
            
        hashed_password = generate_password_hash(password)
        
        user_id = mongo.db.users.insert_one({
            'name': name,
            'email': email,
            'password': hashed_password,
            'created_at': datetime.utcnow()
        }).inserted_id
        
        token = create_token(user_id) # Register ke baad token generate karein
        logger.info(f"✅ User '{email}' registered successfully.")
        return jsonify({'success': True, 'message': 'User registered successfully', 'token': token}), 201
        
    except Exception as e:
        logger.error(f"💥 Registration failed: {str(e)}")
        return jsonify({'success': False, 'error': 'An internal server error occurred during registration.'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Handles user login."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Request body must be JSON.'}), 400
            
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

        user = mongo.db.users.find_one({'email': email.strip().lower()})

        if not user or 'password' not in user or not check_password_hash(user['password'], password):
            logger.warning(f"⚠️ Invalid login attempt for email: {email}")
            return jsonify({'success': False, 'message': 'Invalid credentials. Please check your email and password.'}), 401
        
        token = create_token(user['_id'])
        if not token:
            return jsonify({'success': False, 'message': 'Could not generate token.'}), 500

        logger.info(f"✅ User '{email}' logged in successfully.")
        return jsonify({'success': True, 'token': token}), 200

    except Exception as e:
        logger.error(f"💥 Login failed: {e}")
        return jsonify({'success': False, 'message': 'An internal server error occurred during login.'}), 500


@auth_bp.route('/verify-token', methods=['POST'])
@token_required
def verify_token_route(current_user):
    """Verifies a token and returns user data. The decorator handles validation."""
    user_data = {
        'id': str(current_user['_id']),
        'name': current_user['name'],
        'email': current_user['email']
    }
    return jsonify(user_data), 200