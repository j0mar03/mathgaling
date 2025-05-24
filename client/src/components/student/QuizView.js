import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getMotivationalQuote } from './QuizEnhancer';
import './PracticeQuizView.css'; // Use PracticeQuizView styles
import './QuizCompleteEnhanced.css'; // Enhanced completion styles

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
  const [nextKcIdForContinuation, setNextKcIdForContinuation] = useState(null);
  const [strugglingKCs, setStrugglingKCs] = useState([]);
  const [quizCompletionStatus, setQuizCompletionStatus] = useState(null);
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [actualKcMastery, setActualKcMastery] = useState(0); // Track actual BKT mastery from backend
  const [showHint, setShowHint] = useState(false);
  const [hintRequests, setHintRequests] = useState(0);
  const [searchingNextTopic, setSearchingNextTopic] = useState(false); // Loading state for next topic search
  const [nextTopicSearchComplete, setNextTopicSearchComplete] = useState(false); // Track if search is done
  const [finalScoreCalculated, setFinalScoreCalculated] = useState(0); // Store final score for consistent display

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
              console.log("[KC Details Debug] Fetched KC details:", kcResponse.data);
              console.log("[KC Details Debug] curriculum_code:", kcResponse.data.curriculum_code);
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

  // Fetch completion data when quiz is completed
  useEffect(() => {
    if (quizCompleted && user?.id && token) {
      const fetchCompletionData = async () => {
        try {
          // Calculate quiz score mastery level
          const calculatedMasteryLevel = questions.length > 0 ? score / questions.length : 0;
          
          // Use actual KC mastery if available, otherwise fall back to quiz score
          // For Math Mastery quizzes, if KC mastery update fails, use quiz score if it's good
          const effectiveMastery = actualKcMastery > 0 ? actualKcMastery : calculatedMasteryLevel;
          
          // If quiz score is perfect but KC mastery seems low, trust the quiz score
          if (calculatedMasteryLevel >= 0.9 && actualKcMastery < 0.5) {
            console.log(`[Completion Effect] ⚠️ Quiz score perfect (${(calculatedMasteryLevel * 100).toFixed(1)}%) but KC mastery low (${(actualKcMastery * 100).toFixed(1)}%). Using quiz score.`);
          }
          
          // Set masteryLevel to the effective mastery for UI display
          setMasteryLevel(effectiveMastery);
          console.log(`[Completion Effect] Quiz score mastery: ${(calculatedMasteryLevel * 100).toFixed(1)}%, Actual KC mastery: ${(actualKcMastery * 100).toFixed(1)}%, Using effective mastery: ${(effectiveMastery * 100).toFixed(1)}%`);

          // Simple sequential KC progression logic for Math Mastery
          let nextKcId = null;
          
          // For mastery quizzes, we want simple sequential progression KC1 → KC2 → KC3
          // If the student has ≥75% mastery, allow progression to next KC
          const shouldFindNext = effectiveMastery >= 0.75 || finalScoreCalculated >= 0.75;
          if (shouldFindNext && !nextKcIdForContinuation) {
            setSearchingNextTopic(true);
            try {
              console.log("[Completion Effect] Full kcDetails:", kcDetails);
              const currentKcCurriculumCode = kcDetails?.curriculum_code;
              console.log(`[Completion Effect] ✅ Mastery threshold met (${(effectiveMastery * 100).toFixed(1)}% ≥ 75%). Getting next KC after: ${currentKcCurriculumCode}`);

              // Use kid-friendly endpoint for sequential progression
              const nextActivityResponse = await axios.get(`/api/students/${user.id}/kid-friendly-next-activity`, {
                headers: { Authorization: `Bearer ${token}` },
                params: currentKcCurriculumCode ? { current_kc_curriculum_code: currentKcCurriculumCode } : {}
              });

              if (nextActivityResponse.data && nextActivityResponse.data.kc_id) {
                nextKcId = nextActivityResponse.data.kc_id;
                console.log(`[Completion Effect] 🚀 Next KC in sequence: KC${nextKcId} (${nextActivityResponse.data.curriculum_code || 'unknown code'})`);
              } else if (nextActivityResponse.data && (nextActivityResponse.data.completed_sequence || nextActivityResponse.data.all_mastered)) {
                console.log(`[Completion Effect] 🎉 Sequence completed! All KCs mastered for this grade level.`);
                nextKcId = null;
              } else {
                console.log(`[Completion Effect] ⚠️ No next KC found in response:`, nextActivityResponse.data);
              }
            } catch (err) {
              console.warn("[Completion Effect] Error fetching next KC in sequence:", err.message);
              
              // Fallback: try to get next KC from grade-level KCs
              try {
                const response = await axios.get(`/api/students/${user.id}/grade-knowledge-components?_t=${Date.now()}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data && Array.isArray(response.data)) {
                  const sortedKCs = response.data.sort((a, b) => {
                    if (a.curriculum_code && b.curriculum_code) {
                      return a.curriculum_code.localeCompare(b.curriculum_code);
                    }
                    return 0;
                  });
                  
                  const currentKcId = questions[0]?.knowledge_component?.id || kcDetails?.id;
                  const currentIndex = sortedKCs.findIndex(kc => kc.id === currentKcId);
                  
                  if (currentIndex !== -1 && currentIndex < sortedKCs.length - 1) {
                    const nextKC = sortedKCs[currentIndex + 1];
                    nextKcId = nextKC.id;
                    console.log(`[Completion Effect] 🔄 Fallback found next topic: ${nextKC.name} (ID: ${nextKC.id})`);
                  }
                }
              } catch (fallbackErr) {
                console.error('[Completion Effect] Fallback also failed:', fallbackErr);
              }
            }
            
            setSearchingNextTopic(false);
            setNextTopicSearchComplete(true);
          } else {
            console.log(`[Completion Effect] ❌ Mastery ${(effectiveMastery * 100).toFixed(1)}% < 75%. Retry current KC instead of advancing.`);
            setNextTopicSearchComplete(true);
          }
          
          setNextKcIdForContinuation(nextKcId);

          // Fetch struggling KCs if effective mastery is below 80%
          if (effectiveMastery < 0.8) {
            try {
              console.log("[Completion Effect] Fetching struggling KCs...");
              const response = await axios.get(`/api/students/${user.id}/struggling-kcs`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setStrugglingKCs(response.data || []);
            } catch (error) {
              console.error("[Completion Effect] Error fetching struggling KCs:", error);
              setStrugglingKCs([]);
            }
          } else {
            setStrugglingKCs([]);
          }

          // Set completion status using effective mastery
          setQuizCompletionStatus({
            status: 'completed',
            message: 'Quiz completed! Great job!',
            masteryAchieved: effectiveMastery >= 0.75,
            currentMastery: effectiveMastery,
            masteryThreshold: 0.75,
            showKCRecommendations: true
          });

        } catch (error) {
          console.error("[Completion Effect] Error fetching completion data:", error);
        }
      };

      fetchCompletionData();
    }
  }, [quizCompleted, user?.id, token, score, questions.length, kcDetails, actualKcMastery]);

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
    
    // Submit response to backend (NOT practice mode - this should update mastery)
    try {
      console.log('[QuizView] Submitting mastery quiz response for KC progress update');
      console.log('[QuizView] Question details:', {
        id: currentQuestion.id,
        kc_id: currentQuestion.knowledge_component?.id,
        kc_name: currentQuestion.knowledge_component?.name
      });
      console.log('[QuizView] Submission payload:', {
        content_item_id: currentQuestion.id,
        answer: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption,
        correct: isCorrect,
        practice_mode: false,
        time_spent: timeSpent
      });
      
      const response = await axios.post(`/api/students/${user.id}/responses`, {
        content_item_id: currentQuestion.id,
        answer: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption,
        time_spent: timeSpent, 
        interaction_data: {
          hintRequests: hintRequests,
          attempts: 1,
          selectedOption: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption
        },
        correct: isCorrect,
        practice_mode: false // Explicitly set to false to ensure mastery updates
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' // Prevent caching for Supabase
        }
      });
      
      console.log('[QuizView] Response submitted successfully:', response.data);
      console.log('[QuizView] Full response data structure:', JSON.stringify(response.data, null, 2));
      
      // Also log to a global variable for debugging
      window.__LAST_QUIZ_RESPONSE__ = {
        timestamp: new Date().toISOString(),
        request: {
          content_item_id: currentQuestion.id,
          kc_id: currentQuestion.knowledge_component?.id,
          correct: isCorrect,
          practice_mode: false
        },
        response: response.data
      };
      console.log('[QuizView] Debug info saved to window.__LAST_QUIZ_RESPONSE__');
      
      // Log if mastery was updated and track actual mastery
      if (response.data?.knowledgeState) {
        const newActualMastery = response.data.knowledgeState.p_mastery;
        console.log(`[QuizView] ✅ Knowledge state updated via knowledgeState - new mastery: ${(newActualMastery * 100).toFixed(1)}%`);
        setActualKcMastery(newActualMastery);
      } else if (response.data?.newMastery !== null && response.data?.newMastery !== undefined) {
        const newActualMastery = response.data.newMastery;
        console.log(`[QuizView] ✅ Mastery updated via newMastery - new mastery: ${(newActualMastery * 100).toFixed(1)}%`);
        setActualKcMastery(newActualMastery);
      } else {
        console.log(`[QuizView] ❌ No mastery update found in response. knowledgeState: ${response.data?.knowledgeState}, newMastery: ${response.data?.newMastery}`);
      }
      
    } catch (err) {
      console.error('Error recording response:', err);
      // Non-critical, so continue without showing error to user
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setFillInAnswer('');
      setSubmitted(false);
      setCorrect(null);
      // Reset hint state for new question
      setShowHint(false);
      setHintRequests(0);
    } else {
      // Quiz completed - check for next topic
      // Calculate final score percentage first (including current answer)
      const finalScore = (score + (correct ? 1 : 0)) / questions.length;
      setFinalScoreCalculated(finalScore); // Store for consistent use
      console.log(`[QuizView] Quiz completed with score: ${finalScore * 100}%`);
      
      setQuizCompleted(true);
      
      // Don't search for next topic here - let the useEffect handle it
      // This prevents the button from flickering
      if (false) {
        console.log('[QuizView] Student performed well, searching for next topic...');
        setSearchingNextTopic(true); // Start loading state
        
        try {
          // Get current KC ID from the first question
          const currentKcId = questions[0]?.knowledge_component?.id;
          if (currentKcId) {
            console.log('[QuizView] Current KC ID:', currentKcId);
            
            // Fetch all grade-level KCs to find the next one
            const response = await axios.get(`/api/students/${user.id}/grade-knowledge-components?_t=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && Array.isArray(response.data)) {
              // Sort by curriculum_code to get proper sequence
              const sortedKCs = response.data.sort((a, b) => {
                if (a.curriculum_code && b.curriculum_code) {
                  return a.curriculum_code.localeCompare(b.curriculum_code);
                }
                return 0;
              });
              
              console.log('[QuizView] All KCs:', sortedKCs.map(kc => `${kc.curriculum_code}: ${kc.name} (ID: ${kc.id})`));
              
              // Find current KC index and get next one
              const currentIndex = sortedKCs.findIndex(kc => kc.id === currentKcId);
              console.log('[QuizView] Current KC index:', currentIndex, 'out of', sortedKCs.length);
              
              if (currentIndex !== -1 && currentIndex < sortedKCs.length - 1) {
                const nextKC = sortedKCs[currentIndex + 1];
                console.log(`[QuizView] ✅ Found next topic: ${nextKC.name} (ID: ${nextKC.id})`);
                setNextKcIdForContinuation(nextKC.id);
              } else {
                console.log('[QuizView] ❌ No next topic found - student may have completed all topics');
                setNextKcIdForContinuation(null);
              }
            } else {
              console.log('[QuizView] ❌ No KC data received from API');
              setNextKcIdForContinuation(null);
            }
          } else {
            console.log('[QuizView] ❌ No current KC ID found');
            setNextKcIdForContinuation(null);
          }
        } catch (error) {
          console.error('[QuizView] ❌ Error finding next topic:', error);
          setNextKcIdForContinuation(null);
        } finally {
          setSearchingNextTopic(false); // End loading state
          setNextTopicSearchComplete(true); // Mark search as complete
        }
      } else {
        console.log('[QuizView] Student did not perform well enough for next topic');
        setNextTopicSearchComplete(true); // Mark search as complete (skipped)
      }
    }
  };

  const handleRequestHint = () => {
    setShowHint(true);
    setHintRequests(prev => prev + 1);
  };

  const handleBackToDashboard = async () => {
    // Small delay to ensure Supabase mastery update completes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set completion indicator for progress page refresh
    localStorage.setItem('quiz_completed', 'true');
    localStorage.setItem('quiz_mastery_update', JSON.stringify({
      kcId: kcDetails?.id || questions[0]?.knowledge_component?.id,
      newMastery: actualKcMastery || masteryLevel,
      timestamp: Date.now()
    }));
    
    // Force refresh of dashboard data by adding timestamp
    navigate('/student?refresh=' + Date.now());
  };

  const handleRetryQuiz = () => {
    // Reset all state for retry
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setFillInAnswer('');
    setSubmitted(false);
    setCorrect(null);
    setScore(0);
    setQuizCompleted(false);
    setAnsweredQuestions([]);
    setQuizCompletionStatus(null);
    setStrugglingKCs([]);
    setNextKcIdForContinuation(null);
    setTimeSpent(0);
    setSearchingNextTopic(false); // Reset loading states
    setNextTopicSearchComplete(false);
    setActualKcMastery(0); // Reset mastery tracking
    
    // Reload the current quiz
    window.location.reload();
  };

  const handleContinueToNextTopic = () => {
    if (!nextKcIdForContinuation) {
      console.warn("Cannot continue, next KC ID not available. Navigating to dashboard.");
      // Set completion indicator before navigating
      localStorage.setItem('quiz_completed', 'true');
      navigate('/student?refresh=' + Date.now());
      return;
    }
    
    // Set completion indicator for potential future returns to progress
    localStorage.setItem('quiz_completed', 'true');
    
    // Navigate to the start of the next KC's sequence
    const nextUrl = `/student/quiz?kc_id=${nextKcIdForContinuation}&mode=sequential`;
    console.log(`Continuing to next topic. Navigating to: ${nextUrl}`);
    navigate(nextUrl);
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
    // Try to get KC name from multiple sources
    const currentKcName = 
      answeredQuestions[0]?.knowledgeComponent ||
      kcDetails?.name ||
      "This Topic";

    // Calculate actual performance - use the higher of score percentage or actual mastery
    const scorePercentage = score / questions.length;
    const actualPerformance = Math.max(scorePercentage, actualKcMastery);
    
    console.log(`[QuizView] Performance calculation: Score ${score}/${questions.length} (${(scorePercentage * 100).toFixed(1)}%), Actual KC Mastery: ${(actualKcMastery * 100).toFixed(1)}%, Using: ${(actualPerformance * 100).toFixed(1)}%`);
    
    let masteryStatusText = '';
    let currentKcStatusText = '';
    let encouragingQuote = '';
    let showUnlockMessage = false;

    if (actualPerformance >= 0.9 || scorePercentage >= 0.9) {
      masteryStatusText = 'Mastered!';
      currentKcStatusText = 'Mastered! 🎉';
      encouragingQuote = getMotivationalQuote(scorePercentage, currentKcName);
      showUnlockMessage = true;
    } else if (actualPerformance >= 0.75 || scorePercentage >= 0.75) {
      masteryStatusText = 'Excellent!';
      currentKcStatusText = 'Excellent Progress! 👍';
      encouragingQuote = getMotivationalQuote(scorePercentage, currentKcName);
      showUnlockMessage = true;
    } else if (actualPerformance >= 0.5 || scorePercentage >= 0.5) {
      masteryStatusText = 'Good Progress';
      currentKcStatusText = 'Making Good Progress 😊';
      encouragingQuote = getMotivationalQuote(scorePercentage, currentKcName);
    } else {
      masteryStatusText = 'Needs Review';
      currentKcStatusText = 'Needs Review 🧐';
      encouragingQuote = getMotivationalQuote(scorePercentage, currentKcName);
    }

    return (
      <div className="quiz-completion">
        <h2>Quiz Complete!</h2>

        <div className="quiz-summary">
          <div className="summary-card">
            <h3>Your Score</h3>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{score}</span>
                <span className="score-total">/ {questions.length}</span>
              </div>
              <div className="score-percentage">
                {(scorePercentage * 100).toFixed(0)}%
              </div>
            </div>
            <div className="time-display">
              <span>Time Spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
            </div>
            <p><strong>Status:</strong> {masteryStatusText}</p>
          </div>

          <div className="feedback-section">
            <p className="score">
              📊 Progress: {currentKcName} – {currentKcStatusText}
            </p>
            {showUnlockMessage && (
              <p className="unlock-message" style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                🔓 Keep going to unlock the next topic!
              </p>
            )}
          </div>

          <div className="action-buttons">
            {/* Fixed button layout with clear separation */}
            <div className="primary-actions" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              {/* Continue to Next Topic Button (if available) */}
              {(() => {
                const performedWell = (actualPerformance >= 0.75 || scorePercentage >= 0.75);
                
                console.log(`[QuizComplete] Button logic - performedWell: ${performedWell}, searchingNextTopic: ${searchingNextTopic}, nextTopicSearchComplete: ${nextTopicSearchComplete}, nextKcIdForContinuation: ${nextKcIdForContinuation}`);
                
                // Show loading state while searching
                if (performedWell && searchingNextTopic) {
                  return (
                    <div className="loading-container" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                      borderRadius: '15px',
                      color: 'white',
                      minWidth: '250px'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        border: '3px solid rgba(255,255,255,0.3)',
                        borderTop: '3px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '0.5rem'
                      }}></div>
                      <span>🔍 Finding Next Topic...</span>
                    </div>
                  );
                }
                
                // Show continue button if next topic is found
                if (performedWell && nextTopicSearchComplete && nextKcIdForContinuation) {
                  return (
                    <button 
                      onClick={handleContinueToNextTopic} 
                      className="continue-to-next-button"
                      style={{
                        background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        borderRadius: '25px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: '250px',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(39, 174, 96, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(39, 174, 96, 0.3)';
                      }}
                    >
                      🚀 Continue to Next Topic!
                    </button>
                  );
                }
                
                return null; // No continue button if conditions not met
              })()}
              
              {/* Retry Quiz Button (separate from continue button) */}
              {(() => {
                const scorePercentage = score / questions.length;
                const showRetry = scorePercentage < 0.8; // Show retry for scores below 80%
                
                if (showRetry) {
                  return (
                    <button 
                      onClick={handleRetryQuiz} 
                      className="retry-quiz-button"
                      style={{
                        background: 'linear-gradient(135deg, #3498db, #5dade2)',
                        color: 'white',
                        border: 'none',
                        padding: '0.8rem 1.8rem',
                        borderRadius: '20px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: '200px',
                        justifyContent: 'center',
                        boxShadow: '0 3px 10px rgba(52, 152, 219, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 5px 15px rgba(52, 152, 219, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 3px 10px rgba(52, 152, 219, 0.3)';
                      }}
                    >
                      🔁 Try Again
                    </button>
                  );
                }
                
                return null; // No retry button for high scores
              })()}
            </div>
            
            {/* Navigation buttons */}
            <div className="navigation-buttons" style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={handleBackToDashboard} 
                className="nav-button"
                style={{
                  background: 'linear-gradient(135deg, #6c757d, #8b939d)',
                  color: 'white',
                  border: 'none',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '20px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🏠 Back to Dashboard
              </button>
              <button 
                onClick={async () => {
                  // Ensure mastery updates are saved
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  localStorage.setItem('quiz_completed', 'true');
                  localStorage.setItem('quiz_mastery_update', JSON.stringify({
                    kcId: kcDetails?.id || questions[0]?.knowledge_component?.id,
                    newMastery: actualKcMastery || masteryLevel,
                    timestamp: Date.now()
                  }));
                  window.location.href = '/student/progress?refresh=' + Date.now();
                }}
                className="nav-button"
                style={{
                  background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
                  color: 'white',
                  border: 'none',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '20px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📊 View Progress
              </button>
            </div>
          </div>

          <p className="encouragement-quote" style={{ fontStyle: 'italic', margin: '1rem 0', color: '#7f8c8d' }}>
            💬 "{encouragingQuote}"
          </p>

          {/* Show struggling KCs if any */}
          {strugglingKCs.length > 0 && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '8px', 
              padding: '1rem', 
              margin: '1rem 0' 
            }}>
              <h4 style={{ color: '#856404', margin: '0 0 0.5rem 0' }}>📚 Recommended Practice Topics:</h4>
              <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                {strugglingKCs.slice(0, 3).map((kc, index) => (
                  <li key={index} style={{ color: '#856404', marginBottom: '0.25rem' }}>
                    {kc.name} (Mastery: {(kc.current_mastery * 100).toFixed(0)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                {answeredQuestions.length === 0 && <p>No question details available for this quiz.</p>}
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
        <h2>Math Mastery Quiz</h2>
        
        {/* Knowledge Component Information */}
        {(currentQuestion.knowledge_component || kcDetails) && (
          <div className="kc-info" style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '10px',
            margin: '1rem 0',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#2c3e50', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
              📚 Topic: {currentQuestion.knowledge_component?.name || kcDetails?.name}
            </h3>
            {(currentQuestion.knowledge_component?.curriculum_code || kcDetails?.curriculum_code) && (
              <span style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                Code: {currentQuestion.knowledge_component?.curriculum_code || kcDetails?.curriculum_code}
              </span>
            )}
            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
              🎯 Mastery assessment to improve your understanding of this topic
            </div>
          </div>
        )}
        
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

        {showHint && currentQuestion.explanation && (
          <div className="hint-container" style={{
            backgroundColor: '#e8f4fd',
            border: '1px solid #bee5eb',
            borderRadius: '8px',
            padding: '1rem',
            margin: '1rem 0'
          }}>
            <h4 style={{ color: '#0c5460', margin: '0 0 0.5rem 0' }}>💡 Hint:</h4>
            <p style={{ color: '#0c5460', margin: '0' }}>{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="quiz-actions">
          {!submitted ? (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="submit-button" 
                onClick={handleSubmit}
                disabled={currentQuestion.type === 'fill_in_blank' 
                  ? !fillInAnswer.trim() 
                  : selectedOption === null}
              >
                Submit Answer
              </button>
              {currentQuestion.explanation && !showHint && (
                <button 
                  className="hint-button"
                  onClick={handleRequestHint}
                  style={{
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  💡 Get Hint
                </button>
              )}
            </div>
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