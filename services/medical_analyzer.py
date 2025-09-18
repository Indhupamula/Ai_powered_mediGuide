import re
import json
import time
from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass

@dataclass
class LabValue:
    name: str
    value: float
    unit: str
    reference_range: str
    status: str  # normal, high, low, critical

@dataclass
class Medication:
    name: str
    dosage: str
    frequency: str
    purpose: str
    side_effects: List[str]
    interactions: List[str]

class MedicalAnalyzer:
    """Service for analyzing medical reports and extracting insights"""
    
    def __init__(self):
        self.medical_knowledge = self._load_medical_knowledge()
        self.medication_database = self._load_medication_database()
        self.reference_ranges = self._load_reference_ranges()
    
    def analyze_report(self, text: str, report_type: str = 'general') -> Dict[str, Any]:
        """
        Analyze medical report text and extract insights
        
        Args:
            text: Extracted text from medical report
            report_type: Type of report (blood_test, prescription, x_ray, etc.)
        
        Returns:
            Dictionary containing analysis results
        """
        start_time = time.time()
        
        try:
            analysis = {
                'report_type': report_type,
                'insights': {},
                'test_results': [],
                'medications': [],
                'risk_factors': [],
                'recommendations': [],
                'confidence': 0,
                'processing_time': 0
            }
            
            # Clean and preprocess text
            cleaned_text = self._preprocess_text(text)
            
            # Extract different components based on report type
            if report_type == 'blood_test' or 'blood' in text.lower():
                analysis.update(self._analyze_blood_test(cleaned_text))
            elif report_type == 'prescription' or 'rx' in text.lower():
                analysis.update(self._analyze_prescription(cleaned_text))
            elif report_type == 'x_ray' or 'x-ray' in text.lower():
                analysis.update(self._analyze_imaging(cleaned_text))
            else:
                analysis.update(self._analyze_general_report(cleaned_text))
            
            # Calculate overall confidence
            analysis['confidence'] = self._calculate_confidence(analysis, cleaned_text)
            analysis['processing_time'] = time.time() - start_time
            
            return analysis
            
        except Exception as e:
            logging.error(f"Medical analysis failed: {str(e)}")
            return {
                'error': str(e),
                'confidence': 0,
                'processing_time': time.time() - start_time
            }
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess medical report text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might interfere with analysis
        text = re.sub(r'[^\w\s\.\,\:\;\(\)\[\]\-\+\=\<\>\/\%\*]', '', text)
        
        return text.strip()
    
    def _analyze_blood_test(self, text: str) -> Dict[str, Any]:
        """Analyze blood test reports"""
        analysis = {
            'insights': {'report_category': 'Blood Test Analysis'},
            'test_results': [],
            'risk_factors': []
        }
        
        # Extract lab values
        lab_values = self._extract_lab_values(text)
        analysis['test_results'] = lab_values
        
        # Analyze each lab value
        for lab_value in lab_values:
            insights = self._analyze_lab_value(lab_value)
            if insights:
                analysis['insights'][lab_value['name']] = insights
                
                # Check for risk factors
                if lab_value['status'] in ['high', 'low', 'critical']:
                    risk_factor = self._assess_risk_factor(lab_value)
                    if risk_factor:
                        analysis['risk_factors'].append(risk_factor)
        
        return analysis
    
    def _analyze_prescription(self, text: str) -> Dict[str, Any]:
        """Analyze prescription reports"""
        analysis = {
            'insights': {'report_category': 'Prescription Analysis'},
            'medications': [],
            'risk_factors': []
        }
        
        # Extract medications
        medications = self._extract_medications(text)
        analysis['medications'] = medications
        
        # Analyze drug interactions
        interactions = self._check_drug_interactions(medications)
        if interactions:
            analysis['risk_factors'].extend(interactions)
        
        # Provide medication insights
        for medication in medications:
            med_info = self._get_medication_info(medication['name'])
            if med_info:
                analysis['insights'][medication['name']] = med_info
        
        return analysis
    
    def _analyze_imaging(self, text: str) -> Dict[str, Any]:
        """Analyze imaging reports (X-ray, CT, MRI, etc.)"""
        analysis = {
            'insights': {'report_category': 'Imaging Analysis'},
            'findings': [],
            'risk_factors': []
        }
        
        # Extract findings
        findings = self._extract_imaging_findings(text)
        analysis['findings'] = findings
        
        # Assess severity
        for finding in findings:
            if any(word in finding.lower() for word in ['abnormal', 'mass', 'fracture', 'lesion']):
                analysis['risk_factors'].append({
                    'type': 'imaging_finding',
                    'description': finding,
                    'severity': 'requires_attention'
                })
        
        return analysis
    
    def _analyze_general_report(self, text: str) -> Dict[str, Any]:
        """Analyze general medical reports"""
        analysis = {
            'insights': {'report_category': 'General Medical Report'},
            'test_results': [],
            'medications': [],
            'risk_factors': []
        }
        
        # Try to extract whatever we can
        lab_values = self._extract_lab_values(text)
        medications = self._extract_medications(text)
        vital_signs = self._extract_vital_signs(text)
        
        analysis['test_results'] = lab_values + vital_signs
        analysis['medications'] = medications
        
        # Look for concerning terms
        concerning_terms = ['abnormal', 'elevated', 'low', 'high', 'critical', 'urgent']
        for term in concerning_terms:
            if term in text.lower():
                analysis['risk_factors'].append({
                    'type': 'concerning_term',
                    'term': term,
                    'context': self._extract_context(text, term)
                })
        
        return analysis
    
    def _extract_lab_values(self, text: str) -> List[Dict[str, Any]]:
        """Extract laboratory values from text"""
        lab_values = []
        
        # Common lab value patterns
        patterns = {
            'glucose': r'(?:glucose|blood sugar|fbs|rbs)[\s:]*(\d+\.?\d*)',
            'hemoglobin': r'(?:hb|hemoglobin|hgb)[\s:]*(\d+\.?\d*)',
            'cholesterol': r'(?:cholesterol|chol)[\s:]*(\d+\.?\d*)',
            'triglycerides': r'(?:triglycerides|tg)[\s:]*(\d+\.?\d*)',
            'creatinine': r'(?:creatinine|creat)[\s:]*(\d+\.?\d*)',
            'urea': r'(?:urea|bun)[\s:]*(\d+\.?\d*)',
            'wbc': r'(?:wbc|white blood cell)[\s:]*(\d+\.?\d*)',
            'rbc': r'(?:rbc|red blood cell)[\s:]*(\d+\.?\d*)',
            'platelet': r'(?:platelet|plt)[\s:]*(\d+\.?\d*)',
            'bilirubin': r'(?:bilirubin|bili)[\s:]*(\d+\.?\d*)',
            'alt': r'(?:alt|alanine)[\s:]*(\d+\.?\d*)',
            'ast': r'(?:ast|aspartate)[\s:]*(\d+\.?\d*)',
            'ldl': r'(?:ldl)[\s:]*(\d+\.?\d*)',
            'hdl': r'(?:hdl)[\s:]*(\d+\.?\d*)',
            'hba1c': r'(?:hba1c|a1c)[\s:]*(\d+\.?\d*)'
        }
        
        for test_name, pattern in patterns.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    value = float(match.group(1))
                    
                    # Determine unit and reference range
                    unit, ref_range = self._get_reference_info(test_name)
                    
                    # Determine status
                    status = self._determine_lab_status(test_name, value, unit)
                    
                    lab_values.append({
                        'name': test_name.replace('_', ' ').title(),
                        'value': value,
                        'unit': unit,
                        'reference_range': ref_range,
                        'status': status,
                        'raw_match': match.group(0)
                    })
                except ValueError:
                    continue
        
        return lab_values
    
    def _extract_vital_signs(self, text: str) -> List[Dict[str, Any]]:
        """Extract vital signs from text"""
        vitals = []
        
        vital_patterns = {
            'blood_pressure': r'(?:bp|blood pressure)[\s:]*(\d+/\d+)',
            'heart_rate': r'(?:hr|heart rate|pulse)[\s:]*(\d+)',
            'temperature': r'(?:temp|temperature)[\s:]*(\d+\.?\d*)',
            'respiratory_rate': r'(?:rr|respiratory rate)[\s:]*(\d+)',
            'oxygen_saturation': r'(?:spo2|o2 sat|oxygen)[\s:]*(\d+\.?\d*)[\s%]*',
            'weight': r'(?:weight|wt)[\s:]*(\d+\.?\d*)',
            'height': r'(?:height|ht)[\s:]*(\d+\.?\d*)',
            'bmi': r'(?:bmi|body mass index)[\s:]*(\d+\.?\d*)'
        }
        
        for vital_name, pattern in vital_patterns.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    value_str = match.group(1)
                    
                    # Handle blood pressure specially
                    if vital_name == 'blood_pressure':
                        systolic, diastolic = map(int, value_str.split('/'))
                        vitals.append({
                            'name': 'Systolic BP',
                            'value': systolic,
                            'unit': 'mmHg',
                            'status': 'normal' if 90 <= systolic <= 140 else 'abnormal'
                        })
                        vitals.append({
                            'name': 'Diastolic BP',
                            'value': diastolic,
                            'unit': 'mmHg',
                            'status': 'normal' if 60 <= diastolic <= 90 else 'abnormal'
                        })
                    else:
                        value = float(value_str)
                        unit = self._get_vital_unit(vital_name)
                        status = self._determine_vital_status(vital_name, value)
                        
                        vitals.append({
                            'name': vital_name.replace('_', ' ').title(),
                            'value': value,
                            'unit': unit,
                            'status': status
                        })
                        
                except ValueError:
                    continue
        
        return vitals
    
    def _extract_medications(self, text: str) -> List[Dict[str, Any]]:
        """Extract medications from prescription text"""
        medications = []
        
        # Common medication patterns
        medication_patterns = [
            r'(\w+(?:cillin|mycin|azole|prazole|sartan|olol|pine|ide|ine|ate))\s*(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg)',
            r'(?:tab|tablet|cap|capsule)\s+(\w+)\s+(\d+(?:\.\d+)?)\s*(mg|g)',
            r'(\w+)\s+(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg)\s*(?:once|twice|thrice|daily|bd|tid|qid)',
        ]
        
        for pattern in medication_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    med_name = match.group(1)
                    dosage = f"{match.group(2)} {match.group(3)}"
                    
                    # Try to extract frequency
                    frequency = self._extract_frequency(text, match.start(), match.end())
                    
                    medications.append({
                        'name': med_name.title(),
                        'dosage': dosage,
                        'frequency': frequency,
                        'raw_match': match.group(0)
                    })
                except (IndexError, ValueError):
                    continue
        
        return medications
    
    def _extract_imaging_findings(self, text: str) -> List[str]:
        """Extract findings from imaging reports"""
        findings = []
        
        # Look for common finding indicators
        finding_patterns = [
            r'(?:finding|impression|conclusion)[\s:]*([^.]+)',
            r'(?:shows|demonstrates|reveals)[\s:]*([^.]+)',
            r'(?:abnormal|normal|unremarkable)[\s]*([^.]+)',
        ]
        
        for pattern in finding_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                finding = match.group(1).strip()
                if len(finding) > 10:  # Ignore very short matches
                    findings.append(finding)
        
        return findings
    
    def _get_reference_info(self, test_name: str) -> tuple:
        """Get reference range and unit for lab test"""
        reference_data = self.reference_ranges.get(test_name, {})
        return reference_data.get('unit', ''), reference_data.get('range', 'N/A')
    
    def _determine_lab_status(self, test_name: str, value: float, unit: str) -> str:
        """Determine if lab value is normal, high, low, or critical"""
        reference_data = self.reference_ranges.get(test_name, {})
        
        if 'normal_range' not in reference_data:
            return 'unknown'
        
        normal_range = reference_data['normal_range']
        
        if value < normal_range['min']:
            return 'critical' if value < normal_range.get('critical_low', 0) else 'low'
        elif value > normal_range['max']:
            return 'critical' if value > normal_range.get('critical_high', float('inf')) else 'high'
        else:
            return 'normal'
    
    def _determine_vital_status(self, vital_name: str, value: float) -> str:
        """Determine if vital sign is normal or abnormal"""
        vital_ranges = {
            'heart_rate': (60, 100),
            'temperature': (97, 99),
            'respiratory_rate': (12, 20),
            'oxygen_saturation': (95, 100),
            'weight': (50, 150),  # Very broad range
            'height': (150, 200),  # Very broad range
            'bmi': (18.5, 24.9)
        }
        
        if vital_name in vital_ranges:
            min_val, max_val = vital_ranges[vital_name]
            return 'normal' if min_val <= value <= max_val else 'abnormal'
        
        return 'unknown'
    
    def _get_vital_unit(self, vital_name: str) -> str:
        """Get unit for vital sign"""
        units = {
            'heart_rate': 'bpm',
            'temperature': '°F',
            'respiratory_rate': 'breaths/min',
            'oxygen_saturation': '%',
            'weight': 'kg',
            'height': 'cm',
            'bmi': 'kg/m²'
        }
        return units.get(vital_name, '')
    
    def _extract_frequency(self, text: str, start: int, end: int) -> str:
        """Extract medication frequency from surrounding text"""
        # Look in surrounding text for frequency indicators
        context = text[max(0, start-50):min(len(text), end+50)]
        
        frequency_patterns = [
            r'(?:once|1)\s*(?:daily|day|od)',
            r'(?:twice|2)\s*(?:daily|day|bd)',
            r'(?:thrice|3)\s*(?:daily|day|tid)',
            r'(?:four times|4)\s*(?:daily|day|qid)',
            r'every\s+\d+\s+hours?',
            r'as needed|prn'
        ]
        
        for pattern in frequency_patterns:
            match = re.search(pattern, context, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return 'as directed'
    
    def _analyze_lab_value(self, lab_value: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Provide insights for a specific lab value"""
        insights = {}
        
        test_name = lab_value['name'].lower()
        value = lab_value['value']
        status = lab_value['status']
        
        if status == 'high':
            if 'glucose' in test_name:
                insights['concern'] = 'Elevated blood sugar may indicate diabetes or prediabetes'
                insights['recommendations'] = ['Monitor carbohydrate intake', 'Regular exercise', 'Follow up with physician']
            elif 'cholesterol' in test_name:
                insights['concern'] = 'High cholesterol increases cardiovascular risk'
                insights['recommendations'] = ['Low-fat diet', 'Regular exercise', 'Consider medication if lifestyle changes insufficient']
            elif 'blood pressure' in test_name:
                insights['concern'] = 'High blood pressure increases risk of heart disease and stroke'
                insights['recommendations'] = ['Reduce sodium intake', 'Regular exercise', 'Stress management']
        
        elif status == 'low':
            if 'hemoglobin' in test_name:
                insights['concern'] = 'Low hemoglobin may indicate anemia'
                insights['recommendations'] = ['Iron-rich foods', 'Vitamin C to enhance iron absorption', 'Medical evaluation']
        
        return insights if insights else None
    
    def _assess_risk_factor(self, lab_value: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Assess risk factors based on lab values"""
        test_name = lab_value['name'].lower()
        status = lab_value['status']
        
        risk_factors = {
            'glucose': {
                'high': {'type': 'diabetes_risk', 'severity': 'moderate', 'description': 'Elevated glucose levels indicate diabetes risk'}
            },
            'cholesterol': {
                'high': {'type': 'cardiovascular_risk', 'severity': 'moderate', 'description': 'High cholesterol increases heart disease risk'}
            },
            'hemoglobin': {
                'low': {'type': 'anemia_risk', 'severity': 'mild', 'description': 'Low hemoglobin may indicate anemia'}
            }
        }
        
        for key, risk_data in risk_factors.items():
            if key in test_name and status in risk_data:
                return risk_data[status]
        
        return None
    
    def _check_drug_interactions(self, medications: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check for potential drug interactions"""
        interactions = []
        
        # Simple interaction checking (in production, use a comprehensive drug database)
        interaction_pairs = {
            ('warfarin', 'aspirin'): 'Increased bleeding risk',
            ('metformin', 'alcohol'): 'Risk of lactic acidosis',
            ('ace inhibitor', 'potassium'): 'Risk of hyperkalemia'
        }
        
        med_names = [med['name'].lower() for med in medications]
        
        for (drug1, drug2), warning in interaction_pairs.items():
            if any(drug1 in name for name in med_names) and any(drug2 in name for name in med_names):
                interactions.append({
                    'type': 'drug_interaction',
                    'drugs': [drug1, drug2],
                    'warning': warning,
                    'severity': 'moderate'
                })
        
        return interactions
    
    def _get_medication_info(self, medication_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a medication"""
        med_info = self.medication_database.get(medication_name.lower())
        return med_info
    
    def _extract_context(self, text: str, term: str) -> str:
        """Extract context around a concerning term"""
        term_index = text.lower().find(term.lower())
        if term_index != -1:
            start = max(0, term_index - 50)
            end = min(len(text), term_index + len(term) + 50)
            return text[start:end].strip()
        return ""
    
    def _calculate_confidence(self, analysis: Dict[str, Any], text: str) -> float:
        """Calculate confidence score for the analysis"""
        confidence_factors = []
        
        # Factor 1: Amount of extracted data
        data_count = len(analysis.get('test_results', [])) + len(analysis.get('medications', []))
        confidence_factors.append(min(data_count * 10, 50))  # Max 50 points
        
        # Factor 2: Text length and medical terms
        medical_terms = ['patient', 'doctor', 'test', 'result', 'normal', 'abnormal', 'medication']
        term_count = sum(1 for term in medical_terms if term in text.lower())
        confidence_factors.append(min(term_count * 5, 30))  # Max 30 points
        
        # Factor 3: Presence of numerical values
        numerical_matches = re.findall(r'\d+\.?\d*', text)
        confidence_factors.append(min(len(numerical_matches) * 2, 20))  # Max 20 points
        
        return min(sum(confidence_factors), 100)
    
    def _load_medical_knowledge(self) -> Dict[str, Any]:
        """Load medical knowledge base"""
        # In production, this would load from a comprehensive medical database
        return {
            'symptoms': {},
            'conditions': {},
            'treatments': {}
        }
    
    def _load_medication_database(self) -> Dict[str, Any]:
        """Load medication database"""
        # Simplified medication database
        return {
            'metformin': {
                'category': 'antidiabetic',
                'purpose': 'blood sugar control',
                'side_effects': ['nausea', 'diarrhea', 'metallic taste'],
                'interactions': ['alcohol', 'contrast dye']
            },
            'lisinopril': {
                'category': 'ace inhibitor',
                'purpose': 'blood pressure control',
                'side_effects': ['dry cough', 'dizziness', 'hyperkalemia'],
                'interactions': ['potassium supplements', 'nsaids']
            },
            'simvastatin': {
                'category': 'statin',
                'purpose': 'cholesterol lowering',
                'side_effects': ['muscle pain', 'liver problems'],
                'interactions': ['grapefruit juice', 'certain antibiotics']
            }
        }
    
    def _load_reference_ranges(self) -> Dict[str, Any]:
        """Load laboratory reference ranges"""
        return {
            'glucose': {
                'unit': 'mg/dL',
                'range': '70-100',
                'normal_range': {'min': 70, 'max': 100, 'critical_high': 400, 'critical_low': 50}
            },
            'hemoglobin': {
                'unit': 'g/dL',
                'range': '12-15',
                'normal_range': {'min': 12, 'max': 15, 'critical_low': 7, 'critical_high': 18}
            },
            'cholesterol': {
                'unit': 'mg/dL',
                'range': '<200',
                'normal_range': {'min': 0, 'max': 200, 'critical_high': 300}
            },
            'creatinine': {
                'unit': 'mg/dL',
                'range': '0.6-1.2',
                'normal_range': {'min': 0.6, 'max': 1.2, 'critical_high': 5.0}
            }
        }
    
    def explain_results(self, analysis: Dict[str, Any], query: str = "") -> str:
        """Provide detailed explanation of analysis results"""
        try:
            explanation = []
            
            if query:
                explanation.append(f"Regarding your question: '{query}'")
            
            # Explain test results
            if analysis.get('test_results'):
                explanation.append("\n**Test Results Explanation:**")
                for test in analysis['test_results']:
                    status_desc = {
                        'normal': 'within normal range',
                        'high': 'above normal range - may require attention',
                        'low': 'below normal range - may require attention',
                        'critical': 'critically abnormal - requires immediate attention'
                    }
                    
                    explanation.append(
                        f"- {test['name']}: {test['value']} {test['unit']} "
                        f"({status_desc.get(test['status'], 'status unknown')})"
                    )
            
            # Explain medications
            if analysis.get('medications'):
                explanation.append("\n**Medication Information:**")
                for med in analysis['medications']:
                    explanation.append(f"- {med['name']}: {med['dosage']} {med['frequency']}")
            
            # Explain risk factors
            if analysis.get('risk_factors'):
                explanation.append("\n**Important Considerations:**")
                for risk in analysis['risk_factors']:
                    explanation.append(f"- {risk.get('description', 'Risk factor identified')}")
            
            return "\n".join(explanation) if explanation else "No specific insights available for your query."
            
        except Exception as e:
            logging.error(f"Failed to generate explanation: {str(e)}")
            return "Sorry, I couldn't generate a detailed explanation at this time."