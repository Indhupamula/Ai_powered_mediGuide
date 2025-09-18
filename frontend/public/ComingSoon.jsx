import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Clock, Zap, Star, ArrowLeft, Bell } from 'lucide-react';

// Theme hook that works with your existing Navbar theme system
const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return saved === 'dark' || (!saved && prefersDark);
    }
    return false;
  });

  // Listen for theme changes from navbar
  useEffect(() => {
    const handleThemeChange = () => {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(saved === 'dark' || (!saved && prefersDark));
    };

    // Listen for storage changes (when theme is changed from navbar)
    window.addEventListener('storage', handleThemeChange);
    
    // Also listen for DOM class changes
    const observer = new MutationObserver(() => {
      const hasClass = document.documentElement.classList.contains('dark');
      setIsDark(hasClass);
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  return { isDark };
};

const ComingSoonPage = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { isDark: isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const handleBackToApp = () => {
      navigate(-1);  
  };
  
  const handleNotifyMe = () => {
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };


  const floatingElements = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      className={`absolute w-2 h-2 rounded-full animate-pulse opacity-70 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-purple-400 to-pink-400' 
          : 'bg-gradient-to-r from-purple-500 to-pink-500'
      }`}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${i * 0.5}s`,
        animationDuration: `${2 + Math.random() * 2}s`
      }}
    />
  ));

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {floatingElements}
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${
          isDarkMode ? 'bg-purple-500/10' : 'bg-purple-500/20'
        }`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDarkMode ? 'bg-pink-500/10' : 'bg-pink-500/20'
        }`} style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation - Only Back button, no theme toggle */}
      <nav className="relative z-10 p-6 flex justify-start items-center">
        <button 
          onClick={handleBackToApp}
          className={`flex items-center gap-2 transition-colors duration-300 group ${
            isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back to App</span>
        </button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        {/* Icon with glow effect */}
        <div className="relative mb-8">
          <div className={`absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse ${
            isDarkMode ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }`} />
          <div className={`relative p-6 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }`}>
            <Zap className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Main heading */}
        <h1 className={`text-5xl md:text-7xl font-bold text-transparent bg-clip-text mb-4 animate-pulse ${
          isDarkMode 
            ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400' 
            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600'
        }`}>
          Coming Soon
        </h1>

        <div className={`flex items-center gap-2 mb-6 ${
          isDarkMode ? 'text-yellow-400' : 'text-orange-500'
        }`}>
          <Star className="w-5 h-5 fill-current" />
          <span className="text-lg font-medium">Exciting New Feature</span>
          <Star className="w-5 h-5 fill-current" />
        </div>

        <p className={`text-xl md:text-2xl max-w-2xl mb-8 leading-relaxed ${
          isDarkMode ? 'text-white/80' : 'text-gray-700'
        }`}>
          We're crafting something amazing just for you. Get ready for an incredible experience that will transform how you manage your health with MediGuide AI.
        </p>

        {/* Email subscription */}
        <div className="w-full max-w-md">
          {!isSubscribed ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-blue-500 focus:border-transparent focus:bg-white/15'
                      : 'bg-white/70 border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 shadow-lg focus:bg-white/90'
                  }`}
                />
              </div>
              <button
                onClick={handleNotifyMe}
                disabled={!email.trim()}
                className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 ${
                  email.trim() 
                    ? 'hover:from-blue-700 hover:to-purple-700 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className={`border rounded-lg p-4 flex items-center gap-2 justify-center transition-all duration-300 ${
              isDarkMode 
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : 'bg-green-100 border-green-300 text-green-700'
            }`}>
              <Star className="w-5 h-5" />
              <span>Thanks! We'll notify you when it's ready.</span>
            </div>
          )}
        </div>

        <p className={`text-sm mt-4 flex items-center gap-1 ${
          isDarkMode ? 'text-white/50' : 'text-gray-500'
        }`}>
          <Clock className="w-4 h-4" />
          Get notified when this feature launches
        </p>
      </div>
    </div>
  );
};

export default ComingSoonPage;