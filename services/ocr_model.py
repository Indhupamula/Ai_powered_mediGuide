# /services/ocr_service.py

import requests
import logging
import os
from flask import current_app

logger = logging.getLogger(__name__)

def extract_text_from_file(file_path: str) -> str:
    """
    Extracts text from an image or PDF file using the configured OCR API.

    Args:
        file_path: The absolute path to the file.

    Returns:
        The extracted text as a string, or None if extraction fails.
    """
    config = current_app.config
    api_key = config.get('OCR_API_KEY')
    api_url = config.get('OCR_API_URL')

    if not api_key or not api_url:
        logger.error("OCR_API_KEY or OCR_API_URL is not configured.")
        raise ValueError("OCR API credentials are not set.")

    if not os.path.exists(file_path):
        logger.error(f"File not found for OCR at path: {file_path}")
        return None

    try:
        with open(file_path, 'rb') as f:
            payload = {
                'apikey': api_key,
                'language': 'eng',
                'isOverlayRequired': False,
                'detectOrientation': True,
                'scale': True
            }
            files = {'file': (os.path.basename(file_path), f)}
            
            logger.info(f"Sending file '{os.path.basename(file_path)}' to OCR service at {api_url}...")
            
            # --- THIS IS THE FIX ---
            # We increase the timeout to 120 seconds (2 minutes) to give the slow, free API
            # more time to process the file and respond.
            response = requests.post(api_url, data=payload, files=files, timeout=120)
            
            response.raise_for_status()

        result = response.json()
        
        if result.get("IsErroredOnProcessing"):
            error_message = result.get('ErrorMessage', ['Unknown OCR error'])[0]
            logger.error(f"OCR API Error: {error_message}")
            return None
            
        if not result.get("ParsedResults"):
            logger.warning("No text could be parsed from the document.")
            return ""

        extracted_text = result["ParsedResults"][0]["ParsedText"]
        logger.info("Successfully extracted text from the document via OCR.")
        return extracted_text.strip()

    except requests.exceptions.RequestException as e:
        logger.error(f"HTTP Request to OCR API failed: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during OCR processing: {e}")
        return None
