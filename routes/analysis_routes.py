
import os
import logging
from datetime import datetime
from flask import Blueprint, jsonify, current_app
from bson.objectid import ObjectId
from routes.auth_routes import token_required   # ✅ import auth decorator

# Import master analysis + OCR
from services.gemini_model import get_master_analysis
from services.ocr_model import extract_text_from_file

logger = logging.getLogger(__name__)
analysis_bp = Blueprint('analysis_bp', __name__)


# ================================
# 📌 Create Master Analysis (Latest Report for Current User)
# ================================
@analysis_bp.route('/create', methods=['POST'])
@token_required
def create_master_analysis(current_user):
    """
    Performs OCR, generates a single MASTER analysis object for 
    the latest uploaded report of the logged-in user.
    """
    mongo = current_app.mongo

    # ✅ get latest report for this user
    report_meta = mongo.db.reports.find_one(
        {"user_id": current_user["_id"]},
        sort=[("upload_date", -1)]
    )
    if not report_meta:
        return jsonify({'success': False, 'error': 'No reports found for this user.'}), 404

    file_path = report_meta.get('filepath')
    if not file_path or not os.path.exists(file_path):
        return jsonify({'success': False, 'error': 'Report file is missing'}), 500

    extracted_text = extract_text_from_file(file_path)
    if extracted_text is None:
        return jsonify({'success': False, 'error': 'Failed to extract text from report.'}), 500

    # ✅ Call Gemini for AI analysis
    analysis_result = get_master_analysis(extracted_text)
    if 'error' in analysis_result:
        return jsonify({'success': False, 'error': analysis_result['error']}), 500

    # ✅ Ensure required top-level keys exist
    for key in ["dashboardData", "insightsData", "dietData"]:
        if key not in analysis_result:
            analysis_result[key] = {}

    # ✅ Save / update analysis in DB
    mongo.db.analyses.update_one(
        {'report_id': report_meta['_id']},
        {'$set': {
            'analysis_data': analysis_result,
            'created_at': datetime.utcnow()
        }},
        upsert=True
    )

    # Mark report as completed
    mongo.db.reports.update_one(
        {'_id': report_meta['_id']}, 
        {'$set': {'status': 'completed'}}
    )

    return jsonify({
        'success': True,
        'message': 'Analysis complete',
        'report_id': str(report_meta['_id']),
        'analysis': analysis_result
    }), 200


# ================================
# 📌 Get Saved Analysis (All Reports of Current User)
# ================================
@analysis_bp.route('/get', methods=['GET'])
@token_required
def get_saved_analysis(current_user):
    """
    Retrieves all saved analyses for the logged-in user.
    """
    mongo = current_app.mongo
    try:
        reports = mongo.db.reports.find({"user_id": current_user["_id"]})

        all_analysis = []
        for report in reports:
            analysis_doc = mongo.db.analyses.find_one({'report_id': report["_id"]})
            if analysis_doc:
                all_analysis.append({
                    "report_id": str(report["_id"]),
                    "original_filename": report.get("original_filename"),
                    "analysis": analysis_doc.get("analysis_data")
                })

        if not all_analysis:
            return jsonify({'success': False, 'error': 'No analyses found for this user.'}), 404

        return jsonify({'success': True, 'analyses': all_analysis}), 200

    except Exception as e:
        logger.error(f"Failed to fetch analyses for user {current_user['_id']}: {e}")
        return jsonify({'success': False, 'error': 'An internal error occurred.'}), 500
