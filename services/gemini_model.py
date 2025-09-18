import os
import google.generativeai as genai
import logging
import json
from flask import current_app

logger = logging.getLogger(__name__)

def configure_gemini():
    """Configures the Gemini API with the key from the app config."""
    api_key = current_app.config.get('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("Gemini API key is missing.")
    genai.configure(api_key=api_key)
    logger.info("Gemini AI SDK configured successfully.")

def get_master_analysis(report_text: str) -> dict:
    """
    Analyzes medical report text and generates a single, comprehensive JSON object
    containing all data needed for every feature page.
    """
    if not report_text or not report_text.strip():
        return {"error": "Input text for AI analysis is empty or invalid."}

    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
    except Exception as e:
        logger.error(f"Could not initialize Gemini model: {e}")
        return {"error": "Gemini AI model is not available or configured."}

    # ------------------------
    # Strong Prompt Enforcement with JSON format instructions
    # ------------------------
    prompt = f"""
    You are a master medical analysis AI for the "MediGuide AI" project.

    Analyze the medical report text below and generate a JSON object 
    with **exactly 3 top-level keys**:
    - "dashboardData"
    - "insightsData"
    - "dietData"

    ⚠️ CRITICAL INSTRUCTIONS:
    - ONLY return valid JSON format - no markdown, no explanations, no extra text
    - Start your response with {{ and end with }}
    - Do NOT leave any array empty.
    - If the report lacks data, create **realistic placeholder data**.
    - Always include **all required fields** as described in the schema.

    ------------------------
    JSON Schema (must follow)
    ------------------------

    {{
      "dashboardData": {{
        "patientInformation": {{
          "name": "string",
          "age": "string",
          "gender": "string",
          "advisedDate": "string"
        }},
        "keyMetrics": [ {{ "title": "string", "value": "string", "change": "string", "description": "string", "target": "string" }} ],
        "recentReports": [ {{ "name": "string", "date": "string", "doctor": "string", "status": "string", "score": "string" }} ],
        "alerts": [ {{ "message": "string", "time": "string", "level": "high|medium|low" }} ],
        "healthTrends": [ {{ "period": "string", "metric": "string", "value": "string", "change": "string" }} ],
        "upcomingAppointments": [ {{ "type": "string", "doctor": "string", "dateTime": "string", "location": "string" }} ],
        "testResults": [ {{ "testName": "string", "result": "string", "unit": "string", "range": "string" }} ]
      }},
      "insightsData": {{
        "healthMetrics": [ {{ "name": "string", "value": "string", "trend": "string", "color": "string" }} ],
        "insightsDashboard": [ {{ "id": "string", "title": "string", "count": "number", "items": ["string"] }} ],
        "riskAssessment": [ {{ "factor": "string", "risk": "string", "description": "string" }} ],
        "personalizedActionPlan": {{
          "shortTerm": ["string"],
          "longTerm": ["string"]
        }}
      }},
      "dietData": {{
        "healthConditions": [ {{ "name": "string", "level": "string", "color": "string", "recommendations": ["string"] }} ],
        "foodRecommendations": {{
          "recommended": [{{ "food": "string" }}],
          "limit": [{{ "food": "string" }}],
          "caution": [{{ "food": "string" }}]
        }},
        "mealPlans": {{
          "balanced": {{
            "title": "string",
            "description": "string",
            "summary": {{
              "dailyCalories": "string",
              "macronutrients": {{ "carbs": "string", "protein": "string", "fat": "string" }},
              "mealCount": "string"
            }},
            "meals": [ {{ "mealType": "string", "time": "string", "calories": "string", "items": ["string"], "highlight": "string" }} ]
          }},
          "diabeticFriendly": {{
            "title": "string",
            "description": "string",
            "summary": {{
              "dailyCalories": "string",
              "macronutrients": {{ "carbs": "string", "protein": "string", "fat": "string" }},
              "mealCount": "string"
            }},
            "meals": [ {{ "mealType": "string", "time": "string", "calories": "string", "items": ["string"], "highlight": "string" }} ]
          }}
        }},
        "nutritionalGoals": [ {{ "goal": "string" }} ],
        "weeklyMenu": [ {{ "day": "string", "theme": "string", "mealSuggestion": "string" }} ],
        "mealPrepTips": {{
          "sundayPrep": ["string"],
          "storageTips": ["string"]
        }},
        "progressSummary": {{
          "goalsImproving": "string",
          "averageProgress": "string",
          "areasNeedAttention": "string"
        }}
      }}
    }}

    Remember: Return ONLY the JSON object, nothing else.

    ------------------------
    Medical Report to Analyze:
    ------------------------
    {report_text}
    """

    try:
        logger.info("Sending request to Gemini API for MASTER analysis...")
        
        # Remove the response_mime_type parameter for compatibility with v0.3.2
        response = model.generate_content(prompt)

        raw_text = response.text.strip()
        logger.debug(f"Raw Gemini response: {raw_text[:200]}...")  # only log first 200 chars

        # Clean the response text - remove markdown formatting if present
        if raw_text.startswith('```json'):
            raw_text = raw_text.replace('```json', '').replace('```', '').strip()
        elif raw_text.startswith('```'):
            raw_text = raw_text.replace('```', '').strip()

        # Find the JSON object in the response
        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_text = raw_text[start_idx:end_idx + 1]
        else:
            json_text = raw_text

        analysis_data = json.loads(json_text)
        logger.info("Successfully received and parsed MASTER analysis from Gemini API.")
        return analysis_data

    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from Gemini response. Error: {e}")
        logger.error(f"Raw response: {raw_text}")
        
        # Return a fallback structure
        return {
            "error": "Failed to parse AI analysis. The response was not valid JSON.",
            "raw_response": raw_text[:500] if 'raw_text' in locals() else "No response received"
        }
    except Exception as e:
        logger.error(f"An error occurred while communicating with the Gemini API: {e}")
        return {"error": f"An unexpected error occurred with the AI service: {str(e)}"}

def extract_json_from_text(text: str) -> str:
    """
    Helper function to extract JSON from text that might contain markdown or other formatting
    """
    # Remove markdown code blocks
    text = text.replace('```json', '').replace('```', '').strip()
    
    # Find the first { and last }
    start = text.find('{')
    end = text.rfind('}')
    
    if start != -1 and end != -1:
        return text[start:end + 1]
    
    return text