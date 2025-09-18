import React, { useState } from 'react';
import { Pill, ArrowLeft, Clock, AlertTriangle, Utensils, Users, Search, Filter, Info, CheckCircle, XCircle } from 'lucide-react';

const MedicationGuide = () => {
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const medications = [
    {
      id: 1,
      name: "Metformin",
      genericName: "Metformin Hydrochloride",
      dosage: "500mg",
      frequency: "Twice daily",
      category: "Diabetes",
      prescribedFor: "Type 2 Diabetes Management",
      description: "Metformin helps control blood sugar levels and is often the first medication prescribed for type 2 diabetes.",
      sideEffects: {
        common: ["Nausea", "Diarrhea", "Stomach upset", "Metallic taste"],
        serious: ["Lactic acidosis (rare)", "Severe allergic reactions", "Kidney problems"]
      },
      foodInteractions: {
        avoid: ["Excessive alcohol", "High-sugar foods"],
        takeWith: ["Food to reduce stomach upset"],
        timing: "With meals"
      },
      warnings: ["Do not take if you have kidney disease", "Inform doctor about any contrast dye procedures"],
      color: "blue"
    },
    {
      id: 2,
      name: "Lisinopril",
      genericName: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      category: "Blood Pressure",
      prescribedFor: "High Blood Pressure",
      description: "An ACE inhibitor that helps relax blood vessels to lower blood pressure and reduce strain on the heart.",
      sideEffects: {
        common: ["Dry cough", "Dizziness", "Headache", "Fatigue"],
        serious: ["Severe allergic reactions", "Kidney problems", "High potassium levels"]
      },
      foodInteractions: {
        avoid: ["Salt substitutes with potassium", "High-potassium foods in excess"],
        takeWith: ["Can be taken with or without food"],
        timing: "Same time each day"
      },
      warnings: ["May cause dizziness when standing up", "Regular blood pressure monitoring required"],
      color: "red"
    },
    {
      id: 3,
      name: "Atorvastatin",
      genericName: "Atorvastatin Calcium",
      dosage: "20mg",
      frequency: "Once daily",
      category: "Cholesterol",
      prescribedFor: "High Cholesterol",
      description: "A statin medication that helps lower cholesterol and reduces the risk of heart disease.",
      sideEffects: {
        common: ["Muscle pain", "Headache", "Nausea", "Diarrhea"],
        serious: ["Severe muscle problems", "Liver problems", "Memory problems"]
      },
      foodInteractions: {
        avoid: ["Grapefruit and grapefruit juice", "Excessive alcohol"],
        takeWith: ["Can be taken with or without food"],
        timing: "Evening preferred"
      },
      warnings: ["Report any unexplained muscle pain", "Regular liver function tests needed"],
      color: "green"
    },
    {
      id: 4,
      name: "Omeprazole",
      genericName: "Omeprazole",
      dosage: "20mg",
      frequency: "Once daily",
      category: "Gastric",
      prescribedFor: "Acid Reflux/GERD",
      description: "A proton pump inhibitor that reduces stomach acid production to treat acid reflux and ulcers.",
      sideEffects: {
        common: ["Headache", "Nausea", "Diarrhea", "Abdominal pain"],
        serious: ["Severe diarrhea", "Bone fractures with long-term use", "Low magnesium levels"]
      },
      foodInteractions: {
        avoid: ["Should be taken before meals"],
        takeWith: ["Empty stomach for best absorption"],
        timing: "30-60 minutes before breakfast"
      },
      warnings: ["May increase risk of bone fractures with long-term use", "Can affect absorption of other medications"],
      color: "purple"
    }
  ];

  const categories = ['all', 'Diabetes', 'Blood Pressure', 'Cholesterol', 'Gastric'];

  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.genericName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || med.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const InteractionChecker = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-300">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Drug Interaction Checker</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Medication</label>
            <select className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors duration-300">
              <option>Select medication...</option>
              {medications.map((med) => (
                <option key={med.id} value={med.name}>{med.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Second Medication</label>
            <select className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors duration-300">
              <option>Select medication...</option>
              {medications.map((med) => (
                <option key={med.id} value={med.name}>{med.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition-all duration-300">
          Check Interactions
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-xs border-b border-gray-200 dark:border-gray-700  transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300">
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="bg-linear-to-r from-green-600 to-blue-600 p-2 rounded-lg">
                  <Pill className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medication Guide</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300">
                💊 4 Active Medications
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-300">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Medications List */}
          <div className="lg:col-span-2 space-y-6">
            <InteractionChecker />
            
            <div className="space-y-4">
              {filteredMedications.map((medication) => (
                <div
                  key={medication.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 ${
                    selectedMedication?.id === medication.id
                      ? 'ring-2 ring-blue-500 shadow-xl'
                      : 'hover:shadow-xl'
                  }`}
                  onClick={() => setSelectedMedication(medication)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`bg-${medication.color}-100 dark:bg-${medication.color}-900 p-2 rounded-lg`}>
                        <Pill className={`h-6 w-6 text-${medication.color}-600 dark:text-${medication.color}-400`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{medication.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{medication.genericName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{medication.dosage}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{medication.frequency}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors duration-300">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Category</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{medication.category}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors duration-300">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Prescribed For</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{medication.prescribedFor}</p>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">{medication.description}</p>

                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-600 dark:text-gray-400">Best taken: {medication.foodInteractions.timing}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-gray-600 dark:text-gray-400">{medication.warnings.length} warnings</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medication Details Sidebar */}
          <div className="space-y-6">
            {selectedMedication ? (
              <>
                {/* Detailed Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detailed Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                        <Info className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        How to Take
                      </h4>
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 transition-colors duration-300">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{selectedMedication.foodInteractions.takeWith}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          <strong>Timing:</strong> {selectedMedication.foodInteractions.timing}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                        <Utensils className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        Food Interactions
                      </h4>
                      <div className="space-y-2">
                        {selectedMedication.foodInteractions.avoid.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 transition-colors duration-300">
                            <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Avoid:</p>
                            <ul className="text-sm text-red-700 dark:text-red-300">
                              {selectedMedication.foodInteractions.avoid.map((item, index) => (
                                <li key={index}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side Effects */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Side Effects</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        Common (Usually Mild)
                      </h4>
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 transition-colors duration-300">
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          {selectedMedication.sideEffects.common.map((effect, index) => (
                            <li key={index}>• {effect}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                        <XCircle className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                        Serious (Contact Doctor)
                      </h4>
                      <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 transition-colors duration-300">
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          {selectedMedication.sideEffects.serious.map((effect, index) => (
                            <li key={index}>• {effect}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                <div className="bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 transition-colors duration-300">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                    Important Warnings
                  </h3>
                  <ul className="space-y-2">
                    {selectedMedication.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        ⚠️ {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center transition-colors duration-300">
                <Pill className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Medication</h3>
                <p className="text-gray-600 dark:text-gray-400">Click on any medication to view detailed information, side effects, and usage guidelines.</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors duration-300">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Set Medication Reminders</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Never miss a dose</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors duration-300">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Share with Doctor</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Export medication list</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors duration-300">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Report Side Effects</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track adverse reactions</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default MedicationGuide;