import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { drillsAPI, attemptsAPI } from '../api'

function DrillPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drill, setDrill] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDrill()
  }, [id])

  const fetchDrill = async () => {
    try {
      const response = await drillsAPI.getById(id)
      setDrill(response.data)
      setAnswers(new Array(response.data.questions.length).fill(''))
    } catch (err) {
      setError('Failed to load drill')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    console.log('Submitting answers:', { drillId: id, answers })
    
    try {
      const response = await attemptsAPI.create({
        drillId: id,
        answers
      })
      console.log('Submission successful:', response.data)
      setResult(response.data)
    } catch (err) {
      console.error('Submission error:', err)
      setError(err.response?.data?.error?.message || 'Failed to submit answers')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-white mx-auto mb-4"></div>
        <p className="text-white">Loading drill...</p>
      </div>
    </div>
  )
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-200 mb-2">Error</h3>
        <p className="text-gray-400">{error}</p>
      </div>
    </div>
  )
  
  if (!drill) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-200 mb-2">Not Found</h3>
        <p className="text-gray-400">Drill not found</p>
      </div>
    </div>
  )

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Drill Completed!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Score</h3>
                <p className="text-3xl font-bold text-green-400">{result.score}/{result.maxScore}</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Percentage</h3>
                <p className="text-3xl font-bold text-blue-400">{result.percentage}%</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Difficulty</h3>
                <p className="text-lg font-semibold text-yellow-400">{drill.difficulty}</p>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => navigate('/history')}
                className="btn-outline"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">{drill.title}</h1>
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                drill.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                drill.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {drill.difficulty}
              </span>
              <span className="text-gray-400">{drill.estimatedTimeMinutes} minutes</span>
            </div>
            <p className="text-gray-300">{drill.description}</p>
          </div>

          {/* Questions Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {drill.questions.map((question, index) => (
              <div key={index} className="bg-gray-700/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Question {index + 1}
                </h3>
                <p className="text-gray-300 mb-4 leading-relaxed">{question.question}</p>
                {question.hints && question.hints.length > 0 && (
                  <div className="mb-4">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                        💡 Hints ({question.hints.length})
                      </summary>
                      <ul className="mt-2 text-gray-400 list-disc list-inside">
                        {question.hints.map((hint, hintIndex) => (
                          <li key={hintIndex}>{hint}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
                <textarea
                  value={answers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Enter your answer here..."
                  required
                  rows={4}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg p-4 text-white placeholder-gray-400 focus:border-gray-400 focus:outline-none resize-vertical"
                />
              </div>
            ))}
            
            <div className="flex gap-4 justify-center pt-4">
              <button 
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={submitting || answers.some(answer => !answer?.trim())}
              >
                {submitting ? 'Submitting...' : 'Submit Answers'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DrillPage
