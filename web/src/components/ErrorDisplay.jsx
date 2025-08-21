import React from 'react';

const ErrorDisplay = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 text-center ${className}`}>
      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-200 mb-2">Something went wrong</h3>
      <p className="text-gray-400 mb-4">{message || 'An unexpected error occurred'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="glass-button text-white hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
