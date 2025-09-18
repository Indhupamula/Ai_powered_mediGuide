import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleArrowLeft, Upload, BrainCircuit, FileText, Loader2, AlertTriangle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://curagenie-backend.onrender.com';


const SmartReportAnalysis = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, analyzing, success, error
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState('ocr'); // 'ocr' or 'ai'
    const fileInputRef = useRef(null);

    // --- STEP 1: TOKEN GET KARNE KE LIYE FUNCTION ---
    const getAuthToken = () => {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
    };
    // ---------------------------------------------

    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setFileName(selectedFile.name);
        setStatus('uploading');
        setError('');
        setAnalysisResult(null);

        // --- STEP 2: UPLOAD SE PEHLE TOKEN CHECK KAREIN ---
        const token = getAuthToken();
        if (!token) {
            setError("Authentication error. Please log in to analyze reports.");
            setStatus('error');
            navigate('/login');
            return;
        }
        // ----------------------------------------------------

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // --- STEP 3: DONO FETCH CALLS MEIN AUTHORIZATION HEADER ADD KAREIN ---
            const uploadResponse = await fetch(`${API_BASE_URL}/api/reports/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            const uploadData = await uploadResponse.json();
            if (!uploadResponse.ok) throw new Error(uploadData.error || 'File upload failed');

            setStatus('analyzing');
            const analysisResponse = await fetch(`${API_BASE_URL}/api/analysis/smart/${uploadData.report_id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            // --------------------------------------------------------------------
            
            const analysisData = await analysisResponse.json();
            if (!analysisResponse.ok) throw new Error(analysisData.error || 'Analysis failed');

            setAnalysisResult(analysisData.analysis);
            setStatus('success');
        } catch (err) {
            setError(err.message);
            setStatus('error');
        }
    };

    const getStatusColor = (status) => {
        status = status?.toLowerCase();
        if (status === 'high') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        if (status === 'low') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                            <CircleArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Report Analysis</h1>
                    </div>
                    {/* ... (baaki ka JSX same rahega) ... */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Upload Section */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Upload Medical Reports</h2>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center cursor-pointer hover:border-blue-500 transition-colors" onClick={() => fileInputRef.current.click()}>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">Drop your medical reports here or click to browse</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Supports multiple file formats up to 10MB each</p>
                            </div>
                            {fileName && <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">Uploaded: <span className="font-medium text-blue-600 dark:text-blue-400">{fileName}</span></p>}
                        </div>

                        {/* Analysis Results Section */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700 min-h-[300px]">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Analysis Results</h2>
                            {status === 'analyzing' && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}
                            {status === 'error' && <div className="flex justify-center items-center h-full text-red-500"><AlertTriangle className="h-6 w-6 mr-2"/> {error}</div>}
                            
                            {status === 'success' && analysisResult && (
                                activeView === 'ocr' ? (
                                    // OCR View
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Patient Information</h3>
                                                {Object.entries(analysisResult.structuredData.patientInformation).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between text-sm mt-1"><span className="text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1)}:</span><span className="font-medium text-gray-800 dark:text-gray-200">{value}</span></div>
                                                ))}
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"><h3 className="font-semibold text-gray-700 dark:text-gray-300">Test Type</h3><p className="font-medium text-gray-800 dark:text-gray-200">Complete Blood Count</p><span className="text-xs text-green-600">✓ Successfully extracted</span></div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Findings</h3>
                                            <div className="space-y-2">
                                                {analysisResult.structuredData.keyFindings.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                        <div><p className="font-medium text-gray-800 dark:text-gray-200">{item.testName}</p><p className="text-xs text-gray-500">Normal range: {item.range}</p></div>
                                                        <div className="text-right"><p className="font-bold text-lg text-gray-900 dark:text-white">{item.result} {item.unit}</p><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>{item.status}</span></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // AI View
                                    <div className="space-y-4">
                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                            <h3 className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2"><BrainCircuit className="h-5 w-5"/> AI Summary</h3>
                                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{analysisResult.aiInterpretation.summary}</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                            <h3 className="font-semibold text-green-800 dark:text-green-300">Suggestions</h3>
                                            <ul className="mt-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                                                {analysisResult.aiInterpretation.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700"><h3 className="font-semibold text-gray-800 dark:text-white mb-3">Advanced Features</h3><div className="space-y-3 text-sm"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-blue-500"/><div><p className="font-medium text-gray-700 dark:text-gray-300">OCR Technology</p><p className="text-xs text-gray-500">Extract text from images and PDFs</p></div></div><div className="flex items-center gap-3"><BrainCircuit className="h-5 w-5 text-purple-500"/><div><p className="font-medium text-gray-700 dark:text-gray-300">AI Analysis</p><p className="text-xs text-gray-500">Intelligent medical data interpretation</p></div></div></div></div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700"><h3 className="font-semibold text-gray-800 dark:text-white mb-3">Tips for Best Results</h3><ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside"><li>Ensure clear, high-resolution images</li><li>Avoid blurry or rotated documents</li><li>Upload complete reports for accurate analysis</li></ul></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartReportAnalysis;