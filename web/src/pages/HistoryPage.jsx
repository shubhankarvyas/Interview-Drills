import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { attemptsAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';

const HistoryPage = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const response = await attemptsAPI.getHistory();
      setAttempts(response.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-400/10 border-green-400/20 text-green-400';
    if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400';
    return 'bg-red-400/10 border-red-400/20 text-red-400';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorDisplay message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="content-glass p-8 mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold text-white mb-4">
            Your Progress History 📈
          </h1>
          <p className="text-gray-300 text-lg">
            Track your improvement over time and review your past attempts.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="content-glass p-6 animate-fadeIn">
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-2">{attempts.length}</p>
              <p className="text-gray-400 text-sm">Total Attempts</p>
            </div>
          </div>
          
          <div className="content-glass p-6 animate-fadeIn">
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-2">
                {attempts.length > 0 ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length) : 0}%
              </p>
              <p className="text-gray-400 text-sm">Average Score</p>
            </div>
          </div>
          
          <div className="content-glass p-6 animate-fadeIn">
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-2">
                {attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0}%
              </p>
              <p className="text-gray-400 text-sm">Best Score</p>
            </div>
          </div>
          
          <div className="content-glass p-6 animate-fadeIn">
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-2">
                {new Set(attempts.map(a => a.drillId?._id)).size}
              </p>
              <p className="text-gray-400 text-sm">Drills Attempted</p>
            </div>
          </div>
        </div>

        {/* Attempts List */}
        <div className="content-glass p-6 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Attempts</h2>
          
          {attempts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No attempts yet</h3>
              <p className="text-gray-400 mb-6">
                Start taking some drills to see your progress here.
              </p>
              <Link
                to="/dashboard"
                className="glass-button text-white hover:bg-blue-500/20 hover:border-blue-500/30 transition-all duration-300"
              >
                Browse Drills
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt, index) => (
                <div
                  key={attempt._id}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 transition-all duration-300 hover:bg-white/10 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {attempt.drillId?.title || 'Unknown Drill'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>📅 {formatDate(attempt.createdAt)}</span>
                        <span>⏱️ {attempt.timeSpent ? `${Math.round(attempt.timeSpent / 60)}min` : 'N/A'}</span>
                        {attempt.drillId?.difficulty && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            attempt.drillId.difficulty === 'Easy' ? 'bg-green-400/10 text-green-400' :
                            attempt.drillId.difficulty === 'Medium' ? 'bg-yellow-400/10 text-yellow-400' :
                            'bg-red-400/10 text-red-400'
                          }`}>
                            {attempt.drillId.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getScoreBadge(attempt.score)}`}>
                        <span className="text-2xl mr-2">{attempt.score >= 80 ? '🎉' : attempt.score >= 60 ? '👍' : '💪'}</span>
                        {attempt.score}%
                      </div>
                    </div>
                  </div>
                  
                  {attempt.drillId?.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {attempt.drillId.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-gray-400 text-sm">
                      {attempt.answers?.length || 0} questions answered
                    </div>
                    <Link
                      to={`/drill/${attempt.drillId?._id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Retake Drill →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
