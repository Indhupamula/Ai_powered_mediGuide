# app.py

import os
import logging
import json
from datetime import datetime
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from bson import ObjectId

# Import configurations and initializers
from utils.config import Config, config
from utils.database import init_db
from services.gemini_model import configure_gemini

# Import Blueprints (route modules)
from routes.auth_routes import auth_bp
from routes.report_routes import report_bp
from routes.analysis_routes import analysis_bp
from routes.user_routes import user_bp

# Set logging level for external libraries to reduce noise
logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("asyncio").setLevel(logging.WARNING)


def create_app(config_name=None):
    """
    Create and configure the Flask application.
    
    Args:
        config_name (str): Configuration environment ('development', 'production', or None for auto-detect)
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)
    
    # --- 1. Determine Configuration Environment ---
    if config_name is None:
        # Auto-detect environment based on environment variables
        config_name = 'production' if os.getenv('PRODUCTION', 'False').lower() in ('true', '1', 't') else 'development'
    
    # Load appropriate configuration
    app.config.from_object(config[config_name])
    
    # Initialize configuration-specific settings
    config[config_name].init_app(app)
    
    # --- MongoDB JSON Encoder ---
    class MongoJSONEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, ObjectId):
                return str(obj)
            return super().default(obj)
    
    app.json_encoder = MongoJSONEncoder
    
    # --- 2. Configure CORS for Cross-Origin Requests ---
    # Allow requests from frontend (React/Vue/etc.) running on different port/domain
    cors_origins = app.config.get('CORS_ORIGINS', [
        'https://cura-genie-zeta.vercel.app',
        'http://localhost:5173', 
        'http://localhost:5174', 
    ])
    if isinstance(cors_origins, str):
        cors_origins = cors_origins.split(',')
    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        allow_headers=["Authorization", "Content-Type"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        supports_credentials=True
    )

    # --- 3. Configure Application Logging ---
    log_level = getattr(logging, app.config['LOG_LEVEL'].upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        filename=app.config.get('LOG_FILE', 'mediguide.log'),
        filemode='a'
    )
    
    # Add console logging in development
    if app.config['DEBUG']:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(log_level)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(formatter)
        logging.getLogger().addHandler(console_handler)

    logger = logging.getLogger(__name__)
    logger.info(f"Flask application starting in {config_name} mode")
    
    # --- 4. Create Required Directories ---
    # Create upload and processed folders if they don't exist
    upload_folder = app.config['UPLOAD_FOLDER']
    processed_folder = app.config['PROCESSED_FOLDER']
    
    try:
        os.makedirs(upload_folder, exist_ok=True)
        os.makedirs(processed_folder, exist_ok=True)
        logger.info(f"Created directories: {upload_folder}, {processed_folder}")
    except Exception as e:
        logger.error(f"Failed to create directories: {e}")
    
    # --- 5. Initialize Database and External Services ---
    with app.app_context():
        try:
            # Initialize MongoDB connection
            init_db(app)
            logger.info("Database connection initialized successfully")
            
            # Test database connection (handle Flask-PyMongo None db issue)
            if app.mongo.db is not None:
                app.mongo.db.command('ping')
                logger.info("Database connection test successful")
            else:
                logger.info("Database connection successful (Flask-PyMongo workaround active)")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            if config_name == 'production':
                raise  # Fail fast in production if DB is not available
        
        try:
            # Configure Gemini AI service
            configure_gemini()
            logger.info("Gemini AI service configured successfully")
        except ValueError as e:
            logger.critical(f"CRITICAL ERROR: Gemini AI configuration failed: {e}")
            if config_name == 'production':
                raise  # Fail fast in production if Gemini is not configured
    
    # --- 6. Register Application Blueprints (Route Modules) ---
    app.register_blueprint(report_bp, url_prefix='/api/reports')
    app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')  
    app.register_blueprint(user_bp, url_prefix='/api/user')
    
    logger.info("All blueprints registered successfully")
    
    # --- 7. Define Core Application Routes ---
    
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint - API information and health status."""
        return jsonify({
            'service': 'MediGuide AI Backend',
            'status': 'running',
            'version': '1.0.0',
            'environment': config_name,
            'timestamp': datetime.utcnow().isoformat(),
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'reports': '/api/reports',
                'analysis': '/api/analysis',
                'user': '/api/user'
            }
        }), 200
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint for monitoring and load balancers."""
        db_status = "connected"
        gemini_status = "configured" if app.config.get('GEMINI_API_KEY') else "not configured"
        
        try:
            # Test database connection
            app.mongo.db.command('ping')
        except Exception as e:
            db_status = f"error: {str(e)}"
            logger.error(f"Database health check failed: {e}")
        
        health_data = {
            'status': 'healthy' if db_status == 'connected' else 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'environment': config_name,
            'services': {
                'database': db_status,
                'gemini_ai': gemini_status
            },
            'uptime': 'running'
        }
        
        status_code = 200 if db_status == 'connected' else 503
        return jsonify(health_data), status_code
        
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        """
        Serve uploaded files from the upload directory.
        This endpoint allows access to uploaded medical reports and images.
        """
        try:
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        except FileNotFoundError:
            logger.warning(f"File not found: {filename}")
            return jsonify({'success': False, 'error': 'File not found'}), 404
    
    @app.route('/processed/<path:filename>')
    def serve_processed(filename):
        """
        Serve processed files from the processed directory.
        This endpoint allows access to processed analysis results.
        """
        try:
            return send_from_directory(app.config['PROCESSED_FOLDER'], filename)
        except FileNotFoundError:
            logger.warning(f"Processed file not found: {filename}")
            return jsonify({'success': False, 'error': 'Processed file not found'}), 404
        
    # --- 8. Register Global Error Handlers ---
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors - endpoint not found."""
        logger.warning(f"404 error: {error}")
        return jsonify({
            'success': False, 
            'error': 'Endpoint not found',
            'available_endpoints': ['/api/health', '/api/auth', '/api/reports', '/api/analysis', '/api/user']
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors - internal server errors."""
        logger.error(f"Internal Server Error: {error}")
        return jsonify({
            'success': False, 
            'error': 'An internal server error occurred. Please try again later.'
        }), 500
        
    @app.errorhandler(413)
    def file_too_large(error):
        """Handle 413 errors - file upload too large."""
        max_size_mb = app.config['MAX_CONTENT_LENGTH'] / (1024 * 1024)
        logger.warning(f"File upload too large: {error}")
        return jsonify({
            'success': False, 
            'error': f'File too large. Maximum size is {max_size_mb:.1f}MB'
        }), 413
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 errors - bad request."""
        logger.warning(f"Bad request: {error}")
        return jsonify({
            'success': False,
            'error': 'Bad request. Please check your request format.'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 errors - unauthorized access."""
        logger.warning(f"Unauthorized access attempt: {error}")
        return jsonify({
            'success': False,
            'error': 'Unauthorized. Please provide valid authentication.'
        }), 401

    logger.info("Flask application created and configured successfully")
    return app


def main():
    """
    Main function to run the Flask application.
    This is used when running the app directly (not through gunicorn).
    """
    # Create the Flask application
    app = create_app()
    
    # Get configuration
    port = app.config.get('PORT', 5000)
    debug = app.config.get('DEBUG', False)
    
    logger = logging.getLogger(__name__)
    logger.info(f"Starting MediGuide AI Backend on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Database URI: {app.config['MONGO_URI'][:20]}...")  # Log partial URI for security
    
    # Run the application
    app.run(
        host='0.0.0.0',  # Allow external connections (required for Render)
        port=port,
        debug=debug,
        threaded=True  # Enable threading for better performance
    )


if __name__ == '__main__':
    main()