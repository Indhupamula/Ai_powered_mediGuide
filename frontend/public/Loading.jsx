import React from "react";


const PulseRing = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  const colorClasses = {
    blue: 'border-blue-500',
    purple: 'border-purple-500', 
    pink: 'border-pink-500',
    green: 'border-green-500'
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} ${colorClasses[color]} border-4 opacity-20 rounded-full`} />
      <div className={`${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full animate-spin absolute top-0 left-0`} />
    </div>
  );
};

const Loading = ({ title }) => {
  return (
        <div className="min-h-[80vh] flex-col flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
            <h3 className="text-white font-semibold mb-4">{title}</h3>
            <div className="mb-4 flex items-center justify-center">
                <PulseRing color="green" />
            </div>
            <div className="flex item-center justify-center space-x-4 mb-4">
                <PulseRing size="sm" color="blue" />
                <PulseRing size="lg" color="purple" />
            </div>
            </div>
  );
};

export default Loading;
