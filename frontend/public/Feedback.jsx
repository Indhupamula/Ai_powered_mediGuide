import React from 'react';
import { Star , CircleArrowLeft} from 'lucide-react';

const FeedBack = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Patient",
      image: "👩‍⚕️",
      rating: 5,
      text: "MediGuide AI helped me understand my blood test results in simple terms. The dietary recommendations were spot-on!"
    },
    {
      name: "Dr. Michael Chen",
      role: "Healthcare Provider",
      image: "👨‍⚕️",
      rating: 5,
      text: "I recommend MediGuide AI to my patients. It bridges the gap between complex medical data and patient understanding."
    },
    {
      name: "Emily Rodriguez",
      role: "Health Enthusiast",
      image: "👩‍💼",
      rating: 5,
      text: "The medication interaction checker saved me from a potential issue. This tool is invaluable for managing health."
    }
  ];
  const handleBackToApp = () => {
    navigate(-1);  
  };

  return (
    <section className="py-10 pt-0 bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 transition-colors duration-300">
      <nav className="relative z-10 p-6 flex justify-start items-center dark:text-white">
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
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Join thousands of users who trust MediGuide AI for their healthcare needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-2xl dark:shadow-gray-900/20 p-6 hover:shadow-2xl dark:hover:shadow-gray-900/30 transition-all duration-300 transform hover:-translate-y-1 border border-transparent dark:border-gray-700"
            >
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{testimonial.image}</div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white transition-colors duration-300">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 dark:text-yellow-300 fill-current transition-colors duration-300" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeedBack;