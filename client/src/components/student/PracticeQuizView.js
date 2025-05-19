import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './PracticeQuizView.css';

const PracticeQuizView = () => {
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
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [practiceScore, setPracticeScore] = useState(0);
  const [kcDetails, setKcDetails] = useState(null);
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [previouslyAnswered, setPreviouslyAnswered] = useState([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const kcId = queryParams.get('kc_id');

    if (!kcId) {
      setError('No knowledge component specified');
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
        // First, fetch the student's knowledge state for this KC to determine their mastery level
        const knowledgeStateResponse = await axios.get(`/api/students/${user.id}/knowledge-states`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Find the knowledge state for this specific KC
        const knowledgeState = knowledgeStateResponse.data.find(
          state => state.knowledge_component_id === parseInt(kcId, 10)
        );
        
        // Get mastery level (default to 0.3 if not found)
        const currentMastery = knowledgeState?.p_mastery || 0.3;
        setMasteryLevel(currentMastery);
        
        // Get knowledge component details
        const kcResponse = await axios.get(`/api/admin/knowledge-components/${kcId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (kcResponse.data) {
          setKcDetails(kcResponse.data);
        }
        
        // Get previously answered questions for this KC to avoid repetition
        const answeredResponse = await axios.get(`/api/students/${user.id}/responses?kc_id=${kcId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (answeredResponse.data && Array.isArray(answeredResponse.data)) {
          // Extract the content item IDs from previous responses
          const answeredItemIds = answeredResponse.data.map(response => response.content_item_id);
          setPreviouslyAnswered(answeredItemIds);
        }

        // Fetch questions for this KC
        const response = await axios.get(`/api/students/${user.id}/recommended-content?kc_id=${kcId}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          throw new Error('No questions available for this topic');
        }

        // Filter questions to ensure they belong to the specified KC
        let filteredQuestions = response.data.filter(item => 
          item.knowledge_component_id === parseInt(kcId, 10)
        );

        if (filteredQuestions.length === 0) {
          throw new Error('No questions available for this specific topic');
        }
        
        // Calculate target difficulty based on current mastery (1-5 scale)
        const targetDifficulty = Math.ceil(currentMastery * 5);
        console.log(`Current mastery: ${currentMastery}, Target difficulty: ${targetDifficulty}`);
        
        // Sort questions by their difficulty match to the student's level
        filteredQuestions = filteredQuestions.map(question => {
          // Default to difficulty 3 if not specified 
          const questionDifficulty = question.difficulty || 3;
          // Calculate how close this question's difficulty is to the target
          const difficultyMatch = Math.abs(questionDifficulty - targetDifficulty);
          return {
            ...question,
            difficultyMatch
          };
        });
        
        // Sort by best difficulty match (lowest difference first)
        filteredQuestions.sort((a, b) => a.difficultyMatch - b.difficultyMatch);
        
        // Remove previously answered questions if possible, but ensure we have at least 5 questions
        if (previouslyAnswered.length > 0) {
          const unansweredQuestions = filteredQuestions.filter(
            q => !previouslyAnswered.includes(q.id)
          );
          
          // Only use unanswered questions if we have enough
          if (unansweredQuestions.length >= 5) {
            filteredQuestions = unansweredQuestions;
          } else {
            console.log("Not enough unanswered questions available, using some repeated questions");
          }
        }

        // Format and limit to 5 questions
        const formattedQuestions = filteredQuestions.slice(0, 5).map(item => ({
          id: item.id,
          content: item.content,
          options: item.options || [],
          correct_answer: item.correct_answer,
          explanation: item.explanation,
          metadata: item.metadata || {},
          type: item.type,
          difficulty: item.difficulty || 3
        }));

        setQuestions(formattedQuestions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching practice questions:', err);
        setError(err.response?.data?.error || 'Failed to load practice questions');
        setLoading(false);
      }
    };

    fetchData();

    // Start timer
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [location.search, token, user.id]);

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
      isCorrect = fillInAnswer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase();
    } else {
      isCorrect = selectedOption === currentQuestion.correct_answer;
    }

    setSubmitted(true);
    setCorrect(isCorrect);
    
    if (isCorrect) {
      setPracticeScore(prev => prev + 1);
    }
    
    // Record response but indicate practice mode (doesn't update mastery)
    try {
      await axios.post(`/api/students/${user.id}/responses`, {
        content_item_id: currentQuestion.id,
        answer: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption,
        time_spent: timeSpent, 
        interaction_data: {
          practice_mode: true,
          selectedOption: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption
        },
        correct: isCorrect,
        practice_mode: true // Indicate this is a practice response that shouldn't update mastery
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error recording practice response:', err);
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
    navigate('/student/mastery-dashboard?refresh=true');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading Practice Quiz...</h2>
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
    return (
      <div className="quiz-completion">
        <h2>Practice Quiz Completed!</h2>
        {kcDetails && (
          <div className="kc-info">
            <h3>{kcDetails.name}</h3>
            <p>You've practiced this topic without affecting your mastery score.</p>
          </div>
        )}
        <div className="quiz-summary">
          <div className="summary-card">
            <h3>Your Practice Score</h3>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{practiceScore}</span>
                <span className="score-total">/ {questions.length}</span>
              </div>
              <div className="score-percentage">
                {((practiceScore / questions.length) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="time-display">
              <span>Time Spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          <div className="feedback-section">
            <h3>How did you do?</h3>
            {practiceScore === questions.length ? (
              <div className="perfect-score">
                <p>Perfect Score! Excellent work!</p>
              </div>
            ) : practiceScore >= questions.length * 0.8 ? (
              <div className="good-score">
                <p>Great job! You're doing well!</p>
              </div>
            ) : practiceScore >= questions.length * 0.6 ? (
              <div className="average-score">
                <p>Good effort! Keep practicing!</p>
              </div>
            ) : (
              <div className="needs-practice">
                <p>Keep practicing! You'll get better!</p>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button onClick={handleBackToDashboard} className="back-button">
              Back to Mastery Dashboard
            </button>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="practice-quiz">
      <div className="quiz-header">
        <h2>Practice Quiz {kcDetails ? `- ${kcDetails.name}` : ''}</h2>
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
        
        {currentQuestion.metadata?.imageUrl && (
          <div className="question-image">
            <img src={currentQuestion.metadata.imageUrl} alt="Question visual" />
          </div>
        )}

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

export default PracticeQuizView; 