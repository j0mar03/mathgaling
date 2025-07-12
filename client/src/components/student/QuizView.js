import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getMotivationalQuote } from './QuizEnhancer';
import { 
  playCorrectSound, 
  playCelebrationSound, 
  playIncorrectSound, 
  isSoundEnabled, 
  setSoundEnabled 
} from '../../utils/soundUtils';
import './PracticeQuizView.css'; // Use PracticeQuizView styles
import './QuizView.css'; // Enhanced QuizView styles
import './QuizCompleteEnhanced.css'; // Enhanced completion styles
import './SoundControls.css'; // Sound controls styling

const QuizView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();

  // KC to Module mapping for practice recommendations
  const kcToModuleMapping = {
    // Module 1: Numbers & Meaning (KC1-KC3)
    1: { module: 1, title: "Module 1: Numbers & Meaning" },
    2: { module: 1, title: "Module 1: Numbers & Meaning" },
    3: { module: 1, title: "Module 1: Numbers & Meaning" },
    // Module 2: Comparing & Ordering (KC4-KC6)
    4: { module: 2, title: "Module 2: Comparing & Ordering" },
    5: { module: 2, title: "Module 2: Comparing & Ordering" },
    6: { module: 2, title: "Module 2: Comparing & Ordering" },
    // Module 3: Ordinals & Money (KC7-KC8)
    7: { module: 3, title: "Module 3: Ordinals & Money" },
    8: { module: 3, title: "Module 3: Ordinals & Money" },
    // Add more mappings as modules expand
  };
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
  const [showTopicInfo, setShowTopicInfo] = useState(false); // Toggle for topic information visibility - default hide
  const [soundsEnabled, setSoundsEnabled] = useState(isSoundEnabled()); // Sound toggle state
  const [colorTheme, setColorTheme] = useState('orange-theme'); // Color theme state - matches student dashboard

  // Helper function to get recommended modules from struggling KCs
  const getRecommendedModules = useCallback(() => {
    const recommendedModules = new Map();
    
    strugglingKCs.forEach(kc => {
      const moduleInfo = kcToModuleMapping[kc.id];
      if (moduleInfo) {
        if (!recommendedModules.has(moduleInfo.module)) {
          recommendedModules.set(moduleInfo.module, {
            moduleNumber: moduleInfo.module,
            title: moduleInfo.title,
            kcs: []
          });
        }
        recommendedModules.get(moduleInfo.module).kcs.push({
          id: kc.id,
          name: kc.name,
          mastery: kc.current_mastery
        });
      }
    });
    
    return Array.from(recommendedModules.values());
  }, [strugglingKCs, kcToModuleMapping]);

  // Load saved color theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('student-color-theme');
    if (savedTheme) {
      setColorTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Reset state when location changes (new quiz)
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setFillInAnswer('');
    setSubmitted(false);
    setCorrect(null);
    setQuizCompleted(false);
    setScore(0);
    setAnsweredQuestions([]);
    setNextKcIdForContinuation(null);
    setSearchingNextTopic(false);
    setNextTopicSearchComplete(false);
    setActualKcMastery(0);
    setTimeSpent(0);
    
    const queryParams = new URLSearchParams(location.search);
    const kcId = queryParams.get('kc_id');
    const mode = queryParams.get('mode');
    const practiceMode = queryParams.get('practice_mode') === 'true';

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

        } else if (mode === 'challenge') {
          // Challenge mode - get difficulty-based questions from random KCs
          const response = await axios.get(`/api/students/${user.id}/challenge-quiz?limit=8`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          questionsData = response.data || [];
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
          // For Math Tagumpay quizzes, if KC mastery update fails, use quiz score if it's good
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
          
          console.log(`[Completion Effect] Should find next? ${shouldFindNext}, Current nextKcId: ${nextKcIdForContinuation}`);
          
          if (shouldFindNext) {
            if (!nextKcIdForContinuation) {
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
            setNextKcIdForContinuation(nextKcId);
            } else {
              // Already have a next KC ID, just mark as complete
              console.log(`[Completion Effect] ✅ Already have next KC ID: ${nextKcIdForContinuation}`);
              setNextTopicSearchComplete(true);
            }
          } else {
            console.log(`[Completion Effect] ❌ Mastery/Score too low for progression. Effective mastery: ${(effectiveMastery * 100).toFixed(1)}%, Score: ${(finalScoreCalculated * 100).toFixed(1)}%`);
            setNextTopicSearchComplete(true);
            setNextKcIdForContinuation(null);
          }

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
    
    // Play appropriate sound with a small delay based on answer correctness
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + 1);
        playCorrectSound(0.5);
      } else {
        // Play incorrect answer sound at a lower volume
        playIncorrectSound(0.3);
      }
    }, 300);

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
      const queryParams = new URLSearchParams(location.search);
      const mode = queryParams.get('mode');
      const practiceMode = queryParams.get('practice_mode') === 'true';
      
      // For challenge mode, we want independent progress tracking
      const isChallenge = mode === 'challenge';
      const shouldUpdateMastery = !practiceMode && !isChallenge; // Only update mastery for regular sequential quizzes
      
      console.log(`[QuizView] Submitting response - Mode: ${mode}, Practice: ${practiceMode}, Challenge: ${isChallenge}, Update Mastery: ${shouldUpdateMastery}`);
      console.log('[QuizView] Question details:', {
        id: currentQuestion.id,
        kc_id: currentQuestion.knowledge_component?.id,
        kc_name: currentQuestion.knowledge_component?.name
      });
      
      const response = await axios.post(`/api/students/${user.id}/responses`, {
        content_item_id: currentQuestion.id,
        answer: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption,
        time_spent: timeSpent, 
        interaction_data: {
          hintRequests: hintRequests,
          attempts: 1,
          selectedOption: currentQuestion.type === 'fill_in_blank' ? fillInAnswer : selectedOption,
          quiz_mode: mode // Track what type of quiz this was
        },
        correct: isCorrect,
        practice_mode: !shouldUpdateMastery // Set practice mode for challenge quizzes to prevent KC mastery updates
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
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
      
      // Play celebration sound if score is good (over 75%)
      const scorePercentage = finalScore * 100;
      if (scorePercentage >= 75) {
        playCelebrationSound(0.6);
      }
      
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
  
  const toggleSounds = () => {
    setSoundsEnabled(!soundsEnabled);
    setSoundEnabled(!soundsEnabled);
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

  const handleContinueToNextTopic = async () => {
    if (!nextKcIdForContinuation) {
      console.warn("Cannot continue, next KC ID not available. Navigating to dashboard.");
      // Set completion indicator before navigating
      localStorage.setItem('quiz_completed', 'true');
      navigate('/student?refresh=' + Date.now());
      return;
    }
    
    // Set completion indicator and mastery update for current topic
    localStorage.setItem('quiz_completed', 'true');
    localStorage.setItem('quiz_mastery_update', JSON.stringify({
      kcId: kcDetails?.id || questions[0]?.knowledge_component?.id,
      newMastery: actualKcMastery || masteryLevel,
      timestamp: Date.now()
    }));
    
    // Set progression indicator to track that student moved to next topic
    localStorage.setItem('student_progressed_to_next_topic', JSON.stringify({
      completedKcId: kcDetails?.id || questions[0]?.knowledge_component?.id,
      nextKcId: nextKcIdForContinuation,
      timestamp: Date.now(),
      masteryAchieved: (actualKcMastery || masteryLevel) >= 0.75
    }));
    
    console.log(`[QuizView] Student progressing from KC ${kcDetails?.id} to KC ${nextKcIdForContinuation}`);
    console.log(`[QuizView] Current KC details:`, kcDetails);
    console.log(`[QuizView] Mastery achieved: ${((actualKcMastery || masteryLevel) * 100).toFixed(1)}%`);
    
    // Small delay to ensure all data is saved
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Navigate to the quiz with the next KC ID
    const nextUrl = `/student/quiz?kc_id=${nextKcIdForContinuation}&mode=sequential`;
    console.log(`Continuing to next topic. Navigating to: ${nextUrl}`);
    
    // Force a page reload to ensure clean state for the new quiz
    window.location.href = nextUrl;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading Math Tagumpay Quiz...</h2>
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
      <div className={`enhanced-quiz ${colorTheme}`}>
        <div className="quiz-completion enhanced-completion">
          <div className="completion-header">
            <h2>🎉 Quiz Complete!</h2>
            <div className="completion-badge">
              <span className="badge-icon">✨</span>
              <span className="badge-text">Well Done!</span>
            </div>
          </div>

          <div className="quiz-summary enhanced-summary">
            <div className="summary-card enhanced-summary-card">
              <h3>Your Performance</h3>
              <div className="score-display enhanced-score-display">
                <div className="score-circle enhanced-score-circle">
                  <div className="score-inner">
                    <span className="score-number">{score}</span>
                    <span className="score-total">/ {questions.length}</span>
                  </div>
                  <div className="score-ring">
                    <svg className="progress-ring" width="140" height="140">
                      <circle
                        className="progress-ring-background"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                        fill="transparent"
                        r="60"
                        cx="70"
                        cy="70"
                      />
                      <circle
                        className="progress-ring-progress"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        fill="transparent"
                        r="60"
                        cx="70"
                        cy="70"
                        strokeDasharray={`${2 * Math.PI * 60}`}
                        strokeDashoffset={`${2 * Math.PI * 60 * (1 - scorePercentage)}`}
                        transform="rotate(-90 70 70)"
                      />
                    </svg>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#56ab2f" />
                        <stop offset="100%" stopColor="#a8e6cf" />
                      </linearGradient>
                    </defs>
                  </div>
                </div>
                <div className="score-details">
                  <div className="score-percentage enhanced-percentage">
                    {(scorePercentage * 100).toFixed(0)}%
                  </div>
                  <div className="score-status">{masteryStatusText}</div>
                </div>
              </div>
              <div className="metrics-row">
                <div className="metric-item">
                  <span className="metric-icon">⏱️</span>
                  <span className="metric-label">Time</span>
                  <span className="metric-value">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-icon">🎯</span>
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">{(scorePercentage * 100).toFixed(0)}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-icon">📊</span>
                  <span className="metric-label">Status</span>
                  <span className="metric-value">{masteryStatusText}</span>
                </div>
              </div>
            </div>

          <div className="feedback-section enhanced-feedback">
            <div className="topic-progress">
              <span className="topic-icon">📚</span>
              <div className="topic-details">
                <h4>{currentKcName}</h4>
                <div className="progress-status">
                  <span className="status-text">{currentKcStatusText}</span>
                  {showUnlockMessage && (
                    <div className="unlock-message">
                      <span className="unlock-icon">🔓</span>
                      <span>Keep going to unlock the next topic!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="action-buttons enhanced-actions">
            {/* Enhanced button layout */}
            <div className="primary-actions enhanced-primary-actions">
              {/* Continue to Next Topic Button (if available) */}
              {(() => {
                const performedWell = (actualPerformance >= 0.75 || scorePercentage >= 0.75);
                
                console.log(`[QuizComplete] Button logic - performedWell: ${performedWell}, searchingNextTopic: ${searchingNextTopic}, nextTopicSearchComplete: ${nextTopicSearchComplete}, nextKcIdForContinuation: ${nextKcIdForContinuation}`);
                
                // Show loading state while searching
                if (performedWell && searchingNextTopic) {
                  return (
                    <div className="loading-next-topic">
                      <div className="loading-spinner"></div>
                      <span>🔍 Finding Next Topic...</span>
                    </div>
                  );
                }
                
                // Show continue button if next topic is found
                if (performedWell && nextTopicSearchComplete && nextKcIdForContinuation) {
                  return (
                    <button 
                      onClick={handleContinueToNextTopic} 
                      className="continue-to-next-button enhanced-continue-btn"
                    >
                      <span className="btn-icon">🚀</span>
                      <span>Continue to Next Topic!</span>
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
                      className="retry-quiz-button enhanced-retry-btn"
                    >
                      <span className="btn-icon">🔁</span>
                      <span>Try Again</span>
                    </button>
                  );
                }
                
                return null; // No retry button for high scores
              })()}
            </div>
            
            {/* Navigation buttons */}
            <div className="navigation-buttons enhanced-nav-buttons">
              <button 
                onClick={handleBackToDashboard} 
                className="nav-button enhanced-nav-btn home-btn"
              >
                <span className="btn-icon">🏠</span>
                <span>Back to Dashboard</span>
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
                className="nav-button enhanced-nav-btn progress-btn"
              >
                <span className="btn-icon">📊</span>
                <span>View Progress</span>
              </button>
              <button
                onClick={toggleSounds}
                className={`nav-button sound-toggle-btn ${soundsEnabled ? 'sound-on' : 'sound-off'}`}
              >
                <span className="btn-icon">{soundsEnabled ? '🔊' : '🔇'}</span>
                <span>{soundsEnabled ? 'Sounds On' : 'Sounds Off'}</span>
              </button>
            </div>
          </div>

          <div className="encouragement-section">
            <div className="quote-container">
              <span className="quote-icon">💬</span>
              <p className="encouragement-quote">"{encouragingQuote}"</p>
            </div>
          </div>

          {/* Show struggling KCs and recommended modules */}
          {strugglingKCs.length > 0 && (
            <div className="struggling-kcs-section">
              <h4>📚 Recommended Practice Topics:</h4>
              <div className="recommendations-list">
                {strugglingKCs.slice(0, 3).map((kc, index) => (
                  <div key={index} className="recommendation-item">
                    <span className="rec-name">{kc.name}</span>
                    <span className="rec-mastery">Mastery: {(kc.current_mastery * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              
              {/* Module Practice Buttons */}
              {getRecommendedModules().length > 0 && (
                <div className="module-practice-section">
                  <h5>🎯 Practice with Interactive Modules:</h5>
                  <div className="module-buttons-container">
                    {getRecommendedModules().map((moduleInfo, index) => (
                      <div key={index} className="module-practice-card">
                        <div className="module-info">
                          <h6>{moduleInfo.title}</h6>
                          <div className="module-kcs">
                            <small>
                              Topics needing practice: {moduleInfo.kcs.map(kc => kc.name).join(', ')}
                            </small>
                          </div>
                          <div className="avg-mastery">
                            <small>
                              Average mastery: {(moduleInfo.kcs.reduce((sum, kc) => sum + kc.mastery, 0) / moduleInfo.kcs.length * 100).toFixed(0)}%
                            </small>
                          </div>
                        </div>
                        <button 
                          onClick={() => navigate(`/student/module/${moduleInfo.moduleNumber}`)}
                          className="module-practice-button"
                        >
                          <span className="btn-icon">📖</span>
                          <span>Practice Module {moduleInfo.moduleNumber}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Question breakdown */}
          {answeredQuestions.length > 0 && (
            <details className="question-breakdown">
              <summary className="breakdown-toggle">
                <span className="toggle-icon">📋</span>
                <span>Show Question Breakdown</span>
              </summary>
              <div className="breakdown-content">
                {answeredQuestions.map((item, index) => (
                  <div key={index} className={`breakdown-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
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
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className={`practice-quiz enhanced-quiz ${colorTheme}`}>
      
      <div className="quiz-header">
        <div className="quiz-header-main">
          <h2>Math Tagumpay Quiz</h2>
          
          <div className="header-controls" style={{ display: "flex", gap: "10px" }}>
            {/* Sound Toggle Button */}
            <button
              className={`sound-toggle-btn ${soundsEnabled ? 'sound-on' : 'sound-off'}`}
              onClick={toggleSounds}
              title={soundsEnabled ? "Turn off sounds" : "Turn on sounds"}
            >
              <span className="btn-icon">{soundsEnabled ? '🔊' : '🔇'}</span>
              <span>{soundsEnabled ? 'Sound On' : 'Sound Off'}</span>
            </button>
            
            {/* Toggle Button for Topic Information */}
            {(currentQuestion.knowledge_component || kcDetails) && (
              <button 
                className="topic-toggle-btn"
                onClick={() => setShowTopicInfo(!showTopicInfo)}
                title={showTopicInfo ? "Hide topic information" : "Show topic information"}
              >
                {showTopicInfo ? '👁️ Hide Topic' : '👁️‍🗨️ Show Topic'}
              </button>
            )}
          </div>
        </div>
        
        {/* Knowledge Component Information */}
        {showTopicInfo && (currentQuestion.knowledge_component || kcDetails) && (
          <div className="kc-info enhanced-kc-info">
            <h3>
              📚 Topic: {currentQuestion.knowledge_component?.name || kcDetails?.name}
            </h3>
            {(currentQuestion.knowledge_component?.curriculum_code || kcDetails?.curriculum_code) && (
              <span className="kc-code">
                Code: {currentQuestion.knowledge_component?.curriculum_code || kcDetails?.curriculum_code}
              </span>
            )}
            <div className="kc-description">
              🎯 Mastery assessment to improve your understanding of this topic
            </div>
          </div>
        )}
        
        <div className="quiz-progress">
          <span className="progress-text">Question {currentQuestionIndex + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
          </div>
        </div>
        {currentQuestion.difficulty && (
          <div className="question-difficulty">
            <span className="difficulty-stars">
              {'⭐'.repeat(currentQuestion.difficulty)}
            </span>
            <span className="difficulty-text">Difficulty: {currentQuestion.difficulty}/5</span>
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

export default React.memo(QuizView);