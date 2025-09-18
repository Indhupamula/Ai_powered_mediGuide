import React, { useState, useEffect } from 'react';
import { Activity, Apple, AlertCircle, CheckCircle, Clock, Target, Utensils, CircleArrowLeft } from 'lucide-react';
import {  useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://curagenie-backend.onrender.com';


const DietRecommendationsPage = () => {
    const [selectedMealPlan, setSelectedMealPlan] = useState('balanced');
    const [activeTab, setActiveTab] = useState('recommendations');
    const [dietData, setDietData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportId, setReportId] = useState(null); 

    
    const navigate = useNavigate();
    
    // Step 3: Token get karne ke liye function
    const getAuthToken = () => {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
    };

    useEffect(() => {
        const fetchDietData = async () => {
            
            try {
                const token = getAuthToken();
                if (!token) {
                    navigate('/login'); 
                    return;
                }

                const lastRes = await fetch(`${API_BASE_URL}/api/reports/last`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                const lastData = await lastRes.json();
                

                if (lastData.success && lastData.report?._id) {
                    setReportId(lastData.report._id); 
                    
                } else {
                    throw new Error(lastData.error || "No last report found");
                }
            } catch (error) {
                console.error("Error fetching last report:", error);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchDietData();
    }, [navigate]);

    // ✅ Separate effect to fetch diet once reportId is set
    useEffect(() => {
        const fetchDietForReport = async () => {
            if (!reportId) return;
            try {
                const token = getAuthToken();
                const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}/diet`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to fetch diet data");
                }

                const data = await res.json();
                console.log("Fetched diet data:", data);
                if (data.success) {
                    setDietData(data.dietData);
                } else {
                    throw new Error(data.error || "API returned success: false");
                }
            } catch (error) {
                console.error("Error fetching diet data:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDietForReport();
    }, [reportId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'text-green-600 bg-green-100';
            case 'improving': return 'text-blue-600 bg-blue-100';
            case 'on-track': return 'text-green-600 bg-green-100';
            case 'needs-attention': return 'text-yellow-600 bg-yellow-100';
            case 'in progress': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (<Loading title="Loading diet data..." />);
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">{error}</div>;
    }
    const handleBackToApp = () => {
        navigate(-1);  
    };

    if (!dietData) {
        return <div className="p-8 text-center text-red-600">Failed to load diet data.</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-colors duration-300">
            <nav className="relative z-10 p-6 flex justify-start items-center dark:text-white">
                <button 
                onClick={handleBackToApp}
                className={"flex items-center gap-2 transition-colors duration-300 group "}
                >
                <CircleArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300 " />
                <span>Back</span>
                </button>
            </nav>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Health Conditions Overview */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 dark:bg-gray-700 ">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 dark:text-white">Based on Your Health Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {dietData.healthConditions.map((condition, index) => (
                            <div key={index} className={`p-4 rounded-lg border-l-4 ${
                                condition.color === 'green' ? 'border-green-500 bg-green-50' :
                                condition.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
                                condition.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                                'border-red-500 bg-red-50'
                            } dark:bg-gradient-to-b from-gray-800 to-gray-900 dark:border-blue-600`}>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{condition.name}</h3>
                                <p className={`text-sm font-medium ${
                                    condition.color === 'green' ? 'text-green-600' :
                                    condition.color === 'yellow' ? 'text-yellow-600' :
                                    condition.color === 'orange' ? 'text-orange-600' :
                                    'text-red-600'
                                }`}>
                                    {condition.level}
                                </p>
                                <ul className="mt-2 text-xs text-gray-600 dark:text-white">
                                    {condition.recommendations.map((rec, idx) => (
                                        <li key={idx}>• {rec}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg mb-6 dark:bg-gray-700 transition-colors duration-300">
                    <div className="border-b border-gray-200 dark:border-gray-600">
                        <nav className="flex space-x-8 px-6 ">
                            {[
                                { id: 'recommendations', label: 'Food Recommendations', icon: <Apple className="h-4 w-4" /> },
                                { id: 'meal-plan', label: 'Meal Plans', icon: <Utensils className="h-4 w-4" /> },
                                { id: 'progress', label: 'Nutritional Goals', icon: <Target className="h-4 w-4" /> },
                                { id: 'weekly', label: 'Weekly Menu', icon: <Clock className="h-4 w-4" /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } dark:text-white dark:hover:text-green-500 dark:hover:border-white-500 transition-colors duration-300`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6 ">
                        {/* Food Recommendations */}
                        {activeTab === 'recommendations' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Recommended Foods */}
                                <div className="bg-green-50 rounded-xl p-6 dark:bg-green-800/20">
                                    <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center dark:text-green-400">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Recommended Foods
                                    </h3>
                                    <div className="space-y-4">
                                        {dietData.foodRecommendations.recommended.map((item, i) => (
                                            <div key={i} className="bg-white rounded-lg p-4 dark:bg-gray-600">
                                                <h4 className="font-semibold text-gray-900 mb-1 dark:text-white">{item.food}</h4>
                                                <p className="text-sm text-green-700">{item.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Foods to Limit */}
                                <div className="bg-red-50 rounded-xl p-6 dark:bg-red-900/20">
                                    <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center dark:text-red-500">
                                        <AlertCircle className="h-5 w-5 mr-2" />
                                        Foods to Limit
                                    </h3>
                                    <div className="space-y-4">
                                        {dietData.foodRecommendations.limit.map((item, i) => (
                                            <div key={i} className="bg-white rounded-lg p-4 dark:bg-gray-600">
                                                <h4 className="font-semibold text-gray-900 mb-1 dark:text-white">{item.food}</h4>
                                                <p className="text-sm text-red-700 dark:text-white">{item.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Foods with Caution */}
                                <div className="bg-yellow-50 rounded-xl p-6 dark:bg-yellow-50/30">
                                    <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center dark:text-yellow-400">
                                        <AlertCircle className="h-5 w-5 mr-2" />
                                        Use with Caution
                                    </h3>
                                    <div className="space-y-4">
                                        {dietData.foodRecommendations.caution.map((item, i) => (
                                            <div key={i} className="bg-white rounded-lg p-4 dark:bg-gray-600">
                                                <h4 className="font-semibold text-gray-900 mb-1 dark:text-white">{item.food}</h4>
                                                <p className="text-sm text-yellow-700 dark:text-white">{item.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Meal Plans */}
                        {activeTab === 'meal-plan' && (
                            <div>
                                <div className="flex space-x-4 mb-6 ">
                                    {Object.keys(dietData.mealPlans).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedMealPlan(key)}
                                            className={`px-4 py-2 rounded-lg font-medium ${
                                                selectedMealPlan === key
                                                    ? 'bg-blue-500 text-white dark:bg-green-700'
                                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500'
                                            }`}
                                        >
                                            {dietData.mealPlans[key].title}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 dark:from-gray-800 dark:to-gray-800">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-white">
                                        {dietData.mealPlans[selectedMealPlan].title}
                                    </h3>
                                    <p className="text-gray-700 mb-4 dark:text-white">{dietData.mealPlans[selectedMealPlan].description}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg p-4 dark:bg-gray-700">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Daily Calories</h4>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {dietData.mealPlans[selectedMealPlan].summary.dailyCalories}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 dark:bg-gray-700">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Macronutrients</h4>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                <p>Carbs: {dietData.mealPlans[selectedMealPlan].summary.macronutrients.carbs}</p>
                                                <p>Protein: {dietData.mealPlans[selectedMealPlan].summary.macronutrients.protein}</p>
                                                <p>Fat: {dietData.mealPlans[selectedMealPlan].summary.macronutrients.fat}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 dark:bg-gray-700">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Meal Count</h4>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {dietData.mealPlans[selectedMealPlan].summary.mealCount}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {dietData.mealPlans[selectedMealPlan].meals.map((meal, index) => (
                                        <div key={index} className="bg-white rounded-xl shadow-lg p-6 dark:bg-gray-800">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{meal.mealType}</h4>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">{meal.time}</p>
                                                    <p className="font-semibold text-blue-600">{meal.calories}</p>
                                                </div>
                                            </div>
                                            <ul className="space-y-1 mb-3">
                                                {meal.items.map((food, idx) => (
                                                    <li key={idx} className="text-gray-700 flex items-center dark:text-white">
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 dark:bg-blue-400"></span>
                                                        {food}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="bg-blue-50 rounded-lg p-3 dark:bg-gray-800 dark:border dark:border-gray-600 ">
                                                <p className="text-sm text-blue-800 dark:text-blue-600" >💡 {meal.highlight}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Nutritional Goals */}
                        {activeTab === 'progress' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                                    {dietData.nutritionalGoals.map((goal, index) => (
                                        <div key={index} className="bg-white rounded-xl shadow-lg p-6 dark:bg-gray-700 dark:border dark:border-gray-600">
                                            <div className="flex items-center justify-between mb-3 dark:text-white">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{goal.goal}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                                                    {goal?.name ? goal.name.toUpperCase() : ""}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3 dark:text-gray-300">{goal.target}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500 dark:bg-blue-400"
                                                    style={{ width: goal.progress }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-sm dark:text-white">
                                                <span className="text-gray-600 dark:text-gray-300">Progress</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{goal.progress}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weekly Menu */}
                        {activeTab === 'weekly' && (
                            <div className="space-y-6">
                                {dietData.weeklyMenu.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 dark:text-white">
                                        {dietData.weeklyMenu.map((day, index) => (
                                            <div key={index} className="bg-white rounded-xl shadow-lg p-6 dark:bg-gray-700 dark:border dark:border-gray-600">
                                                <h3 className="font-bold text-gray-900 dark:text-white">{day.day}</h3>
                                                <h5 className="font-bold text-gray-700 dark:text-gray-300">{day.theme}</h5>
                                                <p className="text-gray-700 text-sm dark:text-gray-300">{day.mealSuggestion}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600">No weekly menu available.(Insufficient data)</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DietRecommendationsPage;