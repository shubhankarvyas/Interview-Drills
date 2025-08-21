import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { drillsAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';

const Dashboard = () => {
  const { user } = useAuth();
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDrills();
  }, []);

  const fetchDrills = async () => {
    try {
      setLoading(true);
      const response = await drillsAPI.getAll();
      setDrills(response.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrills = drills.filter(drill => {
    if (filter === 'all') return true;
    return drill.difficulty.toLowerCase() === filter;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="content-glass p-8 mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-300 text-lg">
            Choose a drill to sharpen your skills and track your progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="content-glass p-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Drills</p>
                <p className="text-3xl font-bold text-white">{drills.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>
          
          <div className="content-glass p-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="content-glass p-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-3xl font-bold text-white">--</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="content-glass p-6 mb-8 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-4">Available Drills</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {['all', 'easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filter === level
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          {/* Drills Grid */}
          {filteredDrills.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No drills found</h3>
              <p className="text-gray-400">
                {filter === 'all' 
                  ? 'No drills are available yet.' 
                  : `No ${filter} drills available.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrills.map((drill, index) => (
                <Link
                  key={drill._id}
                  to={`/drill/${drill._id}`}
                  className="group block animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-blue-500/30 hover:shadow-2xl">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {drill.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(drill.difficulty)}`}>
                        {drill.difficulty}
                      </span>
                    </div>
                    
                    {drill.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {drill.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {drill.tags?.slice(0, 2).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                        {drill.tags?.length > 2 && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-md">
                            +{drill.tags.length - 2}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {drill.questions?.length || 0} questions
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                        Start Drill →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
