import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle,CircleArrowLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://curagenie-backend.onrender.com';


const UploadSection = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef(null);

    // --- STEP 1: TOKEN GET KARNE KE LIYE FUNCTION ADD KAREIN ---
    const getAuthToken = () => {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
    };
    // -----------------------------------------------------------

    const performAnalysis = async (file) => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setUploadSuccess(false);
        setSelectedFile(file);

        // --- STEP 2: UPLOAD SE PEHLE TOKEN CHECK KAREIN ---
        const token = getAuthToken();
        if (!token) {
            setError("Authentication error. Please log in to upload a report.");
            setIsUploading(false);
            navigate('/login'); // User ko login page par bhej dein
            return;
        }
        // ----------------------------------------------------

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadResponse = await fetch(`${API_BASE_URL}/api/reports/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const uploadResult = await uploadResponse.json();
            console.log('====================UPLOAD RESULT============');
            console.log(uploadResult);

            if (!uploadResponse.ok) throw new Error(uploadResult.error || 'Upload failed');

            const report_id = uploadResult.report_id;

            // ⬇️ Store report_id & analysis for later use
            sessionStorage.setItem('latestReportId', report_id);
            sessionStorage.setItem('latestAnalysis', JSON.stringify(uploadResult.analysis));

            setUploadSuccess(true);

        } catch (err) {
            setError(err.message);
            setSelectedFile(null);
        } finally {
            setIsUploading(false);
        }
    };
    const handleFileChange = (event) => performAnalysis(event.target.files[0]);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { e.preventDefault(); performAnalysis(e.dataTransfer.files[0]); };
    const handleViewAnalysisClick = (e) => { e.stopPropagation(); navigate('/dashboard'); };
    const handleBackToApp = () => { navigate(-1); };

    return (
        <section id="upload" className="py-20 pt-0 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
            <nav className="relative z-10 p-6 flex justify-start items-center dark:text-white">
                <button 
                onClick={handleBackToApp}
                className={"flex items-center gap-2 transition-colors duration-300 group "}
                >
                <CircleArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300 " />
                <span>Back</span>
                </button>
            </nav>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12"><h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Upload Your Medical Report</h2><p className="text-xl text-gray-600 dark:text-gray-300">Get instant AI-powered analysis</p></div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-transparent dark:border-gray-700">
                    <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer" onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="hidden"/>
                        {isUploading ? (<div className="space-y-4"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div><p className="text-lg font-medium text-blue-600 dark:text-blue-400">Uploading & Analyzing...</p></div>) 
                        : uploadSuccess ? (<div className="space-y-4"><CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto" /><p className="text-lg font-medium text-gray-900 dark:text-white">File processed successfully!</p><p className="text-gray-600 dark:text-gray-300">{selectedFile?.name}</p><button onClick={handleViewAnalysisClick} className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105">View Dashboard</button></div>) 
                        : (<div className="space-y-4"><Upload className="h-16 w-16 text-blue-400 dark:text-blue-300 mx-auto" /><div><p className="text-lg font-medium text-gray-900 dark:text-white">Drop your medical report here</p><p className="text-gray-500 dark:text-gray-400">or click to browse files</p></div></div>)}
                    </div>
                    {error && (<div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center space-x-3"><AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /><p className="text-sm text-red-700 dark:text-red-300">{error}</p></div>)}
                </div>
            </div>
        </section>
    );
};

export default UploadSection;