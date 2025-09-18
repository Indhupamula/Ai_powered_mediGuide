import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Lightbulb, Activity, Heart, Zap, BarChart3,CircleArrowLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://curagenie-backend.onrender.com';


const AIInsightsPage = () => {
  const [selectedInsight, setSelectedInsight] = useState('overview');
  const [healthMetrics, setHealthMetrics] = useState([]);
  const [insights, setInsights] = useState([]);
  const [riskFactors, setRiskFactors] = useState([]);
  const [personalizedActionPlan, setPersonalizedActionPlan] = useState({ shortTerm: [], longTerm: [] });
  const [loading, setLoading] = useState(true);
  const { reportId } = useParams();
  const navigate = useNavigate();

  const getAuthToken = () => {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
    };

    useEffect(() => {
      // const report_id = reportId || sessionStorage.getItem('latestReportId');
        const fetchInsights = async () => {
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
            

            let report_id;
            const lastData = await lastRes.json();
            
            if (lastData.success && lastData.report._id) {
                report_id = lastData.report._id;
                console.log("Last Report ID:", report_id);
            } else {
              console.warn("No last report found:", lastData.error || "Unexpected response");
              setLoading(false);
              return;
            }
            

            const res = await fetch(`${API_BASE_URL}/api/reports/${report_id}/insights`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });

            const data = await res.json();
            console.log("Insights API Response:", data);

            if (data.success && data.insights_data) {
              setHealthMetrics(data.insights_data.healthMetrics || []);

              const mappedInsights = (data.insights_data.insightsDashboard || []).map((item) => {
                let icon, color;
                switch (item.id) {
                  case "critical":
                    icon = <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
                    color = "red";
                    break;
                  case "recommendations":
                    icon = <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
                    color = "yellow";
                    break;
                  case "positive":
                    icon = <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
                    color = "green";
                    break;
                  case "trends":
                    icon = <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
                    color = "blue";
                    break;
                  default:
                    icon = <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
                    color = "gray";
                }

                return {
                  id: item.id,
                  title: item.title,
                  icon,
                  color,
                  count: item.count,
                  items: (item.items || []).map((i) => ({ title: i, description: i }))
                };
              });

              setInsights(mappedInsights);
              setRiskFactors(data.insights_data.riskAssessment || []);
              setPersonalizedActionPlan(data.insights_data.personalizedActionPlan || { shortTerm: [], longTerm: [] });
            } else {
              console.warn("Insights fetch failed:", data.error || "Unexpected response");
            }
            } catch (error) {
            console.error("Error fetching insights:", error);
            } finally {
            setLoading(false);
            }
        };

        fetchInsights();
    }, [reportId]);

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend.toLowerCase()) {
      case 'up':
      case 'within range':
        return <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'low':
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 dark:text-red-400 transform rotate-180" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    }
  };
  const handleBackToApp = () => {
    navigate(-1);  
  };

  if (loading) {
    return (
      <Loading title="Loading AI Insights..." />
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 transition-colors duration-300">
      <nav className="relative z-10 p-6 pb-0 flex justify-start items-center dark:text-white">
          <button 
          onClick={handleBackToApp}
          className={"flex items-center gap-2 transition-colors duration-300 group "}
          >
          <CircleArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300 " />
          <span>Back</span>
          </button>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        
        {/* ---------- Health Metrics (Dynamic) ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {healthMetrics.map((metric, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.name}</h3>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value ? metric.value : "N/A"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ---------- Insights Dashboard (Dynamic) ---------- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Health Insights Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {insights.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedInsight(category.id)}
                    className={`p-4 rounded-lg text-center transition-all ${selectedInsight === category.id ? `${
                            category.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-400' :
                            category.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500 dark:border-yellow-400' :
                            category.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400' :
                            'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400'
                          }`
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-center mb-2">{category.icon}</div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">{category.title}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                      category.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                      category.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      category.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}>{category.count}</span>
                  </button>
                ))}
              </div>

              {/* Selected Insight Items */}
              <div className="space-y-4">
                {insights.find(cat => cat.id === selectedInsight)?.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                    <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------- Personalized Action Plan (Dynamic) ---------- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Personalized Action Plan</h3>
              <div className="space-y-4">
                {/* Short-term */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Short-term Goals</h4>
                  <ul className="mt-2 list-disc ml-6 text-gray-700 dark:text-gray-300">
                    {personalizedActionPlan.shortTerm.map((goal, i) => <li key={i}>{goal}</li>)}
                  </ul>
                </div>
                {/* Long-term */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Long-term Goals</h4>
                  <ul className="mt-2 list-disc ml-6 text-gray-700 dark:text-gray-300">
                    {personalizedActionPlan.longTerm.map((goal, i) => <li key={i}>{goal}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Sidebar Risk Assessment (Dynamic) ---------- */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                {riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{risk.factor}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{risk.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk.risk)}`}>
                      {risk.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* KEEP OTHER STATIC COMPONENTS LIKE "AI Confidence" & "Recommended Actions" AS IS */}
            {/* AI Confidence Score */}
            <div className="bg-linear-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-transparent dark:border-purple-800/30 transition-colors duration-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                AI Analysis Confidence
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">Data Quality</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 dark:bg-green-400 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">92%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">Analysis Accuracy</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full" style={{ width: '89%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">89%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">Prediction Reliability</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 dark:bg-purple-400 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">87%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-transparent dark:border-gray-700 transition-colors duration-300">
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  <Zap className="h-4 w-4 inline mr-1 text-purple-600 dark:text-purple-400" />
                  High confidence analysis based on comprehensive data patterns
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-2xl dark:shadow-gray-900/20 p-6 border border-transparent dark:border-gray-700 transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                Recommended Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-transparent dark:border-blue-800/30">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white transition-colors duration-300">
                        Schedule Follow-up
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                        Book next appointment
                      </p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors border border-transparent dark:border-green-800/30">
                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white transition-colors duration-300">
                        Lifestyle Plan
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                        Get personalized plan
                      </p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors border border-transparent dark:border-purple-800/30">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white transition-colors duration-300">
                        Set Reminders
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                        Track progress
                      </p>
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

export default AIInsightsPage;
