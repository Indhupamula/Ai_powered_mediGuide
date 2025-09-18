import React from 'react';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Shield, CheckCircle } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/feature', label: 'Features' },
    { href: '/upload', label: 'Upload Report' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/feedback', label: 'FeedBack' },
    { href: '#contact', label: 'Contact' },
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'Terms of Service' },
  ];
  
  const services = [
    { href: '/smartreportanalysis', label: 'Report Analysis' },
    { href: '/allnsights', label: 'Health Insights' },
    { href: '/comingsoon', label: 'Medication Guide' },
    { href: '/dietrecommendations', label: 'Diet Recommendations' },
    { href: '/healthdashboard', label: 'Health Tracking' },
    { href: '#', label: 'AI Consultation' },
  ];

  return (
    <footer id="contact" className="bg-gray-900 dark:bg-gray-950 text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-linear-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">MediGuide AI</h3>
            </div>
            <p className="text-gray-400 dark:text-gray-300 leading-relaxed">
              Empowering patients with AI-powered healthcare insights and personalized recommendations for better health management.
            </p>
            <div className="flex space-x-4">
                <a
                  href="https://www.facebook.com/share/1A6pJVCvg1/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-6 w-6 text-gray-400 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors duration-300" />
                </a>

                <a
                  href="https://x.com/shivay_7352"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-6 w-6 text-gray-400 dark:text-gray-300 hover:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors duration-300" />
                </a>

                <a
                  href="https://www.instagram.com/shivay_7352"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-6 w-6 text-gray-400 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 cursor-pointer transition-colors duration-300" />
                </a>

                <a
                  href="https://linkedin.com/in/AgyanshuKumar"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-6 w-6 text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 cursor-pointer transition-colors duration-300" />
                </a>
              </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((item, index) => (
                <li key={index}>
                  <a 
                    href={item.href} 
                    className="text-gray-400 dark:text-gray-300 hover:text-white dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Services</h4>
            <ul className="space-y-2">
              {services.map((service,index) => (
                <li key={index}>
                  <a 
                    href={service.href}
                    className="text-gray-400 dark:text-gray-300 hover:text-white dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    {service.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <span className="text-gray-400 dark:text-gray-300">support@mediguideai.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <span className="text-gray-400 dark:text-gray-300">+91 707953****</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <span className="text-gray-400 dark:text-gray-300">Kolkata, West Bengal</span>
              </div>
            </div>
            <div className="mt-6">
              <h5 className="text-sm font-semibold mb-2 text-white">Subscribe to our newsletter</h5>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 dark:bg-gray-700 text-white placeholder-gray-400 dark:placeholder-gray-300 px-4 py-2 rounded-l-lg flex-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-0 transition-colors duration-300"
                />
                <button className="bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 px-4 py-2 rounded-r-lg hover:opacity-90 transition-opacity duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 dark:border-gray-700 mt-10 pt-5 transition-colors duration-300">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 dark:text-gray-300 text-sm">
              © 2024 MediGuide AI. All rights reserved. Built with ❤️ for better healthcare.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;