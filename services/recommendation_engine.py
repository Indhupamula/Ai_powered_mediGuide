from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass

@dataclass
class DietaryRecommendation:
    category: str
    foods_to_include: List[str]
    foods_to_avoid: List[str]
    reasoning: str

@dataclass
class LifestyleRecommendation:
    category: str
    recommendation: str
    frequency: str
    benefits: List[str]

class RecommendationEngine:
    """Service for generating personalized health recommendations based on medical analysis"""
    
    def __init__(self):
        self.dietary_guidelines = self._load_dietary_guidelines()
        self.lifestyle_guidelines = self._load_lifestyle_guidelines()
        self.medication_guidelines = self._load_medication_guidelines()
    
    def generate_recommendations(self, data):
        try:
            test_results = data.get('test_results', [])
            medications = data.get('medications', [])
            risk_factors = data.get('risk_factors', [])

            # Example: parse test_results if they're strings
            parsed_results = []
            for result in test_results:
                if isinstance(result, str):
                    parsed_results.append(result.lower())  # or custom parsing

            # Create dummy recommendations
            return {
                "dietary": ["Reduce sugar intake"] if "sugar" in ' '.join(parsed_results) else [],
                "lifestyle": ["Exercise daily"] if "blood pressure" in ' '.join(parsed_results) else [],
                "medication_management": ["Review insulin dosage"] if "insulin" in [m.lower() for m in medications] else [],
                "follow_up": ["Schedule a check-up in 3 months"],
                "emergency_signs": [],
                "general_wellness": ["Stay hydrated", "Sleep 7-8 hours"]
            }
        except Exception as e:
            return {
                "error": str(e),
                "dietary": [],
                "lifestyle": [],
                "medication_management": [],
                "follow_up": [],
                "emergency_signs": [],
                "general_wellness": []
            }
    
    def _generate_dietary_recommendations(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate dietary recommendations based on test results and conditions"""
        recommendations = []
        
        # Analyze test results for dietary implications
        test_results = analysis.get('test_results', [])
        
        for test in test_results:
            test_name = test['name'].lower()
            status = test['status']
            value = test.get('value', 0)
            
            # Glucose/Diabetes related recommendations
            if 'glucose' in test_name and status in ['high', 'critical']:
                recommendations.append({
                    'category': 'Blood Sugar Management',
                    'foods_to_include': [
                        'Leafy green vegetables (spinach, kale)',
                        'Whole grains (brown rice, quinoa, oats)',
                        'Lean proteins (chicken, fish, tofu)',
                        'Nuts and seeds (almonds, chia seeds)',
                        'Berries (blueberries, strawberries)',
                        'Cinnamon and turmeric'
                    ],
                    'foods_to_avoid': [
                        'Refined sugars and sweets',
                        'White bread and pasta',
                        'Sugary drinks and sodas',
                        'Processed foods',
                        'Fried foods',
                        'High-glycemic fruits (watermelon, pineapple)'
                    ],
                    'reasoning': f'Your glucose level ({value} {test["unit"]}) is elevated. These dietary changes can help manage blood sugar levels.',
                    'meal_timing': 'Eat smaller, frequent meals every 3-4 hours',
                    'portion_control': 'Use the plate method: 1/2 vegetables, 1/4 lean protein, 1/4 whole grains'
                })
            
            # Cholesterol related recommendations
            elif 'cholesterol' in test_name and status in ['high', 'critical']:
                recommendations.append({
                    'category': 'Heart-Healthy Diet',
                    'foods_to_include': [
                        'Fatty fish (salmon, mackerel, sardines)',
                        'Oats and barley',
                        'Beans and lentils',
                        'Avocados',
                        'Olive oil',
                        'Nuts (walnuts, almonds)',
                        'Apples and citrus fruits'
                    ],
                    'foods_to_avoid': [
                        'Saturated fats (red meat, butter)',
                        'Trans fats (processed foods)',
                        'Full-fat dairy products',
                        'Fried foods',
                        'Processed meats',
                        'Baked goods with hydrogenated oils'
                    ],
                    'reasoning': f'Your cholesterol level ({value} {test["unit"]}) is elevated. These foods can help lower cholesterol naturally.',
                    'cooking_tips': 'Use olive oil instead of butter, grill or bake instead of frying'
                })
            
            # Hemoglobin/Anemia related recommendations
            elif 'hemoglobin' in test_name and status in ['low', 'critical']:
                recommendations.append({
                    'category': 'Iron-Rich Diet',
                    'foods_to_include': [
                        'Red meat (in moderation)',
                        'Dark leafy greens (spinach, Swiss chard)',
                        'Beans and lentils',
                        'Iron-fortified cereals',
                        'Tofu and tempeh',
                        'Pumpkin seeds',
                        'Dark chocolate',
                        'Vitamin C rich foods (oranges, bell peppers)'
                    ],
                    'foods_to_avoid': [
                        'Tea and coffee with meals (reduces iron absorption)',
                        'Calcium supplements with iron-rich meals',
                        'Whole grains with iron-rich meals (if taken together)'
                    ],
                    'reasoning': f'Your hemoglobin level ({value} {test["unit"]}) is low. These iron-rich foods can help improve your levels.',
                    'absorption_tips': 'Combine iron-rich foods with vitamin C sources for better absorption'
                })
            
            # Blood pressure related recommendations
            elif 'blood pressure' in test_name or 'bp' in test_name:
                if status in ['high', 'abnormal']:
                    recommendations.append({
                        'category': 'DASH Diet for Blood Pressure',
                        'foods_to_include': [
                            'Fruits and vegetables (8-10 servings daily)',
                            'Whole grains',
                            'Low-fat dairy products',
                            'Lean meats and fish',
                            'Nuts and seeds',
                            'Potassium-rich foods (bananas, oranges, potatoes)'
                        ],
                        'foods_to_avoid': [
                            'High sodium foods (processed foods, canned soups)',
                            'Pickled and cured foods',
                            'Restaurant and fast foods',
                            'Excessive alcohol',
                            'Foods high in saturated fats'
                        ],
                        'reasoning': 'Your blood pressure is elevated. The DASH diet has been proven to lower blood pressure.',
                        'sodium_limit': 'Limit sodium to less than 2,300mg per day (ideally 1,500mg)',
                        'potassium_goal': 'Aim for 3,500-4,700mg of potassium daily'
                    })
        
        # Add general healthy eating recommendations if no specific issues found
        if not recommendations:
            recommendations.append({
                'category': 'General Healthy Eating',
                'foods_to_include': [
                    'Variety of colorful fruits and vegetables',
                    'Whole grains',
                    'Lean proteins',
                    'Healthy fats (olive oil, nuts, avocados)',
                    'Adequate water intake (8-10 glasses daily)'
                ],
                'foods_to_avoid': [
                    'Excessive processed foods',
                    'Too much added sugar',
                    'Excessive saturated fats',
                    'Too much sodium'
                ],
                'reasoning': 'Your test results appear normal. Maintain a balanced diet for optimal health.',
                'general_tips': 'Follow the MyPlate guidelines for balanced nutrition'
            })
        
        return recommendations
    
    def _generate_lifestyle_recommendations(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate lifestyle recommendations based on analysis"""
        recommendations = []
        
        # Exercise recommendations based on conditions
        test_results = analysis.get('test_results', [])
        risk_factors = analysis.get('risk_factors', [])
        
        # General exercise recommendations
        exercise_rec = {
            'category': 'Physical Activity',
            'recommendations': [
                'Aim for at least 150 minutes of moderate-intensity aerobic activity per week',
                'Include muscle-strengthening activities 2+ days per week',
                'Start slowly if you\'re not currently active',
                'Include flexibility and balance exercises'
            ],
            'specific_activities': [],
            'precautions': []
        }
        
        # Customize based on specific conditions
        has_high_glucose = any('glucose' in test['name'].lower() and test['status'] in ['high', 'critical'] 
                             for test in test_results)
        has_high_cholesterol = any('cholesterol' in test['name'].lower() and test['status'] in ['high', 'critical'] 
                                 for test in test_results)
        has_high_bp = any('pressure' in test['name'].lower() and test['status'] in ['high', 'abnormal'] 
                         for test in test_results)
        
        if has_high_glucose:
            exercise_rec['specific_activities'].extend([
                'Brisk walking after meals',
                'Swimming',
                'Cycling',
                'Resistance training with light weights'
            ])
            exercise_rec['precautions'].extend([
                'Monitor blood sugar before and after exercise',
                'Carry glucose tablets if on diabetes medication',
                'Stay hydrated during exercise'
            ])
        
        if has_high_cholesterol:
            exercise_rec['specific_activities'].extend([
                'Aerobic exercises (running, cycling, swimming)',
                'Interval training',
                'Dancing',
                'Team sports'
            ])
        
        if has_high_bp:
            exercise_rec['specific_activities'].extend([
                'Moderate aerobic exercise',
                'Yoga and tai chi',
                'Light weight training',
                'Water aerobics'
            ])
            exercise_rec['precautions'].extend([
                'Avoid heavy lifting or straining',
                'Monitor blood pressure regularly',
                'Start exercise gradually'
            ])
        
        recommendations.append(exercise_rec)
        
        # Sleep recommendations
        recommendations.append({
            'category': 'Sleep Hygiene',
            'recommendations': [
                'Aim for 7-9 hours of sleep per night',
                'Maintain consistent sleep schedule',
                'Create a relaxing bedtime routine',
                'Keep bedroom cool, dark, and quiet',
                'Avoid screens 1 hour before bedtime',
                'Limit caffeine after 2 PM'
            ],
            'benefits': [
                'Better blood sugar control',
                'Improved cardiovascular health',
                'Enhanced immune function',
                'Better mental health'
            ]
        })
        
        # Stress management recommendations
        recommendations.append({
            'category': 'Stress Management',
            'recommendations': [
                'Practice deep breathing exercises daily',
                'Try meditation or mindfulness (10-15 minutes daily)',
                'Engage in hobbies you enjoy',
                'Maintain social connections',
                'Consider counseling if needed',
                'Practice time management'
            ],
            'techniques': [
                '4-7-8 breathing technique',
                'Progressive muscle relaxation',
                'Guided meditation apps',
                'Journaling',
                'Nature walks'
            ]
        })
        
        # Smoking cessation (if applicable)
        recommendations.append({
            'category': 'Smoking Cessation',
            'recommendations': [
                'Consult healthcare provider about cessation programs',
                'Consider nicotine replacement therapy',
                'Identify and avoid triggers',
                'Find healthy alternatives to smoking',
                'Join support groups',
                'Set a quit date and stick to it'
            ],
            'benefits': [
                'Reduced cardiovascular risk',
                'Better lung function',
                'Improved circulation',
                'Lower cancer risk'
            ],
            'note': 'If you don\'t smoke, continue avoiding tobacco and secondhand smoke'
        })
        
        return recommendations
    
    def _generate_medication_recommendations(self, medications: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate medication management recommendations"""
        recommendations = []
        
        # General medication management
        recommendations.append({
            'category': 'Medication Adherence',
            'recommendations': [
                'Take medications exactly as prescribed',
                'Use pill organizers or medication apps for reminders',
                'Don\'t skip doses or stop medications without consulting your doctor',
                'Keep an updated list of all medications',
                'Inform all healthcare providers about your medications',
                'Store medications properly (temperature, light, moisture)'
            ],
            'tips': [
                'Set phone alarms for medication times',
                'Link taking medications to daily routines',
                'Keep emergency medication information accessible'
            ]
        })
        
        # Specific medication interactions and precautions
        med_names = [med['name'].lower() for med in medications]
        
        # Check for common medication categories and provide specific advice
        if any('metformin' in name for name in med_names):
            recommendations.append({
                'category': 'Diabetes Medication Management',
                'recommendations': [
                    'Take metformin with meals to reduce stomach upset',
                    'Monitor blood sugar levels as directed',
                    'Report persistent nausea, vomiting, or stomach pain',
                    'Avoid excessive alcohol consumption',
                    'Stay hydrated, especially during illness'
                ],
                'side_effects_to_watch': [
                    'Metallic taste in mouth',
                    'Nausea or vomiting',
                    'Diarrhea',
                    'Stomach pain'
                ]
            })
        
        if any('statin' in name or any(word in name for word in ['atorvastatin', 'simvastatin', 'rosuvastatin']) for name in med_names):
            recommendations.append({
                'category': 'Cholesterol Medication Management',
                'recommendations': [
                    'Take as directed, usually in the evening',
                    'Report muscle pain or weakness immediately',
                    'Avoid grapefruit juice (can increase drug levels)',
                    'Regular liver function tests as recommended',
                    'Continue healthy diet and exercise'
                ],
                'side_effects_to_watch': [
                    'Muscle pain or weakness',
                    'Dark-colored urine',
                    'Unusual fatigue',
                    'Abdominal pain'
                ]
            })
        
        if any('ace inhibitor' in name or any(word in name for word in ['lisinopril', 'enalapril', 'captopril']) for name in med_names):
            recommendations.append({
                'category': 'Blood Pressure Medication Management',
                'recommendations': [
                    'Take at the same time each day',
                    'Monitor blood pressure regularly',
                    'Rise slowly from sitting or lying positions',
                    'Avoid potassium supplements unless prescribed',
                    'Report persistent dry cough'
                ],
                'side_effects_to_watch': [
                    'Persistent dry cough',
                    'Dizziness or lightheadedness',
                    'Swelling of face, lips, or tongue',
                    'Rapid or irregular heartbeat'
                ]
            })
        
        return recommendations
    
    def _generate_followup_recommendations(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate follow-up care recommendations"""
        recommendations = []
        
        test_results = analysis.get('test_results', [])
        risk_factors = analysis.get('risk_factors', [])
        
        # General follow-up
        recommendations.append({
            'category': 'Regular Health Monitoring',
            'recommendations': [
                'Schedule regular check-ups with your primary care physician',
                'Keep track of your health metrics',
                'Maintain updated health records',
                'Follow preventive care guidelines for your age group'
            ],
            'frequency': 'Annual physical exam, or as recommended by your doctor'
        })
        
        # Specific follow-ups based on test results
        critical_results = [test for test in test_results if test['status'] == 'critical']
        high_results = [test for test in test_results if test['status'] == 'high']
        
        if critical_results:
            recommendations.append({
                'category': 'Urgent Follow-up',
                'recommendations': [
                    'Contact your healthcare provider immediately',
                    'Do not delay seeking medical attention',
                    'Bring your test results to the appointment',
                    'Follow all medical advice strictly'
                ],
                'urgency': 'Within 24-48 hours',
                'critical_values': [f"{test['name']}: {test['value']} {test['unit']}" for test in critical_results]
            })
        
        if high_results:
            recommendations.append({
                'category': 'Routine Follow-up',
                'recommendations': [
                    'Schedule appointment with your doctor within 1-2 weeks',
                    'Discuss treatment options if needed',
                    'Plan for repeat testing as recommended',
                    'Consider specialist referral if needed'
                ],
                'timeline': '1-2 weeks for non-critical elevated values'
            })
        
        # Specific monitoring based on conditions
        has_diabetes_risk = any('glucose' in test['name'].lower() and test['status'] in ['high', 'critical'] 
                               for test in test_results)
        if has_diabetes_risk:
            recommendations.append({
                'category': 'Diabetes Monitoring',
                'recommendations': [
                    'HbA1c testing every 3-6 months',
                    'Annual eye examinations',
                    'Annual foot examinations',
                    'Regular kidney function tests',
                    'Blood pressure monitoring'
                ],
                'specialists': ['Endocrinologist', 'Ophthalmologist', 'Podiatrist']
            })
        
        has_heart_risk = any('cholesterol' in test['name'].lower() or 'pressure' in test['name'].lower() 
                            for test in test_results if test['status'] in ['high', 'abnormal'])
        if has_heart_risk:
            recommendations.append({
                'category': 'Cardiovascular Monitoring',
                'recommendations': [
                    'Lipid panel every 6-12 months',
                    'Blood pressure checks regularly',
                    'Consider cardiac risk assessment',
                    'EKG as recommended by doctor'
                ],
                'specialists': ['Cardiologist']
            })
        
        return recommendations
    
    def _generate_emergency_signs(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate emergency warning signs to watch for"""
        emergency_signs = []
        
        test_results = analysis.get('test_results', [])
        medications = analysis.get('medications', [])
        
        # General emergency signs
        emergency_signs.append({
            'category': 'General Emergency Signs',
            'signs': [
                'Chest pain or pressure',
                'Difficulty breathing or shortness of breath',
                'Severe headache',
                'Loss of consciousness or fainting',
                'Severe abdominal pain',
                'High fever (>101.3°F/38.5°C)',
                'Severe allergic reactions'
            ],
            'action': 'Call 911 or go to emergency room immediately'
        })
        
        # Diabetes-related emergency signs
        has_diabetes_indicators = any('glucose' in test['name'].lower() for test in test_results)
        if has_diabetes_indicators:
            emergency_signs.append({
                'category': 'Blood Sugar Emergencies',
                'signs': [
                    'Blood sugar below 70 mg/dL with symptoms',
                    'Blood sugar above 400 mg/dL',
                    'Persistent vomiting',
                    'Signs of dehydration',
                    'Fruity breath odor',
                    'Confusion or altered mental state',
                    'Rapid breathing'
                ],
                'action': 'Check blood sugar immediately and seek emergency care if severe'
            })
        
        # Medication-related emergency signs
        if medications:
            med_names = [med['name'].lower() for med in medications]
            
            if any('warfarin' in name or 'blood thinner' in name for name in med_names):
                emergency_signs.append({
                    'category': 'Blood Thinner Emergency Signs',
                    'signs': [
                        'Unusual bleeding that won\'t stop',
                        'Blood in urine or stool',
                        'Severe headache',
                        'Dizziness or weakness',
                        'Unusual bruising'
                    ],
                    'action': 'Seek immediate medical attention'
                })
        
        return emergency_signs
    
    def _generate_wellness_recommendations(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate general wellness recommendations"""
        recommendations = []
        
        # Preventive care
        recommendations.append({
            'category': 'Preventive Care',
            'recommendations': [
                'Stay up to date with vaccinations',
                'Regular dental checkups (every 6 months)',
                'Annual eye exams',
                'Skin cancer screening',
                'Age-appropriate cancer screenings',
                'Bone density testing (if applicable)'
            ]
        })
        
        # Mental health
        recommendations.append({
            'category': 'Mental Health & Well-being',
            'recommendations': [
                'Practice mindfulness or meditation',
                'Maintain social connections',
                'Engage in activities you enjoy',
                'Seek help if feeling depressed or anxious',
                'Practice gratitude',
                'Set realistic health goals'
            ]
        })
        
        # Hydration and nutrition basics
        recommendations.append({
            'category': 'Basic Nutrition & Hydration',
            'recommendations': [
                'Drink adequate water (8-10 glasses daily)',
                'Eat regular, balanced meals',
                'Include fruits and vegetables in every meal',
                'Limit processed foods',
                'Read nutrition labels',
                'Practice portion control'
            ]
        })
        
        return recommendations
    
    def _load_dietary_guidelines(self) -> Dict[str, Any]:
        """Load dietary guidelines database"""
        # In production, this would load from a comprehensive nutrition database
        return {
            'diabetes': {
                'carbohydrate_counting': True,
                'glycemic_index_focus': True,
                'meal_timing': 'regular'
            },
            'hypertension': {
                'dash_diet': True,
                'sodium_restriction': True,
                'potassium_increase': True
            },
            'hyperlipidemia': {
                'saturated_fat_limit': True,
                'omega3_increase': True,
                'fiber_increase': True
            }
        }
    
    def _load_lifestyle_guidelines(self) -> Dict[str, Any]:
        """Load lifestyle guidelines database"""
        return {
            'exercise': {
                'aerobic_minutes_per_week': 150,
                'strength_training_days': 2,
                'flexibility_daily': True
            },
            'sleep': {
                'hours_per_night': {'min': 7, 'max': 9},
                'consistent_schedule': True
            },
            'stress_management': {
                'daily_relaxation': True,
                'social_support': True
            }
        }
    
    def _load_medication_guidelines(self) -> Dict[str, Any]:
        """Load medication management guidelines"""
        return {
            'adherence': {
                'timing_consistency': True,
                'dose_accuracy': True,
                'monitoring_required': True
            },
            'interactions': {
                'food_interactions': True,
                'drug_interactions': True,
                'supplement_interactions': True
            }
        }