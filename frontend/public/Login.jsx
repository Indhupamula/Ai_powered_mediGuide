import React, { useState, useEffect, useContext, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; 
import { Eye, EyeOff, Mail, Lock, User, Heart, Shield, Stethoscope, Activity, CircleArrowLeft } from 'lucide-react';



const Login = ({ setShowPopup }) => {
  // Get the login/signup functions from our Auth context
 
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // --- MODIFICATION: Theme state is now handled directly inside this component ---
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [floatingIcons, setFloatingIcons] = useState([]);

  // This function now toggles the theme for the whole page
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };


  useEffect(() => {
    const icons = [
      { Icon: Heart, delay: 0 },
      { Icon: Shield, delay: 2 },
      { Icon: Stethoscope, delay: 4 },
      { Icon: Activity, delay: 6 }
    ];
    setFloatingIcons(icons);
  }, []);

  const handleInputChange = (e) => {
    setError(''); // Clear error on new input
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // The submission logic remains the same
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // --- Sign Up Logic ---
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const result = await signup(formData.name, formData.email, formData.password);
        if (result.success) {
          navigate('/dashboard'); // Redirect on success
        } else {
          throw new Error(result.message);
        }
      } else {
        // --- Sign In Logic ---
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setShowPopup(true); 
          setTimeout(() => setShowPopup(false), 1000);
          navigate('/'); 
          
        } else {
          throw new Error(result.message);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToApp = () => {
    navigate(-1);  
  };

  return (
    <div className="min-h-screen transition-all duration-500 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      
      <nav className="relative z-10 p-6 flex justify-start items-center dark:text-white">
          <button 
          onClick={handleBackToApp}
          className={"flex items-center gap-2 transition-colors duration-300 group "}
          >
          <CircleArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300 " />
          <span>Back</span>
          </button>
      </nav>
      {/* ... (The rest of your beautiful UI code is unchanged) ... */}

      <div className="flex  justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-r from-blue-600 to-purple-700 dark:from-blue-500 dark:to-purple-600 shadow-lg">
              <Heart className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
              MediGuide AI
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your Personal Healthcare Assistant
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-500 bg-white/70 border border-white/20 dark:bg-gray-800/30 dark:border-gray-700/50">
            <div className="relative p-8">
              <div className="flex rounded-xl p-1 mb-6 bg-gray-100/80 dark:bg-gray-700/50">
                <button
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${!isSignUp ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${isSignUp ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'}`}
                >
                  Sign Up
                </button>
              </div>
              
              {error && <p className="text-red-500 text-sm text-center mb-4 animate-fade-in">{error}</p>}

              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <div className="animate-slide-down">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/80 border-gray-200 text-gray-800 placeholder-gray-500 focus:ring-purple-500/50 focus:border-purple-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-purple-500/50 dark:focus:border-purple-500" required />
                    </div>
                  </div>
                )}
                <div className="animate-slide-up">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/80 border-gray-200 text-gray-800 placeholder-gray-500 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500/50 dark:focus:border-blue-500" required />
                  </div>
                </div>
                <div className="animate-slide-up">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} className="w-full pl-11 pr-11 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/80 border-gray-200 text-gray-800 placeholder-gray-500 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500/50 dark:focus:border-blue-500" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {isSignUp && (
                  <div className="animate-slide-down">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} className="w-full pl-11 pr-11 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/80 border-gray-200 text-gray-800 placeholder-gray-500 focus:ring-purple-500/50 focus:border-purple-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-purple-500/50 dark:focus:border-purple-500" required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:scale-100 ${isSignUp ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500/50 shadow-lg hover:shadow-purple-500/25' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500/50 shadow-lg hover:shadow-blue-500/25'}`}
                >
                  {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
