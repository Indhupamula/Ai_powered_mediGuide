import React from 'react';
import { FileText, Brain, Pill, Activity, Shield, Users,CircleArrowLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const FeaturesSection = () => {
  const navigate = useNavigate();

  const goToPage = (link) => {
    navigate(link);
  };
  const handleBackToApp = () => {
    navigate(-1);  
  };

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      href: "/smartreportanalysis", // Fixed typo: smartrepotanalysis -> smartreportanalysis
      title: "Smart Report Analysis",
      description: "Upload PDFs, images, or documents. Our OCR technology extracts and analyzes medical data automatically.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      href: "/allnsights", 
      title: "AI-Powered Insights",
      description: "Get personalized health insights and recommendations based on your medical reports and test results.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Pill className="h-8 w-8" />,
      href: "/comingsoon", 
      title: "Medication Guide",
      description: "Detailed explanations of prescribed medications, side effects, and food interactions.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <Activity className="h-8 w-8" />,
      href: "/dietrecommendations",
      title: "Diet Recommendations",
      description: "Personalized dietary suggestions based on your test values and health conditions.",
      color: "from-red-500 to-red-600"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      href: "#",
      title: "Secure & Private",
      description: "Your health data is encrypted and secure. We prioritize your privacy and data protection.",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      href: "/healthdashboard",
      title: "Health Dashboard",
      description: "Track your health progress over time with our comprehensive dashboard and analytics.",
      color: "from-pink-500 to-pink-600"
    }
  ];

  return (
    <section id="features" className="py-10 pt-0 bg-white dark:bg-gray-900 transition-colors duration-300">

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
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            Powerful Features for Better Health Management
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
            Our AI-powered platform provides comprehensive analysis and personalized recommendations 
            to help you understand and manage your health better.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              onClick={() => { goToPage(feature.href) }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-700/50 hover:shadow-2xl dark:hover:shadow-gray-600/50 transition-all duration-300 transform hover:-translate-y-2 p-8 border border-gray-100 dark:border-gray-700 cursor-pointer group"
            >
              <div className={`bg-linear-to-r ${feature.color} text-white p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                {feature.description}
              </p>
              
              {/* Optional: Add a subtle hover indicator */}
            
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Learn more →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;