import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Your original component imports are used here
import { ThemeProvider } from "./components/Navbar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import UploadSection from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import FeaturesSection from "./pages/FeatureSection";
import FeedBack from "./pages/Feedback";
import AIInsightsPage from "./pages/Allnsights";
import SmartReportAnalysis from "./pages/SmartReportAnalysis";
import MedicationGuide from "./pages/MedicationGuide";
import DietRecommendations from "./pages/DietRecommendations";
import HealthDashboard from "./pages/HealthDashboard";
import ComingSoonPage from "./pages/ComingSoon"; 


const AuthContext = createContext(null);


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://curagenie-backend.onrender.com';
console.log("All env variables:", import.meta.env);
console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
console.log("Environment mode:", import.meta.env.MODE);


function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // This effect runs when the app loads to check if a token exists
  // and validates it with the backend to log the user in automatically.
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
            method:'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // If the token is invalid, remove it
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to validate token:", error);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false); 
    };
    validateToken();
  }, [token]);

  // Login function to be called from your Login page
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to login");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      setToken(data.token); 
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message };
    }
  };

  // --- ADD THIS ENTIRE FUNCTION ---
  const signup = async (name, email, password) => {
    try {
      // Assumes your backend has a '/api/auth/register' endpoint
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
       throw new Error(errorData.error || errorData.message || "Registration failed");
      }

      // Automatically log the user in after successful registration
      return await login(email, password);

    } catch (error) {
      return { success: false, message: error.message };
    }
  };
  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // The value provided to all consumer components
 const authContextValue = { user, token, loading, login, logout, signup };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Create a ProtectedRoute Component
// This component checks for authentication before rendering a page.
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // You can replace this with a nice loading spinner component
    return <div>Loading...</div>;
  }

  if (!user) {
    // If the user is not logged in, redirect them to the login page.
    return <Navigate to="/login" replace />;
  }

  // If the user is logged in, show the page.
  return children;
}

// 4. Your main App component with the new structure
function App() {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <Navbar showPopup={showPopup}/>
            <div className="grow pt-16">
              <Routes>
                {/* These routes are public and accessible to everyone */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login setShowPopup={setShowPopup} />} />
                <Route path="/feature" element={<FeaturesSection />} />
                <Route path="/feedback" element={<FeedBack />} />

                {/* These routes are protected. Users will be redirected to /login if not authenticated. */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><UploadSection /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/allnsights" element={<ProtectedRoute><AIInsightsPage /></ProtectedRoute>} />
                <Route path="/smartreportanalysis" element={<ProtectedRoute><SmartReportAnalysis /></ProtectedRoute>} />
                <Route path="/medicationguide" element={<ProtectedRoute><MedicationGuide /></ProtectedRoute>} />
                <Route path="/dietrecommendations" element={<ProtectedRoute><DietRecommendations /></ProtectedRoute>} />
                <Route path="/healthdashboard" element={<ProtectedRoute><HealthDashboard /></ProtectedRoute>} />
                <Route path="/insights/:reportId" element={<ProtectedRoute><AIInsightsPage /></ProtectedRoute>} />
                <Route path="/comingsoon" element={<ProtectedRoute><ComingSoonPage /></ProtectedRoute>} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Export a custom hook to make it easy to access the auth context from any component
export const useAuth = () => {
  return useContext(AuthContext);
};

export default App;