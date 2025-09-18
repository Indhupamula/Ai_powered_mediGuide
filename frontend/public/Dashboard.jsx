import React, { useState, useEffect } from 'react';
import { FileText, Activity, AlertCircle, User, Beaker, X,CircleArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import ComponentLoading from '../components/ComponentLoading';

// This gets the backend URL from your .env.local file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://curagenie-backend.onrender.com';


const Dashboard = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [selectedReportData, setSelectedReportData] = useState(null);
    const [listLoading, setListLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- STEP 1: TOKEN GET KARNE KE LIYE FUNCTION ADD KAREIN ---
    const getAuthToken = () => {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
    };
    // -----------------------------------------------------------

    // Fetch the list of all reports when the component loads
    useEffect(() => {
        const fetchReports = async () => {
            setListLoading(true);
            setError(null);

            const token = getAuthToken(); // Token get karein
            if (!token) {
                setError("Authentication error. Please log in again.");
                setListLoading(false);
                navigate('/login'); // Login page par bhej dein
                return;
            }

            try {

                const response = await fetch(`${API_BASE_URL}/api/reports/list`, {
                    headers: {
                        'Authorization': `Bearer ${token}`

                    }
                });


                if (!response.ok) {
                    throw new Error('Failed to fetch reports list.');
                }
                const data = await response.json();
                setReports(data.reports || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setListLoading(false);
            }
        };
        fetchReports();
    }, [navigate]); // navigate ko dependency array me add karein

    // Fetch analysis details for a specific report when clicked
    const handleReportClick = async (reportId) => {
        if (!reportId) return;

        setDetailsLoading(true);
        setSelectedReportData(null);

        const token = getAuthToken();
        if (!token) {
            setError("Authentication error. Please log in again.");
            setDetailsLoading(false);
            navigate('/login');
            return;
        }

        console.log("ye report id hai:", reportId)
        try {
            const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/analysis`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log('Analysis Response:', data);

            if (!response.ok) throw new Error(data.error || 'Failed to fetch report details');
            if (!data.analysis || !data.analysis.dashboardData) {
                throw new Error('No dashboard data available for this report');
            }

            // ✅ Use correct path
            setSelectedReportData({
                analysis: {
                    patientInformation: data.analysis.dashboardData.patientInformation || {},
                    testResults: data.analysis.dashboardData.testResults || []
                }
            });

        } catch (err) {
            console.error('Error fetching report:', err);
            setSelectedReportData({ error: err.message });
        } finally {
            setDetailsLoading(false);
        }
    };
    const handleDelete = async (reportId) => {
        try {
        const response = await fetch(`${API_BASE_URL}/api/reports/delete/${reportId}`, {
            method: "DELETE",
            headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();

        if (data.success) {
            alert("Report deleted!");
            window.location.reload(); // Refresh page after deletion
        } else {
            alert(data.error || "Failed to delete report");
        }
        } catch (error) {
        console.error("Error deleting report:", error);
        }
    };
    // Helper to format date
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) { return 'Invalid date'; }
    };

    // Helper for status styling
    const getStatusColor = (status) => {
        const lowerStatus = status?.toLowerCase() || '';
        if (['completed', 'processed'].includes(lowerStatus)) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        if (['failed'].includes(lowerStatus)) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    };

    // Helper to format keys from patientInformation
    const formatInfoKey = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    const handleBackToApp = () => {
        navigate(-1);  
    };

    if (listLoading) {
        return (<Loading title="Loading reports..." />);
    }

    return (
        <section id="dashboard" className="py-10 pt-0 bg-white dark:bg-gray-900">
            <nav className="relative z-10 p-6 pb-0 flex justify-start items-center dark:text-white">
                <button 
                onClick={handleBackToApp}
                className={"flex items-center gap-2 transition-colors duration-300 group "}
                >
                <CircleArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300 " />
                <span>Back</span>
                </button>
            </nav>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Your Health Dashboard
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        View structured data extracted from your uploaded reports.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Recent Reports */}
                    <div className="lg:col-span-1.2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Recent Reports ({reports.length})
                        </h3>
                        <div className="space-y-4 max-h-[600px]  overflow-y-auto">
                            {listLoading ? (
                                <div className="text-center py-10">
                                    <Activity className="animate-spin h-8 w-8 text-blue-500 mx-auto" />
                                </div>
                            ) : error ? (
                                <div className="text-center py-10 text-red-500">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                    <p>{error}</p>
                                </div>
                            ) : reports.length > 0 ? (
                                reports.map((report) => (
                                    <div
                                        key={report._id}
                                        onClick={() => handleReportClick(report.report_id || report._id.$oid)}
                                        className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between hover:shadow-lg cursor-pointer transition-all border dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                                    >
                                        {/* Left side */}
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white truncate w-40">
                                                    {report.original_filename || "Unnamed Report"}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(report.upload_date)}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Right side */}
                                        <div className="flex items-center space-x-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    report.status
                                                )}`}
                                            >
                                                {report.status || "pending"}
                                            </span>

                                            {/* Delete button */}
                                            <span>
                                                <X
                                                    className="h-5 w-5 text-gray-400 hover:text-red-500 cursor-pointer transition"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        handleDelete(report._id.$oid);
                                                    }}
                                                />

                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p>You have not uploaded any reports yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Extracted Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700 min-h-[600px]">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Extracted Report Data
                            </h3>
                            {detailsLoading ? (
                                <ComponentLoading />
                            ) : selectedReportData ? (
                                selectedReportData.error ? (
                                    <div className="text-center py-10 text-red-500"><AlertCircle className="h-8 w-8 mx-auto mb-2" /><p>{selectedReportData.error}</p></div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        {/* Patient Information */}
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                                <User className="w-5 h-5 mr-2 text-blue-500" />
                                                Patient Information
                                            </h4>
                                            {selectedReportData.analysis?.patientInformation && Object.keys(selectedReportData.analysis.patientInformation).length > 0 ? (
                                                <div className="space-y-2 text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                                    {Object.entries(selectedReportData.analysis.patientInformation).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-600 py-1.5">
                                                            <span className="text-gray-500 dark:text-gray-400">{formatInfoKey(key)}</span>
                                                            <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-sm text-gray-500 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">No patient information found.</p>}
                                        </div>
                                        {/* Structured Test Results */}
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                                <Beaker className="w-5 h-5 mr-2 text-green-500" />
                                                Test Results
                                            </h4>
                                            {selectedReportData.analysis?.testResults && selectedReportData.analysis.testResults.length > 0 ? (
                                                <div className="space-y-2 text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md max-h-[500px] overflow-y-auto">
                                                    {selectedReportData.analysis.testResults.map((test, index) => (
                                                        <div key={index} className="flex justify-between border-b border-gray-200 dark:border-gray-600 py-1.5">
                                                            <span className="text-gray-500 dark:text-gray-400 flex-1 truncate pr-2">{test.testName}</span>
                                                            <span className="font-medium text-gray-800 dark:text-gray-200">{test.result} {test.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-sm text-gray-500 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">No test results were extracted.</p>}
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">Click on a report to view its details.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Dashboard;