import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './PracticeQuizView.css'; // Use PracticeQuizView styles

const QuizView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [fillInAnswer, setFillInAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [kcDetails, setKcDetails] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const kcId = queryParams.get('kc_id');
    const mode = queryParams.get('mode');

    if (!kcId && mode === 'sequential') {
      setError('No knowledge component specified for sequential quiz');
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setError('User information not available');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Get knowledge component details if we have a KC ID
        if (kcId) {
          try {
            const kcResponse = await axios.get(`/api/admin/knowledge-components/${kcId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (kcResponse.data) {
              setKcDetails(kcResponse.data);
            }
          } catch (kcErr) {
            console.warn('Could not fetch KC details:', kcErr);
          }
        }

        // Fetch quiz sequence
        let questionsData = [];
        
        if (mode === 'sequential' && kcId) {
          // Sequential mode - get questions for specific KC
          const sequenceResponse = await axios.get(`/api/students/kcs/sequence?kc_id=${kcId}&limit=8`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!sequenceResponse.data || !Array.isArray(sequenceResponse.data) || sequenceResponse.data.length === 0) {
            throw new Error('No questions available for this topic');
          }

          // Fetch full question details for each item in sequence
          const questionPromises = sequenceResponse.data.map(async (item) => {
            try {
              const contentResponse = await axios.get(`/api/content/${item.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return contentResponse.data;
            } catch (err) {
              console.warn(`Failed to load question ${item.id}:`, err);
              return null; // Skip failed questions
            }
          });

          const allQuestions = await Promise.all(questionPromises);
          questionsData = allQuestions.filter(q => q !== null); // Remove failed questions

        } else {
          // Regular mode - get recommended content
          const response = await axios.get(`/api/students/${user.id}/recommended-content?limit=8`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          questionsData = response.data || [];
        }

        if (questionsData.length === 0) {
          throw new Error('No questions available for this quiz');
        }

        // Format questions
        const formattedQuestions = questionsData.map(item => ({
          id: item.id,
          content: item.content,
          options: item.options || [],
          correct_answer: item.correct_answer,
          explanation: item.explanation,
          metadata: item.metadata || {},
          type: item.type,
          difficulty: item.difficulty || 3,
          knowledge_component: item.KnowledgeComponent || item.knowledge_components
        }));

        setQuestions(formattedQuestions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz questions:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load quiz questions');
        setLoading(false);
      }
    };

    fetchData();

    // Start timer
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [location.search, token, user?.id]);

  // Enhanced answer validation function
  const validateAnswer = (studentAnswer, correctAnswer) => {
    if (!studentAnswer || !correctAnswer) {
      return false;
    }
    
    // Convert both to strings and trim whitespace
    const studentAns = String(studentAnswer).trim().toLowerCase();
    const correctAns = String(correctAnswer).trim().toLowerCase();
    
    // Direct match check
    if (studentAns === correctAns) {
      return true;
    }
    
    // For numeric answers, extract just the number
    const studentNumMatch = studentAns.match(/^(-?\d+(\.\d+)?)(\s*[a-zA-Z²³°]+\d*)?$/);
    const correctNumMatch = correctAns.match(/^(-?\d+(\.\d+)?)(\s*[a-zA-Z²³°]+\d*)?$/);
    
    if (studentNumMatch && correctNumMatch) {
      return studentNumMatch[1] === correctNumMatch[1];
    }
    
    // Special case for negative numbers
    if (correctAns === "-10" && (studentAns.includes("negative 10") || studentAns.includes("-10"))) {
      return true;
    }
    
    // Check for alternative spellings or formats
    const alternatives = [
      correctAns,
      correctAns.replace(/\s+/g, ''), // Remove all spaces
      correctAns.replace(/[.,;:!?]/g, ''), // Remove punctuation
      correctAns.replace(/\s+/g, '').replace(/[.,;:!?]/g, '') // Remove both spaces and punctuation
    ];
    
    if (alternatives.includes(studentAns)) {
      return true;
    }
    
    // Check for close matches (80% similarity)
    if (studentAns.length > 3 && correctAns.length > 3) {
      if (studentAns.includes(correctAns) || correctAns.includes(studentAns)) {
        return true;
      }
      
      if (Math.abs(studentAns.length - correctAns.length) <= 1) {
        let matchCount = 0;
        const minLength = Math.min(studentAns.length, correctAns.length);
        for (let i = 0; i < minLength; i++) {
          if (studentAns[i] === correctAns[i]) matchCount++;
        }
        
        const matchPercentage = matchCount / minLength;
        if (matchPercentage >= 0.8) {
          return true;
        }
      }
    }
    
    return false;
  };

  const handleOptionSelect = (option) => {
    if (!submitted) {
      setSelectedOption(option);
    }
  };

  const handleFillInChange = (e) => {
    if (!submitted) {
      setFillInAnswer(e.target.value);
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;

    const currentQuestion = questions[currentQuestionIndex];
    let isCorrect = false;

    if (currentQuestion.type === 'fill_in_blank') {
      isCorrect = validateAnswer(fillInAnswer, currentQuestion.correct_answer);
    } else {
      isCorrect = validateAnswer(selectedOption, currentQuestion.correct_answer);
    }

    setSubmitted(true);
    setCorrect(isCorrect);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Store answered question details
    setAnsweredQuestions(prev => [
      ...prev,
      {
        questionText: currentQuestion.content,
        studentAnswer: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption,
        correctAnswer: currentQuestion.correct_answer,
        isCorrect: isCorrect,
        options: currentQuestion.options || null,
        knowledgeComponent: currentQuestion.knowledge_component?.name || 'N/A',
        questionNumber: currentQuestionIndex + 1
      }
    ]);
    
    // Submit response to backend
    try {
      await axios.post(`/api/students/${user.id}/responses`, {
        content_item_id: currentQuestion.id,
        answer: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption,
        time_spent: timeSpent, 
        interaction_data: {
          selectedOption: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption
        },
        correct: isCorrect
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error recording response:', err);
      // Non-critical, so continue without showing error to user
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setFillInAnswer('');
      setSubmitted(false);
      setCorrect(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/student');
  };

  const handleRetryQuiz = () => {
    // Reset all state
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setFillInAnswer('');
    setSubmitted(false);
    setCorrect(null);
    setScore(0);
    setQuizCompleted(false);
    setAnsweredQuestions([]);
    setTimeSpent(0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading Math Mastery Quiz...</h2>
        <p>Please wait while we prepare your questions.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={handleBackToDashboard}>Back to Dashboard</button>
      </div>
    );
  }

  if (quizCompleted) {
    const masteryLevel = questions.length > 0 ? score / questions.length : 0;
    let masteryStatusText = '';
    let encouragingQuote = '';

    if (masteryLevel >= 0.9) {
      masteryStatusText = 'Mastered!';
      encouragingQuote = 'Wow! You mastered this topic! Amazing job! 🚀';
    } else if (masteryLevel >= 0.75) {
      masteryStatusText = 'Excellent!';
      encouragingQuote = 'Great work! You\'re doing fantastic! Keep it up! ✨';
    } else if (masteryLevel >= 0.5) {
      masteryStatusText = 'Good Progress';
      encouragingQuote = 'Nice try! You\'re learning well. Practice makes perfect! 💪';
    } else {
      masteryStatusText = 'Needs Review';
      encouragingQuote = 'Great start! Let\'s keep practicing to get even better! 💡';
    }

    return (
      <div className="quiz-completion">
        <h2>Math Mastery Quiz Complete!</h2>
        {kcDetails && (
          <div className="kc-info">
            <h3>{kcDetails.name}</h3>
            <p>You've completed your math mastery assessment for this topic.</p>
          </div>
        )}
        <div className="quiz-summary">
          <div className="summary-card">
            <h3>Your Score</h3>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{score}</span>
                <span className="score-total">/ {questions.length}</span>
              </div>
              <div className="score-percentage">
                {((score / questions.length) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="time-display">
              <span>Time Spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
            </div>
            <p><strong>Status:</strong> {masteryStatusText}</p>
          </div>

          <div className="feedback-section">
            <h3>How did you do?</h3>
            <div className={masteryLevel >= 0.9 ? 'perfect-score' : masteryLevel >= 0.75 ? 'good-score' : masteryLevel >= 0.5 ? 'average-score' : 'needs-practice'}>
              <p>{encouragingQuote}</p>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={handleBackToDashboard} className="back-button">
              Back to Dashboard
            </button>
            <button onClick={handleRetryQuiz} className="retry-button">
              Try Again
            </button>
          </div>

          {/* Question breakdown */}
          {answeredQuestions.length > 0 && (
            <details style={{ marginTop: '2rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
                Show Question Breakdown
              </summary>
              <div style={{ marginTop: '1rem' }}>
                {answeredQuestions.map((item, index) => (
                  <div key={index} style={{ 
                    padding: '1rem', 
                    margin: '0.5rem 0', 
                    border: `2px solid ${item.isCorrect ? '#2ecc71' : '#e74c3c'}`,
                    borderRadius: '8px',
                    backgroundColor: item.isCorrect ? '#eafaf1' : '#fdedec'
                  }}>
                    <h4>Question {item.questionNumber}: {item.knowledgeComponent}</h4>
                    <p><strong>Q:</strong> {item.questionText}</p>
                    {item.options && (
                      <ul>
                        {item.options.map((opt, i) => (
                          <li key={i} style={{
                            fontWeight: item.studentAnswer === opt ? 'bold' : 'normal',
                            color: item.correctAnswer === opt ? '#27ae60' : (item.studentAnswer === opt && !item.isCorrect ? '#c0392b' : 'inherit')
                          }}>
                            {opt}
                            {item.studentAnswer === opt && <span> (Your answer)</span>}
                            {item.correctAnswer === opt && item.studentAnswer !== opt && <span> (Correct answer)</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!item.options && (
                      <>
                        <p><strong>Your Answer:</strong> <span style={{ color: item.isCorrect ? '#27ae60' : '#c0392b' }}>{item.studentAnswer}</span></p>
                        {!item.isCorrect && <p><strong>Correct Answer:</strong> {item.correctAnswer}</p>}
                      </>
                    )}
                    <p><strong>Status:</strong> <span style={{ color: item.isCorrect ? '#27ae60' : '#c0392b' }}>{item.isCorrect ? 'Correct ✔️' : 'Incorrect ❌'}</span></p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="practice-quiz">
      <div className="quiz-header">
        <h2>Math Mastery Quiz {kcDetails ? `- ${kcDetails.name}` : ''}</h2>
        <div className="quiz-progress">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        {currentQuestion.difficulty && (
          <div className="question-difficulty">
            Difficulty: {currentQuestion.difficulty}/5
          </div>
        )}
      </div>

      <div className="question-container">
        <h3>{currentQuestion.content}</h3>
        
        {/* Display question image if available */}
        {(() => {
          // Check multiple possible image field locations
          let parsedMetadata = currentQuestion.metadata;
          if (typeof currentQuestion.metadata === 'string') {
            try {
              parsedMetadata = JSON.parse(currentQuestion.metadata);
            } catch (e) {
              parsedMetadata = {};
            }
          }
          
          const imageUrl = currentQuestion.metadata?.imageUrl || 
                           currentQuestion.metadata?.image || 
                           currentQuestion.metadata?.image_url ||
                           currentQuestion.image_url ||
                           currentQuestion.image_path ||
                           parsedMetadata?.imageUrl ||
                           parsedMetadata?.image ||
                           parsedMetadata?.image_url;
          
          if (imageUrl) {
            const fullImageUrl = imageUrl.startsWith('/') ? imageUrl : `/api/images/${imageUrl}`;
            
            return (
              <div className="question-image">
                <img
                  src={fullImageUrl}
                  alt="Question visual"
                  onError={(e) => {
                    console.log('Image failed to load:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            );
          }
          return null;
        })()}

        {currentQuestion.type === 'fill_in_blank' ? (
          <div className="fill-in-container">
            <input
              type="text"
              value={fillInAnswer}
              onChange={handleFillInChange}
              placeholder="Type your answer here..."
              disabled={submitted}
              className={`fill-in-input ${submitted ? (correct ? 'correct' : 'incorrect') : ''}`}
            />
          </div>
        ) : (
          <div className="options-container">
            {currentQuestion.options && currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`option ${selectedOption === option ? 'selected' : ''} 
                          ${submitted && option === currentQuestion.correct_answer ? 'correct' : ''}
                          ${submitted && selectedOption === option && option !== currentQuestion.correct_answer ? 'incorrect' : ''}`}
                onClick={() => handleOptionSelect(option)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>
        )}

        {submitted && (
          <div className="feedback">
            <p className={correct ? 'correct-feedback' : 'incorrect-feedback'}>
              {correct ? 'Correct!' : 'Not quite right'}
            </p>
            {currentQuestion.explanation && (
              <p className="explanation">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
            )}
          </div>
        )}

        <div className="quiz-actions">
          {!submitted ? (
            <button 
              className="submit-button" 
              onClick={handleSubmit}
              disabled={currentQuestion.type === 'fill_in_blank' 
                ? !fillInAnswer.trim() 
                : selectedOption === null}
            >
              Submit Answer
            </button>
          ) : (
            <button className="next-button" onClick={handleNext}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizView;