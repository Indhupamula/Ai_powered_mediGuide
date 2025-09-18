import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Calendar, TrendingUp, Activity, Heart, Brain, Shield, FileText, Bell, Plus , CircleArrowLeft } from 'lucide-react';
import Loading from '../components/Loading';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://curagenie-backend.onrender.com';

const HealthDashboard = () => {
  const [activeWidget, setActiveWidget] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reportId, setReportId] = useState(
    sessionStorage.getItem("latestReportId") || null
  );

  const navigate = useNavigate();

  // ✅ Token helper
  const getAuthToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("authToken");
  };

  // ✅ Fetch latest report ID
  useEffect(() => {
    const fetchLastReport = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const lastRes = await fetch(`${API_BASE_URL}/api/reports/last`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const lastData = await lastRes.json();

        if (lastData.success && lastData.report?._id) {
          setReportId(lastData.report._id);
          sessionStorage.setItem("latestReportId", lastData.report._id); // ✅ keep in sessionStorage too
        } else {
          throw new Error(lastData.error || "No last report found");
        }
      } catch (err) {
        console.error("Error fetching last report:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (!reportId) {
      fetchLastReport();
    }
  }, [reportId, navigate]);

  // ✅ Fetch dashboard data once reportId is available
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!reportId) return;

        const token = getAuthToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}/api/reports/${reportId}/analysis`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch dashboard data");
        }

        const json = await res.json();

        if (json.success) {
          setData(json.analysis.dashboardData);
        } else {
          throw new Error(json.error || "API returned success: false");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [reportId, navigate]);

    // Show loading until data arrives
    if (!data) {
        return <Loading message={error ? `Error: ${error}` : "Loading dashboard..."} />;
    }

    const nextPage = () => {
        navigate("/comingsoon"); 
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'down': return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
            default: return <Activity className="h-4 w-4 text-blue-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'normal': return 'bg-green-100 text-green-800';
            case 'good': return 'bg-blue-100 text-blue-800';
            case 'attention': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleBackToApp = () => {
        navigate(-1);  
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 transition-colors duration-300">
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
                {/* Health Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {data.keyMetrics.map((metric, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-600 dark:text-white">{metric.title}</h3>
                                {getTrendIcon(metric.change?.includes("+") ? "up" : metric.change?.includes("-") ? "down" : "stable")}
                            </div>
                            <div className="mb-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</span>
                                {metric.change && (
                                    <span className={`ml-2 text-sm ${metric.change.includes("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                        {metric.change}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-white mb-2">{metric.description}</p>
                            <div className="text-xs text-gray-600 dark:text-white">
                                Target: <span className="font-medium">{metric.target}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Reports */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Medical Reports</h2>
                                <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
                                    <Plus className="h-4 w-4" />
                                    <span className="text-sm">Upload New</span>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {data.recentReports.map((report, idx) => (
                                    <div 
                                        key={idx}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                                        onClick={() => setActiveWidget(activeWidget === idx ? null : idx)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{report.name}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-white">{report.date} • Dr. {report.doctor}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                                                    {report.status}
                                                </span>
                                                <span className="text-lg font-bold text-gray-900">{report.score}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Health Trends */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Health Trends</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.healthTrends.map((trend, index) => (
                                    <div key={index} className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4 dark:from-blue-900/20 dark:to-indigo-900/20 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{trend.period}</h3>
                                            {getTrendIcon(trend.change?.includes("+") ? "up" : trend.change?.includes("-") ? "down" : "stable")}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-white mb-1">{trend.metric}</p>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">{trend.value}</span>
                                            {trend.change && (
                                                <span className={`text-sm ${trend.change.includes("-") ? "text-green-600" : "text-blue-600"}`}>
                                                    {trend.change}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Alerts & Notifications */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Bell className="h-5 w-5 mr-2" />
                                Alerts & Reminders
                            </h3>
                            <div className="space-y-3">
                                {data.alerts.map((alert, index) => (
                                    <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(alert.level)}`}>
                                        <p className="text-sm font-medium">{alert.message}</p>
                                        <p className="text-xs mt-1 opacity-75">{alert.time}</p>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-4 text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                                View All Notifications
                            </button>
                        </div>

                        {/* Upcoming Appointments */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Calendar className="h-5 w-5 mr-2" />
                                Upcoming Appointments
                            </h3>
                            <div className="space-y-4">
                                {data.upcomingAppointments.map((appointment, index) => (
                                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white">{appointment.type}</h4>
                                        <p className="text-sm text-gray-600 dark:text-white">Dr. {appointment.doctor}</p>
                                        <p className="text-sm text-gray-600 dark:text-white">{new Date(appointment.dateTime).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{appointment.location}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={nextPage} className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                                Schedule New Appointment
                            </button>
                        </div>

                        {/* Medications */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Heart className="h-5 w-5 mr-2" />
                                Current Medications
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-white">No medications available from API</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full text-left p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium text-gray-900 dark:text-white">Upload New Report</span>
                                </button>
                                <button className="w-full text-left p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3">
                                    <Brain className="h-5 w-5 text-purple-600" />
                                    <span className="font-medium text-gray-900 dark:text-white">Get AI Insights</span>
                                </button>
                                <button className="w-full text-left p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-gray-900 dark:text-white">Health Checkup</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthDashboard;