# debug_routes.py - Add these routes to your Flask app

from flask import Blueprint, jsonify, request
from utils.database import DatabaseHelpers , mongo
import logging

debug_bp = Blueprint('debug', __name__, url_prefix='/debug')

@debug_bp.route('/user/<user_id>/reports', methods=['GET'])
def debug_user_reports(user_id):
    """Complete debug view of user's reports and analyses"""
    try:
        # Get all reports for user
        reports_data = DatabaseHelpers.get_user_reports(user_id, page=1, per_page=100)
        reports = reports_data['reports']
        
        result = {
            'user_id': user_id,
            'total_reports': len(reports),
            'reports_summary': [],
            'detailed_reports': []
        }
        
        for report in reports:
            report_id = report['report_id']
            
            # Get all analyses for this report
            analyses = DatabaseHelpers.get_all_analyses_by_report_id(report_id)
            
            # Summary for quick overview
            summary = {
                'report_id': report_id,
                'filename': report.get('filename', 'N/A'),
                'upload_date': str(report.get('upload_date', 'N/A')),
                'ocr_data_exists': bool(report.get('ocr_data')),
                'ocr_data_length': len(report.get('ocr_data', '')),
                'total_analyses': len(analyses),
                'analysis_types': [a.get('analysis_type', 'unknown') for a in analyses]
            }
            result['reports_summary'].append(summary)
            
            # Detailed view
            detailed = {
                'report_id': report_id,
                'report_data': {
                    'filename': report.get('filename'),
                    'upload_date': str(report.get('upload_date')),
                    'processing_status': report.get('processing_status'),
                    'ocr_data_preview': report.get('ocr_data', '')[:200] + '...' if report.get('ocr_data') else 'EMPTY'
                },
                'analyses': []
            }
            
            for analysis in analyses:
                analysis_detail = {
                    'analysis_id': analysis.get('analysis_id'),
                    '_id': analysis.get('_id'),
                    'type': analysis.get('analysis_type'),
                    'created_at': str(analysis.get('created_at')),
                    'has_result': bool(analysis.get('result')),
                    'result_type': type(analysis.get('result')).__name__ if analysis.get('result') else 'None',
                    'result_length': len(str(analysis.get('result', '')))
                }
                
                # Add result preview
                result_data = analysis.get('result', '')
                if isinstance(result_data, dict):
                    analysis_detail['result_preview'] = str(result_data)[:300] + '...'
                elif isinstance(result_data, str):
                    analysis_detail['result_preview'] = result_data[:300] + '...'
                else:
                    analysis_detail['result_preview'] = str(result_data)[:300] + '...'
                
                detailed['analyses'].append(analysis_detail)
            
            result['detailed_reports'].append(detailed)
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Debug user reports failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/report/<report_id>/complete', methods=['GET'])
def debug_complete_report(report_id):
    """Get complete report data including all analyses"""
    try:
        # Get report
        report = DatabaseHelpers.get_report_by_id(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        # Get all analyses
        analyses = DatabaseHelpers.get_all_analyses_by_report_id(report_id)
        
        # Organize analyses by type
        analyses_by_type = {}
        for analysis in analyses:
            analysis_type = analysis.get('analysis_type', 'unknown')
            analyses_by_type[analysis_type] = analysis
        
        result = {
            'report_id': report_id,
            'report': {
                'filename': report.get('filename'),
                'upload_date': str(report.get('upload_date')),
                'user_id': report.get('user_id'),
                'processing_status': report.get('processing_status'),
                'ocr_data_exists': bool(report.get('ocr_data')),
                'ocr_data_length': len(report.get('ocr_data', '')),
                'ocr_data': report.get('ocr_data', '')  # Full OCR data
            },
            'analyses': {
                'total_count': len(analyses),
                'types_found': list(analyses_by_type.keys()),
                'by_type': {}
            }
        }
        
        # Add each analysis type
        for analysis_type, analysis in analyses_by_type.items():
            result['analyses']['by_type'][analysis_type] = {
                'analysis_id': analysis.get('analysis_id'),
                '_id': analysis.get('_id'),
                'created_at': str(analysis.get('created_at')),
                'result': analysis.get('result'),  # Full result data
                'result_type': type(analysis.get('result')).__name__ if analysis.get('result') else 'None'
            }
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Debug complete report failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/analysis/<analysis_id>/full', methods=['GET'])
def debug_full_analysis(analysis_id):
    """Get complete analysis data"""
    try:
        analysis = DatabaseHelpers.get_analysis_by_id(analysis_id)
        if not analysis:
            return jsonify({'error': 'Analysis not found'}), 404
        
        return jsonify({
            'analysis_id': analysis_id,
            'full_analysis': analysis
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add this to your main app.py
# app.register_blueprint(debug_bp)

# ===== FIXED API ROUTE FOR DASHBOARD =====
@debug_bp.route('/api/reports/<report_id>', methods=['GET'])
def get_report_details_fixed(report_id):
    """Fixed version of get report details"""
    try:
        print(f"=== FETCHING REPORT DETAILS FOR {report_id} ===")
        
        # Get report data
        report = DatabaseHelpers.get_report_by_id(report_id)
        if not report:
            print(f"Report {report_id} not found")
            return jsonify({'error': 'Report not found'}), 404
        
        # Get all analyses for this report
        analyses = DatabaseHelpers.get_all_analyses_by_report_id(report_id)
        print(f"Found {len(analyses)} analyses for report {report_id}")
        
        # Initialize response structure
        response = {
            'report_id': report_id,
            'filename': report.get('filename'),
            'upload_date': str(report.get('upload_date')),
            'processing_status': report.get('processing_status', 'completed'),
            'has_ocr_data': bool(report.get('ocr_data')),
            'ocr_data': report.get('ocr_data', ''),
            'analyses': {
                'ocr_entities': None,
                'ai_entities': None
            },
            'metadata': {
                'total_analyses': len(analyses),
                'analysis_types': []
            }
        }
        
        # Process each analysis
        for analysis in analyses:
            analysis_id = analysis.get('analysis_id') or analysis.get('_id')
            analysis_type = analysis.get('analysis_type', 'unknown')
            
            print(f"Processing analysis: ID={analysis_id}, Type={analysis_type}")
            
            # Add to metadata
            response['metadata']['analysis_types'].append(analysis_type)
            
            # Store analysis data
            analysis_data = {
                'analysis_id': analysis_id,
                'type': analysis_type,
                'created_at': str(analysis.get('created_at')),
                'result': analysis.get('result'),
                'has_result': bool(analysis.get('result'))
            }
            
            if analysis_type == 'ocr_entities':
                response['analyses']['ocr_entities'] = analysis_data
                print("✓ OCR Analysis found")
            elif analysis_type == 'ai_entities':
                response['analyses']['ai_entities'] = analysis_data
                print("✓ AI Analysis found")
            else:
                # Store other types dynamically
                response['analyses'][analysis_type] = analysis_data
                print(f"✓ {analysis_type} Analysis found")
        
        # Final verification
        has_ocr = response['analyses']['ocr_entities'] is not None
        has_ai = response['analyses']['ai_entities'] is not None
        
        print(f"Final results: OCR={'YES' if has_ocr else 'NO'}, AI={'YES' if has_ai else 'NO'}")
        print(f"Returning response with OCR: {'YES' if response['has_ocr_data'] else 'NO'}")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error fetching report details: {str(e)}")
        logging.error(f"Error in get_report_details: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===== DASHBOARD API ROUTE =====
@debug_bp.route('/api/dashboard/<user_id>', methods=['GET'])
def get_dashboard_data_fixed(user_id):
    """Fixed dashboard endpoint with complete data"""
    try:
        print(f"=== FETCHING DASHBOARD DATA FOR USER {user_id} ===")
        
        # Get user reports
        reports_data = DatabaseHelpers.get_user_reports(user_id, page=1, per_page=50)
        reports = reports_data['reports']
        
        print(f"Found {len(reports)} reports for user {user_id}")
        
        dashboard_data = {
            'user_id': user_id,
            'total_reports': len(reports),
            'reports': [],
            'summary': {
                'total_analyses': 0,
                'completed_reports': 0,
                'pending_reports': 0
            }
        }
        
        for report in reports:
            report_id = report['report_id']
            print(f"Processing report {report_id}")
            
            # Get analyses for this report
            analyses = DatabaseHelpers.get_all_analyses_by_report_id(report_id)
            
            # Organize analyses
            analyses_by_type = {}
            for analysis in analyses:
                analysis_type = analysis.get('analysis_type', 'unknown')
                analyses_by_type[analysis_type] = {
                    'analysis_id': analysis.get('analysis_id') or analysis.get('_id'),
                    'result': analysis.get('result'),
                    'created_at': str(analysis.get('created_at')),
                    'has_result': bool(analysis.get('result'))
                }
            
            # Create report summary
            report_summary = {
                'report_id': report_id,
                'filename': report.get('filename'),
                'upload_date': str(report.get('upload_date')),
                'processing_status': report.get('processing_status', 'completed'),
                'has_ocr_data': bool(report.get('ocr_data')),
                'ocr_data_length': len(report.get('ocr_data', '')),
                'total_analyses': len(analyses),
                'analyses': analyses_by_type
            }
            
            dashboard_data['reports'].append(report_summary)
            dashboard_data['summary']['total_analyses'] += len(analyses)
            
            # Update summary counts
            if len(analyses) > 0:
                dashboard_data['summary']['completed_reports'] += 1
            else:
                dashboard_data['summary']['pending_reports'] += 1
            
            print(f"Report {report_id}: {len(analyses)} analyses, OCR: {bool(report.get('ocr_data'))}")
        
        print(f"Dashboard summary: {dashboard_data['summary']}")
        return jsonify(dashboard_data)
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        logging.error(f"Error in dashboard: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===== TEST ENDPOINTS =====
@debug_bp.route('/test/db-connection', methods=['GET'])
def test_db_connection():
    """Test database connection and basic queries"""
    try:
        # Test connection
        mongo.cx.admin.command('ping')
        
        # Test collections
        reports_count = mongo.db.reports.count_documents({})
        analyses_count = mongo.db.analysis.count_documents({})
        users_count = mongo.db.users.count_documents({})
        
        # Sample data
        sample_report = mongo.db.reports.find_one()
        sample_analysis = mongo.db.analysis.find_one()
        
        return jsonify({
            'status': 'success',
            'connection': 'OK',
            'collections': {
                'reports': reports_count,
                'analyses': analyses_count,
                'users': users_count
            },
            'sample_data': {
                'report_fields': list(sample_report.keys()) if sample_report else [],
                'analysis_fields': list(sample_analysis.keys()) if sample_analysis else []
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500