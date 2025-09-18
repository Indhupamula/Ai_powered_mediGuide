
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
from utils.config import Config
import logging
from typing import Optional, Tuple
import hashlib
import magic

class FileHandler:
    """Service for handling file uploads and management"""
    
    @staticmethod
    def allowed_file(filename: str) -> bool:
        """
        Check if file extension is allowed
        
        Args:
            filename: Name of the uploaded file
        
        Returns:
            True if file type is allowed, False otherwise
        """
        if not filename:
            return False
        
        extension = FileHandler.get_file_extension(filename)
        return extension.lower() in Config.ALLOWED_EXTENSIONS
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """
        Get file extension from filename
        
        Args:
            filename: Name of the file
        
        Returns:
            File extension without the dot
        """
        if '.' in filename:
            return filename.rsplit('.', 1)[1].lower()
        return ''
    
    @staticmethod
    def validate_file(file) -> Tuple[bool, str]:
        """
        Comprehensive file validation
        
        Args:
            file: Flask file object
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check if file exists
            if not file or not file.filename:
                return False, "No file provided"
            
            # Check file extension
            if not FileHandler.allowed_file(file.filename):
                return False, f"File type not allowed. Allowed types: {', '.join(Config.ALLOWED_EXTENSIONS)}"
            
            # Check file size (Flask handles this automatically with MAX_CONTENT_LENGTH)
            # But we can add additional checks here
            
            # Read first few bytes to validate file signature
            file.seek(0)
            file_header = file.read(1024)
            file.seek(0)  # Reset file pointer
            
            # Validate file signature/magic number
            if not FileHandler._validate_file_signature(file_header, FileHandler.get_file_extension(file.filename)):
                return False, "Invalid file format or corrupted file"
            
            return True, "File is valid"
            
        except Exception as e:
            logging.error(f"File validation error: {str(e)}")
            return False, f"File validation failed: {str(e)}"
    
    @staticmethod
    def _validate_file_signature(file_header: bytes, extension: str) -> bool:
        """
        Validate file signature against expected format
        
        Args:
            file_header: First few bytes of file
            extension: File extension
        
        Returns:
            True if file signature matches extension
        """
        try:
            # Common file signatures
            signatures = {
                'pdf': [b'%PDF'],
                'png': [b'\x89PNG\r\n\x1a\n'],
                'jpg': [b'\xff\xd8\xff\xe0', b'\xff\xd8\xff\xe1', b'\xff\xd8\xff\xdb'],
                'jpeg': [b'\xff\xd8\xff\xe0', b'\xff\xd8\xff\xe1', b'\xff\xd8\xff\xdb'],
                'gif': [b'GIF87a', b'GIF89a'],
                'tiff': [b'II*\x00', b'MM\x00*'],
                'bmp': [b'BM']
            }
            
            if extension not in signatures:
                return True  # Allow unknown extensions for now
            
            expected_signatures = signatures[extension]
            
            for signature in expected_signatures:
                if file_header.startswith(signature):
                    return True
            
            return False
            
        except Exception as e:
            logging.warning(f"File signature validation failed: {str(e)}")
            return True  # Allow file if signature validation fails
    
    @staticmethod
    def save_file(file, filename: str) -> Optional[str]:
        """
        Save uploaded file to disk
        
        Args:
            file: Flask file object
            filename: Desired filename (should be unique)
        
        Returns:
            Full path to saved file, or None if save failed
        """
        try:
            # Validate file first
            is_valid, error_message = FileHandler.validate_file(file)
            if not is_valid:
                logging.error(f"File validation failed: {error_message}")
                return None
            
            # Ensure upload directory exists
            upload_path = Config.UPLOAD_FOLDER
            os.makedirs(upload_path, exist_ok=True)
            
            # Create full file path
            file_path = os.path.join(upload_path, filename)
            
            # Save file
            file.save(file_path)
            
            # Verify file was saved correctly
            if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                logging.error("File was not saved correctly")
                return None
            
            logging.info(f"File saved successfully: {file_path}")
            return file_path
            
        except Exception as e:
            logging.error(f"Failed to save file: {str(e)}")
            return None
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Delete file from disk
        
        Args:
            file_path: Full path to file
        
        Returns:
            True if file was deleted successfully
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.info(f"File deleted successfully: {file_path}")
                return True
            else:
                logging.warning(f"File not found for deletion: {file_path}")
                return False
                
        except Exception as e:
            logging.error(f"Failed to delete file {file_path}: {str(e)}")
            return False
    
    @staticmethod
    def get_file_info(file_path: str) -> dict:
        """
        Get information about a file
        
        Args:
            file_path: Full path to file
        
        Returns:
            Dictionary containing file information
        """
        try:
            if not os.path.exists(file_path):
                return {'error': 'File not found'}
            
            stat = os.stat(file_path)
            
            # Get file hash for integrity checking
            file_hash = FileHandler._calculate_file_hash(file_path)
            
            # Try to get MIME type
            try:
                mime_type = magic.from_file(file_path, mime=True)
            except:
                mime_type = 'application/octet-stream'
            
            return {
                'size': stat.st_size,
                'created_at': stat.st_ctime,
                'modified_at': stat.st_mtime,
                'hash': file_hash,
                'mime_type': mime_type,
                'extension': FileHandler.get_file_extension(os.path.basename(file_path))
            }
            
        except Exception as e:
            logging.error(f"Failed to get file info for {file_path}: {str(e)}")
            return {'error': str(e)}
    
    @staticmethod
    def _calculate_file_hash(file_path: str) -> str:
        """
        Calculate SHA-256 hash of file
        
        Args:
            file_path: Full path to file
        
        Returns:
            SHA-256 hash as hex string
        """
        try:
            hash_sha256 = hashlib.sha256()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception as e:
            logging.error(f"Failed to calculate hash for {file_path}: {str(e)}")
            return ""
    
    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """
        Generate unique filename while preserving extension
        
        Args:
            original_filename: Original filename from upload
        
        Returns:
            Unique filename
        """
        try:
            # Secure the filename
            secure_name = secure_filename(original_filename)
            
            # Get extension
            extension = FileHandler.get_file_extension(secure_name)
            
            # Generate unique identifier
            unique_id = str(uuid.uuid4())
            
            # Combine to create unique filename
            if extension:
                return f"{unique_id}.{extension}"
            else:
                return unique_id
                
        except Exception as e:
            logging.error(f"Failed to generate unique filename: {str(e)}")
            return str(uuid.uuid4())
    
    @staticmethod
    def cleanup_old_files(days_old: int = 30) -> int:
        """
        Clean up files older than specified days
        
        Args:
            days_old: Number of days after which files should be deleted
        
        Returns:
            Number of files deleted
        """
        try:
            import time
            from datetime import datetime, timedelta
            
            cutoff_time = time.time() - (days_old * 24 * 60 * 60)
            deleted_count = 0
            
            upload_path = Config.UPLOAD_FOLDER
            if not os.path.exists(upload_path):
                return 0
            
            for filename in os.listdir(upload_path):
                file_path = os.path.join(upload_path, filename)
                
                try:
                    if os.path.isfile(file_path):
                        file_modified_time = os.path.getmtime(file_path)
                        
                        if file_modified_time < cutoff_time:
                            os.remove(file_path)
                            deleted_count += 1
                            logging.info(f"Deleted old file: {file_path}")
                            
                except Exception as file_error:
                    logging.error(f"Failed to delete file {file_path}: {str(file_error)}")
                    continue
            
            logging.info(f"Cleanup completed. Deleted {deleted_count} old files.")
            return deleted_count
            
        except Exception as e:
            logging.error(f"File cleanup failed: {str(e)}")
            return 0
    
    @staticmethod
    def get_storage_usage() -> dict:
        """
        Get storage usage statistics
        
        Returns:
            Dictionary with storage usage information
        """
        try:
            upload_path = Config.UPLOAD_FOLDER
            
            if not os.path.exists(upload_path):
                return {
                    'total_files': 0,
                    'total_size': 0,
                    'average_size': 0
                }
            
            total_size = 0
            total_files = 0
            
            for filename in os.listdir(upload_path):
                file_path = os.path.join(upload_path, filename)
                if os.path.isfile(file_path):
                    total_size += os.path.getsize(file_path)
                    total_files += 1
            
            average_size = total_size / total_files if total_files > 0 else 0
            
            return {
                'total_files': total_files,
                'total_size': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'average_size': round(average_size, 2),
                'average_size_mb': round(average_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            logging.error(f"Failed to get storage usage: {str(e)}")
            return {
                'error': str(e),
                'total_files': 0,
                'total_size': 0
            }
