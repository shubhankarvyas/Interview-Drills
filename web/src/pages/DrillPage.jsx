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
    
    try {
      const response = await attemptsAPI.create({
        drillId: id,
        answers
      })
      setResult(response.data)
    } catch (err) {
      setError('Failed to submit answers')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading drill...</div>
  if (error) return <div className="error">{error}</div>
  if (!drill) return <div className="error">Drill not found</div>

  if (result) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Drill Complete!</h2>
        <div className="score">{result.score}/100</div>
        <p>Great job! Your answers have been saved.</p>
        <div style={{ marginTop: '2rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn">
            Back to Dashboard
          </button>
          <button onClick={() => navigate('/history')} className="btn" style={{ marginLeft: '1rem' }}>
            View History
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>{drill.title}</h1>
      <div className={`difficulty ${drill.difficulty.toLowerCase()}`} style={{ marginBottom: '2rem' }}>
        {drill.difficulty}
      </div>
      
      <form onSubmit={handleSubmit}>
        {drill.questions.map((question, index) => (
          <div key={index} className="question">
            <h3>Question {index + 1}</h3>
            <p>{question.question}</p>
            <div className="form-group">
              <textarea
                value={answers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your answer here..."
                required
              />
            </div>
          </div>
        ))}
        
        <button 
          type="submit" 
          className="btn" 
          disabled={submitting || answers.some(answer => !answer.trim())}
        >
          {submitting ? 'Submitting...' : 'Submit Answers'}
        </button>
      </form>
    </div>
  )
}

export default DrillPage
