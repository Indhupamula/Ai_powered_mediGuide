from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import logging
from bson import ObjectId
from bson import json_util
import json
from routes.auth_routes import token_required   


logger = logging.getLogger(__name__)
report_bp = Blueprint('report_bp', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ================================
# 📌 Upload Report
# ================================
@report_bp.route('/upload', methods=['POST'])
@token_required
def upload_report(current_user):
    """Handles medical report upload, runs OCR + Gemini analysis, and saves metadata & insights in DB."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
        
        upload_folder = current_app.config['UPLOAD_FOLDER']
        file_path = os.path.join(upload_folder, unique_filename)

        try:
            file.save(file_path)
            logger.info(f"File saved successfully to {file_path}")

            mongo = current_app.mongo
            report_data = {
                'user_id': current_user['_id'],   # ✅ Link report with user
                'original_filename': filename,
                'saved_filename': unique_filename,
                'filepath': os.path.join('uploads', unique_filename).replace("\\", "/"),
                'upload_date': datetime.utcnow(),
                'content_type': file.mimetype,
                'status': 'processing'   # ⬅️ abhi processing mark karte hain
            }
            result = mongo.db.reports.insert_one(report_data)
            report_id = result.inserted_id

            mongo.db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"last_report_id": report_id}}
            )

            # --------------------------
            # STEP 1: Run OCR
            from services.ocr_model import extract_text_from_file
            extracted_text = extract_text_from_file(file_path)
            print('====================EXTRACTED TEXT============') 
            print(extracted_text)

            if not extracted_text:
                mongo.db.reports.update_one({'_id': report_id}, {'$set': {'status': 'ocr_failed'}})
                return jsonify({'success': False, 'error': 'Failed to extract text from report.'}), 500

            # STEP 2: Run Gemini Analysis
            from services.gemini_model import get_master_analysis
            analysis_result = get_master_analysis(extracted_text)
            print('====================DATA PRINTING============')
            print(analysis_result)

            if not analysis_result or "error" in analysis_result:
                mongo.db.reports.update_one({'_id': report_id}, {'$set': {'status': 'analysis_failed'}})
                return jsonify({'success': False, 'error': 'Failed to generate analysis from Gemini.'}), 500

            # STEP 3: Save analysis in DB
            mongo.db.analyses.update_one(
                {'report_id': report_id},
                {'$set': {
                    'user_id': current_user["_id"],   # ✅ Link analysis with user
                    'report_id': report_id,           # ✅ Keep report reference
                    'analysis_data': analysis_result,
                    'created_at': datetime.utcnow()
                }},
                upsert=True
            )

            # Update report status
            mongo.db.reports.update_one({'_id': report_id}, {'$set': {'status': 'completed'}})

            return jsonify({
                'success': True,
                'message': 'File uploaded & analysis completed successfully.',
                'report_id': str(report_id),
                'analysis': analysis_result
            }), 201

        except Exception as e:
            logger.error(f"Error during file upload/processing: {e}")
            return jsonify({'success': False, 'error': 'An internal error occurred.'}), 500
    else:
        return jsonify({'success': False, 'error': 'File type not allowed.'}), 400


# ================================
# 📌 List User Reports
# ================================
@report_bp.route('/list', methods=['GET'])
@token_required
def list_reports(current_user):
    """Return all reports for the logged-in user."""
    try:
        mongo = current_app.mongo
        reports_cursor = mongo.db.reports.find(
            {"user_id": current_user["_id"]}
        ).sort('upload_date', -1).limit(5)

        reports_list = list(reports_cursor)
        reports_json = json.loads(json_util.dumps(reports_list))

        return jsonify({'success': True, 'reports': reports_json}), 200
    except Exception as e:
        logger.error(f"Failed to fetch report list: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to retrieve reports.'}), 500
    
# ================================
# 📌 DeleteUser Reports
# ================================

@report_bp.route('/delete/<report_id>', methods=['DELETE'])
@token_required
def delete_report(current_user, report_id):
    """Delete a report by ID for the logged-in user."""
    try:
        mongo = current_app.mongo

        # Make sure the report belongs to the current user
        result = mongo.db.reports.delete_one({
            "_id": ObjectId(report_id),
            "user_id": current_user["_id"]
        })

        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'error': 'Report not found or not authorized.'
            }), 404

        return jsonify({'success': True, 'message': 'Report deleted successfully.'}), 200

    except Exception as e:
        logger.error(f"Failed to delete report: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to delete report.'}), 500


# ================================
# 📌 Get All Insights (no report_id)
# ================================
@report_bp.route('/<report_id>/insights', methods=['GET'])
@token_required
def get_insights_for_report(current_user, report_id):
    """Return insights for a specific report of logged-in user."""
    try:
        mongo = current_app.mongo
        report = mongo.db.reports.find_one({"_id": ObjectId(report_id), "user_id": current_user["_id"]})

        if not report:
            return jsonify({"success": False, "error": "Report not found"}), 404

        analysis = mongo.db.analyses.find_one({"report_id": report["_id"]})
        insights_data = {}
        if analysis and "analysis_data" in analysis:
            insights_data = analysis["analysis_data"].get("insightsData", {})

        return jsonify({"success": True, "insights_data": insights_data}), 200

    except Exception as e:
        logger.error(f"Failed to fetch insights for report {report_id}: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


# ================================
# 📌 Get All Analyses (no report_id)
# ================================
@report_bp.route('/<report_id>/analysis', methods=['GET'])
@token_required
def get_report_analysis(current_user, report_id):
    """Return analysis for a specific report of logged-in user."""
    try:
        mongo = current_app.mongo

        # Check if report belongs to current user
        report = mongo.db.reports.find_one({
            "_id": ObjectId(report_id),
            "user_id": current_user["_id"]
        })
        if not report:
            return jsonify({'success': False, 'error': 'Report not found'}), 404

        # Get analysis for that report
        analysis = mongo.db.analyses.find_one({"report_id": ObjectId(report_id)})
        if not analysis or "analysis_data" not in analysis:
            return jsonify({'success': False, 'error': 'No analysis found for this report'}), 404

        return jsonify({
            "success": True,
            "report_id": str(report_id),
            "analysis": analysis["analysis_data"]
        }), 200

    except Exception as e:
        logger.error(f"Error fetching analysis for report {report_id}: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch analysis data'}), 500


# ================================
# 📌 Get All Diet Data (no report_id)
# ================================
@report_bp.route('/<report_id>/diet', methods=['GET'])
@token_required
def get_diet_by_report(current_user, report_id):
    """Return diet data for a specific report of the logged-in user."""
    try:
        mongo = current_app.mongo

        # 1️⃣ Convert report_id to ObjectId
        try:
            report_obj_id = ObjectId(report_id)
        except Exception:
            return jsonify({"success": False, "error": "Invalid report_id"}), 400

        # 2️⃣ Check that this report belongs to the current user
        report = mongo.db.reports.find_one({"_id": report_obj_id, "user_id": current_user["_id"]})
        if not report:
            return jsonify({"success": False, "error": "Report not found or unauthorized"}), 404

        # 3️⃣ Fetch diet data for this specific report
        analysis = mongo.db.analyses.find_one(
            {"report_id": report_obj_id},
            {"analysis_data.dietData": 1, "_id": 0}
        )

        if analysis and "analysis_data" in analysis and "dietData" in analysis["analysis_data"]:
            return jsonify({
                "success": True,
                "report_id": report_id,
                "dietData": analysis["analysis_data"]["dietData"]
            }), 200

        return jsonify({"success": False, "error": "No diet data found for this report"}), 404

    except Exception as e:
        logger.error(f"Error fetching diet data: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch diet data'}), 500
    
@report_bp.route('/last', methods=['GET'])
@token_required
def get_last_report(current_user):
    """Return the last uploaded report of the logged-in user."""
    try:
        mongo = current_app.mongo

        # Convert current_user _id to ObjectId if it's a string, or keep as ObjectId
        user_id = current_user["_id"]
        if isinstance(user_id, str):
            from bson import ObjectId
            user_id = ObjectId(user_id)

        # Get last report for this user, sorted by upload_date
        last_report = mongo.db.reports.find_one(
            {"user_id": user_id},
            sort=[("upload_date", -1)]
        )

        if not last_report:
            return jsonify({"success": False, "error": "No reports found"}), 404

        # Convert all ObjectId fields to strings for JSON serialization
        last_report["_id"] = str(last_report["_id"])
        if "user_id" in last_report:
            last_report["user_id"] = str(last_report["user_id"])
        
        # Convert any other ObjectId fields that might exist
        for key, value in last_report.items():
            if hasattr(value, 'ObjectId') or str(type(value)).find('ObjectId') != -1:
                last_report[key] = str(value)

        return jsonify({"success": True, "report": last_report}), 200

    except Exception as e:
        # Convert user_id to string for logging to avoid the serialization error
        user_id_str = str(current_user["_id"]) if current_user and "_id" in current_user else "unknown"
        logger.error(f"Failed to fetch last report for user {user_id_str}: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500
