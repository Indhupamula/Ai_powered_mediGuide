from flask import Blueprint, request, jsonify, current_app
import os
import jwt
from datetime import datetime, timedelta
from utils.database import mongo
from utils.config import Config
from werkzeug.utils import secure_filename
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

user_bp = Blueprint('user', __name__)

def verify_token_and_get_user():
    """Helper function to verify token and get user with enhanced debugging"""
    try:
        logger.debug("🔍 Starting token verification")
        
        auth_header = request.headers.get('Authorization')
        logger.debug(f"📋 Auth header: {auth_header[:50] if auth_header else 'None'}...")
        
        if not auth_header:
            logger.error("❌ No Authorization header provided")
            return None, {'error': 'No token provided'}, 401
        
        if not auth_header.startswith('Bearer '):
            logger.error("❌ Invalid Authorization header format")
            return None, {'error': 'Invalid token format'}, 401
        
        token = auth_header.split(' ')[1]
        logger.debug(f"🎫 Token extracted: {token[:20]}...")
        
        # Decode JWT safely
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            logger.debug(f"✅ JWT payload decoded: {payload}")
        except jwt.ExpiredSignatureError:
            logger.error("❌ JWT token has expired")
            return None, {'error': 'Token has expired'}, 401
        except jwt.InvalidTokenError as e:
            logger.error(f"❌ Invalid JWT token: {str(e)}")
            return None, {'error': 'Invalid token'}, 401
        
        # 🔥 FIX: token banate waqt 'sub' use ho raha hai, wahi read karo
        user_id = payload.get('sub')
        logger.debug(f"👤 User ID from token: {user_id}")
        
        if not user_id:
            logger.error("❌ No user_id (sub) in token payload")
            return None, {'error': 'Invalid token payload'}, 401
        
        # Use DatabaseHelpers to get user
        logger.debug(f"🔍 Looking up user in database: {user_id}")
        user = mongo.get_user_by_id(user_id)
        
        if not user:
            logger.error(f"❌ User not found in database with ID: {user_id}")
            logger.debug("💾 Debugging user lookup:")
            try:
                # Debug information
                sample_users = list(mongo.users_collection.find({}).limit(5))
                for i, u in enumerate(sample_users):
                    logger.debug(f"   User {i+1}: ID={u.get('_id', 'N/A')}, Email={u.get('email', 'N/A')}")
                    
                total_users = mongo.users_collection.count_documents({})
                logger.debug(f"📊 Total users in database: {total_users}")
                
            except Exception as e:
                logger.error(f"Failed to debug user lookup: {e}")
            
            return None, {'error': 'User not found'}, 404
        
        logger.debug(f"✅ User found: {user.get('email', user.get('_id', 'unknown'))}")
        return user, None, None
        
    except Exception as e:
        logger.error(f"💥 Token verification failed: {str(e)}")
        return None, {'error': f'Token verification failed: {str(e)}'}, 500


@user_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'User routes are working',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@user_bp.route('/debug/token', methods=['GET'])
def debug_token():
    """Debug endpoint to check token without database lookup"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        
        return jsonify({
            'status': 'Token is valid',
            'payload': payload,
            'expires': datetime.fromtimestamp(payload['exp']).isoformat()
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': f'Token debug failed: {str(e)}'}), 500

@user_bp.route('/debug/database-helper', methods=['GET'])
def debug_database_helper():
    """Debug endpoint to check DatabaseHelpers methods"""
    try:
        import inspect
        
        # Check available methods
        available_methods = [method for method in dir(mongo) if not method.startswith('_')]
        
        return jsonify({
            'database_connected': True,
            'available_methods': available_methods,
            'users_collection_exists': hasattr(mongo, 'users_collection')
        }), 200
            
    except Exception as e:
        return jsonify({
            'error': 'DatabaseHelpers debug failed',
            'details': str(e)
        }), 500



@user_bp.route('/profile', methods=['GET'])
def get_user_profile():
    """Get user profile information with enhanced debugging"""
    logger.debug("📊 Profile endpoint called")
    
    try:
        # Verify user
        user, error, status_code = verify_token_and_get_user()
        if error:
            logger.error(f"❌ User verification failed: {error}")
            return jsonify(error), status_code
        
        logger.debug("✅ User verified, fetching profile data")
        
        # ... (aapka statistics wala code waise hi rahega) ...
        reports_count = 0
        analyses_count = 0
        try:
            user_lookup_id = user.get('_id') # Use _id for queries
            reports_count = mongo.db.reports.count_documents({'user_id': user_lookup_id})
            analyses_count = mongo.db.analyses.count_documents({'user_id': user_lookup_id})
        except Exception as e:
            logger.error(f"💥 Database query for stats failed: {e}")

        
        # Prepare profile data with safe field access
        profile_data = {
            'name': user.get('name'),
            'email': user.get('email'),
            'phone': user.get('phone'),
            'dateOfBirth': user.get('dateOfBirth'),
            'gender': user.get('gender'),
            'bloodType': user.get('bloodType'),
            'emergencyContact': user.get('emergencyContact'),
            'allergies': user.get('allergies'),
            'medications': user.get('medications'),
            'preferences': user.get('preferences', {}),
            
            # --- YEH LINE ADD KARNI HAI ---
            # Database se profile picture ka URL bhi bhejein
            'profile_pic_url': user.get('profile_pic_url')
            # ---------------------------------
        }
        
        logger.debug("✅ Profile data prepared successfully")
        return jsonify({'profile': profile_data}), 200
        
    except Exception as e:
        logger.error(f"💥 Profile fetch failed: {str(e)}")
        return jsonify({'error': f'Failed to fetch profile: {str(e)}'}), 500

@user_bp.route('/profile', methods=['PUT'])
def update_user_profile():
    """Update user profile information"""
    try:
        user, error, status_code = verify_token_and_get_user()
        if error:
            return jsonify(error), status_code
        
        data = request.get_json()
        logger.debug(f"📝 Update request data: {data}")
        
        allowed_fields = [
            'name', 'phone', 'dateOfBirth', 'gender', 
            'bloodType', 'emergencyContact', 'allergies', 
            'medications', 'preferences'
        ]
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        logger.debug(f"📋 Fields to update: {update_data}")
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Add updated timestamp
        update_data['updated_at'] = datetime.utcnow()
        
        # Use the user_id from the found user document
        user_lookup_id = user.get('user_id')
        logger.debug(f"👤 Updating user with ID: {user_lookup_id}")
        
        # Direct database update since update_user method doesn't exist in DatabaseHelpers
        try:
            result = mongo.db.users.update_one(
                {'_id': user['_id']},
                {'$set': update_data}
            )
            success = result.modified_count > 0
            logger.debug(f"Database update result: {result.modified_count} documents modified")
        except Exception as e:
            logger.error(f"Database update failed: {e}")
            return jsonify({'error': f'Database update failed: {str(e)}'}), 500
        
        if not success:
            return jsonify({'error': 'No changes were made to the profile'}), 400
        
        logger.debug("✅ Profile updated successfully")
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        logger.error(f"💥 Profile update failed: {str(e)}")
        return jsonify({'error': f'An exception occurred: {str(e)}'}), 500
    
@user_bp.route('/profile/picture', methods=['POST'])
def update_profile_picture():
    """Handles profile picture uploads."""
    user, error, status_code = verify_token_and_get_user()
    if error:
        return jsonify(error), status_code

    if 'profile_pic' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['profile_pic']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file:
        filename = secure_filename(f"{user['_id']}_{file.filename}")
        upload_folder = current_app.config['UPLOAD_FOLDER']
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

        # --- THIS IS THE CORRECTED LINE ---
        # The URL now correctly points to your custom '/uploads/' route.
        profile_pic_url = f'/uploads/{filename}'
        # ---------------------------------

        mongo.db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'profile_pic_url': profile_pic_url}}
        )

        return jsonify({
            'success': True,
            'message': 'Profile picture updated successfully',
            'data': {'profile_pic_url': profile_pic_url}
        }), 200

    return jsonify({'error': 'An unknown error occurred during file upload'}), 500
    

@user_bp.route('/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard overview data"""
    try:
        # Verify user
        user, error, status_code = verify_token_and_get_user()
        if error:
            return jsonify(error), status_code
        
        # Use the user's actual _id from the database object
        user_id = user.get('_id')
        
        # Get basic counts
        total_reports = mongo.db.reports.count_documents({'user_id': user_id})
        
        # Check if analysis collection exists
        try:
            total_analyses = mongo.db.analyses.count_documents({'user_id': user_id})
        except Exception:
            total_analyses = 0
        
        # Get recent reports (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_reports = mongo.db.reports.count_documents({
            'user_id': user_id,
            'upload_date': {'$gte': thirty_days_ago}
        })
        
        # Get reports by type
        pipeline_type = [
            {'$match': {'user_id': user_id}},
            {'$group': {
                '_id': '$report_type',
                'count': {'$sum': 1}
            }}
        ]
        reports_by_type = list(mongo.db.reports.aggregate(pipeline_type))
        
        # Get processing status distribution
        pipeline_status = [
            {'$match': {'user_id': user_id}},
            {'$group': {
                '_id': '$processing_status',
                'count': {'$sum': 1}
            }}
        ]
        status_distribution = list(mongo.db.reports.aggregate(pipeline_status))
        
        # Get recent uploads
        recent_uploads = list(mongo.db.reports.find(
            {'user_id': user_id}
        ).sort('upload_date', -1).limit(10))
        
        formatted_uploads = []
        for report in recent_uploads:
            analyses = None
            try:
                analyses = mongo.db.analyses.find_one({'report_id': report.get('report_id')})
            except Exception:
                pass
                
            formatted_uploads.append({
                'report_id': report.get('report_id'),
                'name': report.get('filename', report.get('original_filename', 'Unknown')),
                'type': report.get('report_type', 'general'),
                'upload_date': report.get('upload_date').isoformat() if isinstance(report.get('upload_date'), datetime) else 'Unknown',
                'status': report.get('processing_status', 'unknown'),
                'has_analysis': bool(analyses)
            })
        
        # Get health insights summary
        health_insights = {
            'total_medications_tracked': 0,
            'total_risk_factors': 0,
            'recommendations_count': 0
        }
        
        try:
            all_analyses = list(mongo.db.analyses.find({'user_id': user_id}))
            for analysis in all_analyses:
                health_insights['total_medications_tracked'] += len(analysis.get('medications', []))
                health_insights['total_risk_factors'] += len(analysis.get('risk_factors', []))
                if analysis.get('recommendations'):
                    health_insights['recommendations_count'] += 1
        except Exception:
            pass
        
        dashboard_data = {
            'overview': {
                'total_reports': total_reports,
                'total_analyses': total_analyses,
                'recent_reports': recent_reports,
                'analysis_completion_rate': round((total_analyses / total_reports * 100) if total_reports > 0 else 0, 1)
            },
            'charts': {
                'reports_by_type': [
                    {'type': item['_id'] or 'general', 'count': item['count']}
                    for item in reports_by_type
                ],
                'status_distribution': [
                    {'status': item['_id'] or 'unknown', 'count': item['count']}
                    for item in status_distribution
                ]
            },
            'recent_uploads': formatted_uploads,
            'health_insights': health_insights
        }
        
        return jsonify({'dashboard': dashboard_data}), 200
        
    except Exception as e:
        logger.error(f"Dashboard data fetch failed: {str(e)}")
        return jsonify({'error': f'Failed to fetch dashboard data: {str(e)}'}), 500

@user_bp.route('/preferences', methods=['GET'])
def get_user_preferences():
    """Get user preferences"""
    try:
        # Verify user
        user, error, status_code = verify_token_and_get_user()
        if error:
            return jsonify(error), status_code
        
        preferences = user.get('preferences', {})
        
        # Set default preferences if not set
        default_preferences = {
            'notifications': {
                'email_reports': True,
                'analysis_ready': True,
                'health_reminders': False
            },
            'privacy': {
                'share_anonymized_data': False,
                'allow_research_use': False
            },
            'display': {
                'theme': 'light',
                'language': 'en',
                'date_format': 'MM/DD/YYYY'
            }
        }
        
        # Merge with defaults
        for key, value in default_preferences.items():
            if key not in preferences:
                preferences[key] = value
            elif isinstance(value, dict):
                for subkey, subvalue in value.items():
                    if subkey not in preferences[key]:
                        preferences[key][subkey] = subvalue
        
        return jsonify({'preferences': preferences}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch preferences: {str(e)}'}), 500

@user_bp.route('/preferences', methods=['PUT'])
def update_user_preferences():
    """Update user preferences"""
    try:
        # Verify user
        user, error, status_code = verify_token_and_get_user()
        if error:
            return jsonify(error), status_code
        
        data = request.get_json()
        preferences = data.get('preferences', {})
        
        if not isinstance(preferences, dict):
            return jsonify({'error': 'Invalid preferences format'}), 400
        
        # Update preferences directly in database
        user_id = user.get('user_id')
        result = mongo.users_collection.update_one(
            {'user_id': user_id}, 
            {'$set': {'preferences': preferences, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Failed to update preferences'}), 500
        
        return jsonify({'message': 'Preferences updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Preferences update failed: {str(e)}'}), 500

@user_bp.route('/export-data', methods=['POST'])
def export_user_data():
    """Export user's data (GDPR compliance)"""
    try:
        # Verify user
        user, error, status_code = verify_token_and_get_user()
        if error:
            return jsonify(error), status_code
        
        user_id = user.get('user_id')
        
        # Get all user data
        user_data = {
            'profile': {
                'user_id': user_id,
                'name': user.get('name'),
                'email': user.get('email'),
                'created_at': user['created_at'].isoformat() if user.get('created_at') else None,
                'preferences': user.get('preferences', {})
            },
            'reports': [],
            'analyses': []
        }
        
        # Get reports
        reports = list(mongo.reports_collection.find({'user_id': user_id}))
        for report in reports:
            user_data['reports'].append({
                'report_id': report.get('report_id'),
                'name': report.get('filename', report.get('original_filename', '')),
                'type': report.get('report_type', ''),
                'upload_date': report['upload_date'].isoformat() if report.get('upload_date') else None,
                'status': report.get('processing_status', ''),
                'extracted_text': report.get('ocr_data', {}).get('raw_text', '')
            })
        
        # Get analyses if collection exists
        try:
            analyses = list(mongo.db.analyses.find({'user_id': user_id}))
            for analysis in analyses:
                user_data['analyses'].append({
                    'analysis_id': analysis.get('analysis_id'),
                    'report_id': analysis.get('report_id'),
                    'created_at': analysis['created_at'].isoformat() if analysis.get('created_at') else None,
                    'insights': analysis.get('insights', {}),
                    'recommendations': analysis.get('recommendations', {}),
                    'medications': analysis.get('medications', []),
                    'risk_factors': analysis.get('risk_factors', [])
                })
        except:
            # If analysis collection doesn't exist, keep empty array
            pass
        
        return jsonify({
            'message': 'Data export prepared',
            'data': user_data,
            'export_date': datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Data export failed: {str(e)}'}), 500
    
@user_bp.route('/reportsanalysis', methods=['GET'])
def get_user_reportsanalysis():
    """Return list of report_id and analysis_id for the authenticated user"""
    try:
        # Verify user
        user, error, status_code = verify_token_and_get_user()
        if error:
            return jsonify(error), status_code

        user_id = user.get('user_id')

        # Fetch reports for user
        reports = list(mongo.reports_collection.find(
            {'user_id': user_id},
            {'_id': 0, 'report_id': 1}
        ))

        # Fetch analyses for user if collection exists
        analyses = []
        try:
            analyses = list(mongo.db.analyses.find(
                {'user_id': user_id},
                {'_id': 0, 'analysis_id': 1, 'report_id': 1}
            ))
        except:
            # If analysis collection doesn't exist, keep empty array
            pass

        return jsonify({
            'user_id': user_id,
            'reports': reports,
            'analyses': analyses
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch report data: {str(e)}'}), 500