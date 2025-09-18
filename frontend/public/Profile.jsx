import React, { useState, useEffect, useRef } from 'react';
import { FileText, Heart, Calendar, Settings, Edit3, Camera, Shield, Download, Activity, AlertCircle, ChevronRight,CircleArrowLeft, CircleUserRound } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Loading from '../components/Loading';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://curagenie-backend.onrender.com';



// This is a simple placeholder for features that are not yet ready.
const ComingSoon = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg dark:shadow-gray-700/50">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-full mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Coming Soon</h2>
            <p className="text-yellow-500 font-semibold mb-4">★ Exciting New Feature ★</p>
            <p className="text-gray-600 dark:text-gray-300 max-w-md">We're crafting something amazing just for you.</p>
        </div>
    );
};



const Profile = () => {
    const [profileImage, setProfileImage] = useState('/default-avatar.png');
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    const navigate = useNavigate();

    // User data from backend
    const [profileData, setProfileData] = useState({
        name: '', email: '', phone: '', dateOfBirth: '', gender: '',
        bloodType: '', emergencyContact: '', allergies: '', medications: '',
        preferences: {}, profile_pic_url: ''
    });

    // Dashboard data
    const [dashboardData, setDashboardData] = useState({
        overview: { total_reports: 0, total_analyses: 0, recent_reports: 0, analysis_completion_rate: 0 },
        recent_uploads: [],
        health_insights: { total_medications_tracked: 0, total_risk_factors: 0, recommendations_count: 0 }
    });
    
    // State to hold original data while editing
    const [originalProfileData, setOriginalProfileData] = useState(null);

    // Get auth token from localStorage
    const getAuthToken = () => {
        const authToken = localStorage.getItem('authToken');
        const token = localStorage.getItem('token');
        return authToken || token;
    };

    // API call helper for JSON data
    const apiCall = async (endpoint, method = 'GET', data = null) => {
        const token = getAuthToken();
        if (!token) {
            setError('Please log in to continue');
            return null;
        }
        try {
            const options = {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            };
            if (data) {
                options.body = JSON.stringify(data);
            }
            const fullUrl = `${API_BASE_URL}/api/user${endpoint}`;
            const response = await fetch(fullUrl, options);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                setError('Session expired. Please log in again.');
                return null;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            if (response.status === 204) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('💥 API call failed:', error);
            throw error;
        }
    };

    // FUNCTION TO HANDLE PROFILE PICTURE UPLOAD
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_pic', file);

        const token = getAuthToken();
        if (!token) {
            setError('You must be logged in to upload an image.');
            return;
        }

        try {
            setUpdateLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/user/profile/picture`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }
            setProfileImage(`${API_BASE_URL}${result.data.profile_pic_url}?t=${new Date().getTime()} || ${CircleUserRound}`); // Cache busting
        } catch (uploadError) {
            console.error("Failed to upload profile picture:", uploadError);
            setError(`Failed to upload image: ${uploadError.message}`);
        } finally {
            setUpdateLoading(false);
        }
    };

    // --- ✅ FIXED: FUNCTION TO FETCH SPECIFIC REPORT DETAILS ---
    // const fetchReportDetails = async (reportId) => {
    //   if (!reportId) return;

    //   setReportDetailsLoading(true);
    //   setSelectedReportData(null); // Clear previous data

    //   const token = getAuthToken();
    //   if (!token) {
    //       setError("Authentication error. Please log in again.");
    //       setReportDetailsLoading(false);
    //       navigate('/login');
    //       return;
    //   }
      
    //   try {
    //       const response = await fetch(`http://localhost:5000/api/reports/${reportId}/analysis`, {
    //           headers: {
    //               'Authorization': `Bearer ${token}`
    //           }
    //       });

    //       const data = await response.json();
          
    //       if (!response.ok) throw new Error(data.error || 'Failed to fetch report details');
    //       if (!data.analysis || !data.analysis.dashboardData) {
    //           throw new Error('No dashboard data available for this report');
    //       }

    //       setSelectedReportData({
    //           analysis: {
    //               patientInformation: data.analysis.dashboardData.patientInformation || {},
    //               testResults: data.analysis.dashboardData.testResults || []
    //           }
    //       });

    //   } catch (err) {
    //       console.error('Error fetching report:', err);
    //       setSelectedReportData({ error: err.message });
    //   } finally {
    //       setReportDetailsLoading(false);
    //   }
    // };
    
    // --- ✅ FIXED: UTILITY TO FORMAT DISPLAY KEYS ---
    const formatInfoKey = (key) => {
        const result = key.replace(/([A-Z])/g, ' $1');
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                // --- ✅ FIXED: REMOVED CALL TO NON-EXISTENT FUNCTION ---
                const [profileResponse, dashboardResponse] = await Promise.all([
                    apiCall('/profile'),
                    apiCall('/dashboard')
                ]);
                
                // Process Profile Data
                if (profileResponse && profileResponse.profile) {
                    const profile = profileResponse.profile;
                    setProfileData(profile);
                    if (profile.profile_pic_url) {
                        setProfileImage(`${API_BASE_URL}${profile.profile_pic_url}`);
                    }
                }

                // Process Dashboard Data
                if (dashboardResponse && dashboardResponse.dashboard) {
                    setDashboardData(dashboardResponse.dashboard);
                }

            } catch (err) {
                setError(`Failed to load page data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []); 

    // Handle starting the edit process
    const handleEditClick = () => {
        setOriginalProfileData(profileData);
        setIsEditing(true);
    };

    // Handle canceling the edit process
    const handleCancelEdit = () => {
        if (originalProfileData) {
            setProfileData(originalProfileData);
        }
        setIsEditing(false);
        setOriginalProfileData(null);
    };

    // Handle profile update
    const handleSaveProfile = async () => {
        setUpdateLoading(true);
        setError(null);
        try {
            const dataToUpdate = {
                name: profileData.name,
                phone: profileData.phone,
                dateOfBirth: profileData.dateOfBirth,
                gender: profileData.gender,
                bloodType: profileData.bloodType,
                emergencyContact: profileData.emergencyContact,
                allergies: profileData.allergies,
                medications: profileData.medications,
                preferences: profileData.preferences,
            };
            await apiCall('/profile', 'PUT', dataToUpdate);
            setIsEditing(false);
            setOriginalProfileData(null);
            // Re-fetch profile data to ensure it's up-to-date
            const updatedProfile = await apiCall('/profile');
             if (updatedProfile && updatedProfile.profile) {
                setProfileData(updatedProfile.profile);
             }
        } catch (error) {
            setError(`Failed to update profile: ${error.message}`);
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const uploadnewreport = () => {
        navigate("/upload");
    };

    const scheduleAppointment = () => {
        navigate("/comingsoon"); // Assuming you have a route for this
    };

    const getStatusPill = (status) => {
        switch (status?.toLowerCase()) {
            case 'normal':
            case 'good':
            case 'processed':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
            case 'attention':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
            case 'high':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    const handleBackToApp = () => {
        navigate(-1);  
    };

    if (loading) {
        return (
            <Loading title="Loading Profile..." />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
           <nav className="relative z-10 p-6 pb-0 flex justify-start items-center dark:text-white">
                <button 
                onClick={handleBackToApp}
                className={"flex items-center gap-2 transition-colors duration-300 group "}
                >
                <CircleArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300 " />
                <span>Back</span>
                </button>
            </nav>

            {error && (
                <div className=" max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-[0.5rem]">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-[0.5rem]">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Profile Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-700/50 overflow-hidden transition-colors duration-300">
                            <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600">
                                <div className="absolute -bottom-12 left-6">
                                    <div className="relative">
                                        {/* --- MODIFICATION 1: Image Display --- */}
                                        {/* This now displays the user's profile picture. */}
                                        <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                                            <img
                                                src={profileImage}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; e.target.alt = "default avatar"; }} // Fallback if image fails to load
                                            />
                                        </div>

                                        {/* --- MODIFICATION 2: Hidden File Input --- */}
                                        {/* This is the real file input, but it's invisible. */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            accept="image/png, image/jpeg"
                                        />

                                        {/* --- MODIFICATION 3: Functional Camera Button --- */}
                                        {/* This button now triggers the hidden file input. */}
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                                            aria-label="Change profile picture"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-16 pb-6 px-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {profileData.name || 'User Name'}
                                    </h2>
                                    <button
                                        onClick={handleEditClick}
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">{profileData.email}</p>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Blood Type</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">{profileData.bloodType || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Total Reports</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{dashboardData.overview.total_reports}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Analyses</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{dashboardData.overview.total_analyses}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-700/50 overflow-hidden transition-colors duration-300">
                            <nav className="p-2">
                                {[
                                    { id: 'overview', label: 'Health Overview', icon: Activity },
                                    { id: 'reports', label: 'Medical Reports', icon: FileText },
                                    { id: 'settings', label: 'Account Settings', icon: Settings },
                                    { id: 'security', label: 'Privacy & Security', icon: Shield }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === tab.id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Health Metrics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg dark:shadow-gray-700/50 hover:shadow-xl dark:hover:shadow-gray-600/50 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reports</h3>
                                            <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{dashboardData.overview.total_reports}</p>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                                            {dashboardData.overview.recent_reports} this month
                                        </span>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg dark:shadow-gray-700/50 hover:shadow-xl dark:hover:shadow-gray-600/50 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Analyses Done</h3>
                                            <Activity className="w-4 h-4 text-green-500 dark:text-green-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{dashboardData.overview.total_analyses}</p>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                                            {dashboardData.overview.analysis_completion_rate}% completion
                                        </span>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg dark:shadow-gray-700/50 hover:shadow-xl dark:hover:shadow-gray-600/50 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Medications</h3>
                                            <Heart className="w-4 h-4 text-red-500 dark:text-red-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{dashboardData.health_insights.total_medications_tracked}</p>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                                            Tracked
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Recent Reports Analysis */}
                                    <div className="lg:col-span-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-transparent dark:border-gray-700 transition-all duration-300">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
                                            Recent Reports Analysis
                                        </h3>
                                       {/* Report List */}
                                        <div className="mb-6">
                                            {dashboardData.recent_uploads && dashboardData.recent_uploads.length > 0 ? (
                                                <div className="space-y-3">
                                                    {dashboardData.recent_uploads.map((report) => (
                                                        <div
                                                            key={report.report_id}
                                                            onClick={() => navigate('/dashboard')}
                                                            className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 flex items-center justify-between hover:shadow-md dark:hover:bg-gray-700/50 transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                                <div>
                                                                    <p className="font-semibold text-gray-800 dark:text-white">{report.name || 'Untitled Report'}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(report.upload_date).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recent reports to display.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-700/50 p-6 transition-colors duration-300">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <button onClick={uploadnewreport} className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <FileText className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                            <span className="font-medium text-gray-600 dark:text-gray-300">Upload New Report</span>
                                        </button>
                                        <button onClick={scheduleAppointment} className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <Calendar className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                            <span className="font-medium text-gray-600 dark:text-gray-300">Schedule Appointment</span>
                                        </button>
                                        <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <Download className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                            <span className="font-medium text-gray-600 dark:text-gray-300">Download Reports</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            // <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                            //     <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            //         Recent Reports Analysis
                            //     </h3>
                            //     {dashboardData.recent_uploads && dashboardData.recent_uploads.length > 0 ? (
                            //         <div className="space-y-4">
                            //             {dashboardData.recent_uploads.map((report) => (
                            //                 <div
                            //                     key={report.report_id}
                            //                     className="bg-white dark:bg-gray-800/50 rounded-lg p-4 flex items-center justify-between hover:shadow-md dark:hover:bg-gray-700/50 transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
                            //                 >
                            //                     <div className="flex items-center space-x-4">
                            //                         <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                            //                             <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            //                         </div>
                            //                         <div>
                            //                             <p className="font-bold text-gray-900 dark:text-white">
                            //                                 {report.name || 'Untitled Report'}
                            //                             </p>
                            //                             <p className="text-sm text-gray-500 dark:text-gray-400">
                            //                                 {new Date(report.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            //                             </p>
                            //                         </div>
                            //                     </div>
                            //                     <div className="flex items-center space-x-4">
                            //                         <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusPill(report.status)}`}>
                            //                             {report.status || 'Pending'}
                            //                         </span>
                            //                         <span className="text-lg font-bold text-gray-900 dark:text-white">
                            //                             {report.score ? `${report.score}/100` : ''}
                            //                         </span>
                            //                         <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            //                     </div>
                            //                 </div>
                            //             ))}
                            //         </div>
                            //     ) : (
                            //         <div className="text-center py-16">
                            //             <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            //             <h4 className="text-xl font-medium text-gray-800 dark:text-white">No Reports Found</h4>
                            //             <p className="text-gray-500 dark:text-gray-400 mt-2">Upload a report to see your analysis here.</p>
                            //             <button
                            //                 onClick={uploadnewreport}
                            //                 className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            //             >
                            //                 Upload Your First Report
                            //             </button>
                            //         </div>
                            //     )}
                            // </div>
                            <ComingSoon />
                        )}

                        {activeTab === 'settings' && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-700/50 transition-colors duration-300">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Settings</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Manage your personal information</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled={true}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                                                title="Email cannot be changed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={profileData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={profileData.dateOfBirth}
                                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                                            <select
                                                value={profileData.gender}
                                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 transition-colors"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                                <option value="Prefer not to say">Prefer not to say</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Contact</label>
                                            <input
                                                type="text"
                                                value={profileData.emergencyContact}
                                                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="Name - Phone Number"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Blood Type</label>
                                            <select
                                                value={profileData.bloodType}
                                                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 transition-colors"
                                            >
                                                <option value="">Select Blood Type</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Known Allergies</label>
                                            <textarea
                                                value={profileData.allergies}
                                                onChange={(e) => handleInputChange('allergies', e.target.value)}
                                                disabled={!isEditing}
                                                rows="3"
                                                placeholder="List any known allergies..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 transition-colors"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Medications</label>
                                            <textarea
                                                value={profileData.medications}
                                                onChange={(e) => handleInputChange('medications', e.target.value)}
                                                disabled={!isEditing}
                                                rows="3"
                                                placeholder="List current medications with dosage..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-600 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="mt-6 flex space-x-4">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={updateLoading}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center space-x-2"
                                            >
                                                {updateLoading && (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                )}
                                                <span>{updateLoading ? 'Saving...' : 'Save Changes'}</span>
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={updateLoading}
                                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-700/50 transition-colors duration-300">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Privacy & Security</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Manage your privacy settings and account security</p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Account Security</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
                                                    </div>
                                                    <button className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                        Change
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                                                    </div>
                                                    <button className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                        Enable
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Data Management</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Download all your medical data</p>
                                                    </div>
                                                    <button className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                        Export
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-600 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-red-900 dark:text-red-400">Delete Account</p>
                                                        <p className="text-sm text-red-600 dark:text-red-400">Permanently delete your account and data</p>
                                                    </div>
                                                    <button className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;