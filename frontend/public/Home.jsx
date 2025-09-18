import React from 'react';
import { useNavigate } from "react-router-dom";
import { Upload, Activity, CheckCircle, Shield, Zap, Brain, Pill, TrendingUp, AlertCircle } from 'lucide-react';


const Home = () => {
  const navigate = useNavigate();
  const uploadFile = () => {
      navigate("/upload"); 
    };
  return (
    <section id="home" className=" min-h-[80vh] pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight dark:text-white">
                Your AI-Powered 
                <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Healthcare</span> Assistant
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Upload your medical reports and get personalized insights, dietary recommendations, 
                and easy-to-understand explanations powered by advanced AI technology.
              </p>
            </div>
            
            <div  className="flex flex-col sm:flex-row gap-4">
              <button onClick={uploadFile} className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Report Now
              </button>
              <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center">
                <Activity className="h-5 w-5 mr-2" />
                View Demo
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500 dark:bg-gray-800">
              <div className="bg-linear-to-br from-blue-100 to-purple-100 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Medical Report Analysis</h3>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✓ Analyzed
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">Blood Pressure: Normal</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Cholesterol: Good</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-gray-700">Vitamin D: Low</span>
                  </div>
                </div>
              </div>
              <div className="bg-linear-to-r from-green-50 to-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-2">AI Recommendations</h4>
                <p className="text-sm text-gray-600">Increase sun exposure and consider vitamin D supplements. Maintain current diet for cholesterol management.</p>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-blue-500 text-white p-3 rounded-full animate-bounce">
              <Brain className="h-6 w-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white p-3 rounded-full animate-pulse">
              <Pill className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;