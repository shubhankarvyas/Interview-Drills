import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/8 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500 mb-6 animate-fade-in">
              UPivot
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-gray-400 to-white mx-auto mb-8 rounded-full"></div>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
              Transform Data Into
            </p>
            <p className="text-4xl md:text-5xl font-bold text-white mb-8">
              Actionable Insights
            </p>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Experience the next generation of business intelligence with our cutting-edge analytics platform.
              Make data-driven decisions with confidence.
            </p>
          </div>
          
          {/* Authentication Section */}
          {user ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-2xl text-gray-300 mb-4">
                  Welcome back, <span className="text-white font-semibold">{user.name || user.email}</span>
                </p>
                <Link
                  to="/dashboard"
                  className="inline-block bg-gradient-to-r from-gray-700 to-black text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-black/50 border border-gray-600"
                >
                  Enter Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-xl text-gray-400 mb-8">
                Sign in to unlock powerful analytics
              </p>
              <div className="flex flex-col items-center gap-6">
                <a
                  href="http://localhost:5001/auth/google"
                  className="group relative overflow-hidden bg-gradient-to-r from-gray-800 to-black text-white px-12 py-5 rounded-2xl font-bold text-xl border border-gray-600 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-black/50 min-w-[350px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-700/0 to-gray-700/0 group-hover:from-gray-600/20 group-hover:to-gray-700/20 transition-all duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-4">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                </a>
                
                <a
                  href="http://localhost:5001/auth/linkedin"
                  className="group relative overflow-hidden bg-gradient-to-r from-gray-900 to-black text-white px-12 py-5 rounded-2xl font-bold text-xl border border-gray-700 hover:border-gray-500 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-black/50 min-w-[350px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800/0 to-gray-800/0 group-hover:from-gray-700/20 group-hover:to-gray-800/20 transition-all duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-4">
                    <svg className="w-8 h-8" fill="white" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>Continue with LinkedIn</span>
                  </div>
                </a>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Secure authentication powered by OAuth
              </p>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="group bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 hover:border-gray-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-black/20">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-600">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gray-300 transition-colors duration-300">
              Advanced Analytics
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Harness the power of machine learning and AI-driven insights to uncover hidden patterns in your data.
            </p>
          </div>
          
          <div className="group bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 hover:border-gray-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-black/20">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-600">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gray-300 transition-colors duration-300">
              Real-time Processing
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Process millions of data points in real-time with our lightning-fast analytics engine.
            </p>
          </div>
          
          <div className="group bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 hover:border-gray-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-black/20">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-600">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gray-300 transition-colors duration-300">
              Enterprise Security
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Bank-grade security with end-to-end encryption ensuring your data remains protected at all times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;