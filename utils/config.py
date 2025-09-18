
# /utils/config.py

import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

class Config:
    """
    Flask configuration class.
    Loads configuration variables from environment variables.
    Updated for MongoDB Atlas and Render deployment.
    """
    # --- Flask Core Configuration ---
    SECRET_KEY = os.getenv('SECRET_KEY', 'a-fallback-secret-key-for-development')
    DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')
    
    # --- Database Configuration ---
    # MongoDB Atlas connection URI (cloud database)
    # Format: mongodb+srv://username:password@cluster.mongodb.net/database_name
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/mediguide_ai')
    
    # Database name for your application
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'mediguide_ai')
    
    # --- JWT Authentication Configuration ---
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'a-fallback-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour default
    
    # --- File Upload Configuration ---
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB default
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    PROCESSED_FOLDER = os.getenv('PROCESSED_FOLDER', 'processed')
    
    # Allowed file extensions for uploads
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'doc', 'docx'}
    
    # --- External API Services Configuration ---
    # Google Gemini AI API key
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # OCR Service Configuration
    OCR_API_KEY = os.getenv('OCR_API_KEY')
    OCR_API_URL = os.getenv('OCR_API_URL', 'https://api.ocr.space/parse/image')
    
    # --- Email Configuration (for notifications) ---
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    
    # --- CORS Configuration ---
    # Multiple origins can be separated by comma
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # --- Logging Configuration ---
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'mediguide.log')
    
    # --- Rate Limiting Configuration ---
    RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', 60))
    
    # --- Production/Deployment Configuration ---
    PRODUCTION = os.getenv('PRODUCTION', 'False').lower() in ('true', '1', 't')
    PORT = int(os.getenv('PORT', 5000))  # Render sets this automatically
    
    # --- Security Configuration ---
    SECURITY_HEADERS = os.getenv('SECURITY_HEADERS', 'True').lower() in ('true', '1', 't')
    
    # --- Cloud Storage Configuration (Optional for future use) ---
    STORAGE_TYPE = os.getenv('STORAGE_TYPE', 'local')
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET')
    AWS_S3_REGION = os.getenv('AWS_S3_REGION', 'us-east-1')
    
    @staticmethod
    def init_app(app):
        """Initialize application with configuration-specific settings."""
        pass
    
    @staticmethod
    def validate_required_env_vars():
        """
        Validate that all required environment variables are set.
        Raises ValueError if any required variables are missing.
        """
        required_vars = [
            'GEMINI_API_KEY',
            'MONGO_URI'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/mediguide_ai')


class ProductionConfig(Config):
    """Production configuration for deployment."""
    DEBUG = False
    
    # In production, these should be set via environment variables
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    
    # MongoDB Atlas URI (required for production)
    MONGO_URI = os.getenv('MONGO_URI')
    
    # Ensure all required vars are set in production
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        cls.validate_required_env_vars()


# Configuration dictionary for easy switching
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
