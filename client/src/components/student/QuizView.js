import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './QuizView.css'; // Import CSS file

// Add keyframe animation for the continue button
const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(76,175,80,0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }
}
`;
document.head.appendChild(styleSheet);

const QuizView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isSequentialMode = queryParams.get('mode') === 'sequential';
  const startFromKC = queryParams.get('start') === '1';
  const [sequentialIds, setSequentialIds] = useState([]);
  const [currentSequentialIndex, setCurrentSequentialIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]); // To store item-by-item results
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizCompletionStatus, setQuizCompletionStatus] = useState(null);
  const [quizSummary, setQuizSummary] = useState({
    totalQuestions: 8, // Fixed at 8 questions
    correctAnswers: 0,
    averageMastery: 0,
    completedTime: null,
    message: '',
    nextAction: ''
  });
  const [strugglingKCs, setStrugglingKCs] = useState([]);
  const [nextTopicKcId, setNextTopicKcId] = useState(null); // Original state, maybe keep for other uses?
  const [nextKcIdForContinuation, setNextKcIdForContinuation] = useState(null); // State for the continue button
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [hintRequests, setHintRequests] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [nextContentItemId, setNextContentItemId] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const totalQuestions = 8; // Fixed constant value of 8 questions
  const [studentName, setStudentName] = useState(''); // State for student's name
  const { user, token } = useAuth();
  
  // Use the authenticated user's ID
  const studentId = user?.id;
  
  // Add state to track navigation and URL
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastQuizId, setLastQuizId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigationTimeoutRef = useRef(null);
  
  // Add state to track loading status
  const [isLoadingSequentialIds, setIsLoadingSequentialIds] = useState(false);
  const [hasLoadedSequentialIds, setHasLoadedSequentialIds] = useState(false);

  // Add debug state
  const [debugInfo, setDebugInfo] = useState({
    lastAction: '',
    navigationAttempted: false,
    currentState: {}
  });

  useEffect(() => {
    // Check if we have parameters in the URL to maintain count across navigations
    const qNumParam = parseInt(queryParams.get('qnum'), 10);
    const correctParam = parseInt(queryParams.get('correct'), 10);
    
    const isNewQuizStart = isNaN(qNumParam) || qNumParam <= 1;

    if (!isNewQuizStart) {
      console.log(`Using question number from URL: ${qNumParam}`);
      setQuestionNumber(qNumParam);
      // If not the first question, we assume answeredQuestions is already populated
    } else {
      console.log('No question number in URL or it is the first question, resetting quiz state.');
      setQuestionNumber(1);
      setAnsweredQuestions([]); // Reset answered questions for a new quiz session
      setCorrectAnswersCount(0); // Reset correct answers count
    }

    // Only set correctAnswersCount from URL if qNumParam is also present and > 1
    // This prevents overriding correctAnswersCount if we are starting a new quiz (qNum=1 or no qNum)
    if (!isNewQuizStart && !isNaN(correctParam) && correctParam >= 0) {
      console.log(`Using correct answers count from URL: ${correctParam} for question ${qNumParam}`);
      setCorrectAnswersCount(correctParam); // Restore count from URL if continuing quiz
    } else if (isNewQuizStart) {
       // Ensure count is 0 if starting new quiz, unless already set above
       if (correctAnswersCount !== 0) setCorrectAnswersCount(0);
    }
    
    setQuizCompleted(false);
    
    // Load the sequence of IDs for sequential mode
    const loadSequentialIds = async (currentKcId) => {
      if (isLoadingSequentialIds || hasLoadedSequentialIds || !token) {
        console.log('[QuizView] Skipping sequential IDs load - already loading, loaded, or no token.');
        return;
      }

      console.log(`[QuizView] Attempting to load sequential IDs. Requested KC ID: ${currentKcId}`);
      setIsLoadingSequentialIds(true);
      setError(null); // Clear previous errors

      try {
        let apiUrl = `/api/students/kcs/sequence?limit=8`;
        if (currentKcId) {
          apiUrl += `&kc_id=${currentKcId}`;
        }
        console.log(`[QuizView] Calling API: ${apiUrl}`); // Log the exact URL

        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[QuizView] API Response:', response);
        console.log('[QuizView] Response data:', response.data);
        console.log('[QuizView] Response data type:', typeof response.data);
        const fetchedSequence = response.data;

        if (!Array.isArray(fetchedSequence) || fetchedSequence.length === 0) {
          const errorMsg = currentKcId 
            ? `No quiz questions found for the selected topic (ID: ${currentKcId}). Please try another topic or check back later.`
            : "No quiz content available at the moment. Please try again later.";
          setError(errorMsg);
          setSequentialIds([]); // Ensure sequentialIds is empty on error
          setHasLoadedSequentialIds(true); // Mark as loaded to prevent retries if it's a content issue
          setIsLoadingSequentialIds(false);
          return;
        }

        console.log("[loadSequentialIds] Fetched sequential sequence:", fetchedSequence);
        setSequentialIds(fetchedSequence);
        setHasLoadedSequentialIds(true);
        // totalQuestions is already fixed at 8, QuizSummary also defaults to 8.
        // The display will use sequentialIds.length for "X of Y" in sequential mode.

        // Navigate to the first question in the sequence if current ID is not part of it or no ID yet
        // This ensures that if a user lands on /student/quiz?mode=sequential (no ID), it loads the first question.
        // Or if they land with a kc_id, it loads the first question of *that* KC's sequence.
        if (fetchedSequence.length > 0) {
            console.log('[QuizView] fetchedSequence[0]:', fetchedSequence[0]);
            const firstQuestionIdInSequence = fetchedSequence[0].id;
            console.log('[QuizView] First question ID:', firstQuestionIdInSequence);
            console.log('[QuizView] Current id from params:', id);
            console.log('[QuizView] Current kc_id from query:', queryParams.get('kc_id'));
            
            // Only navigate if the current 'id' (from URL params) is not already the first in sequence
            // or if 'id' is not present (e.g. initial load via kc_id or just mode=sequential)
            // Also, if currentKcId is provided and differs from the one in queryParams, it means we are starting a new KC sequence.
            if (id !== firstQuestionIdInSequence.toString() || !id || (currentKcId && queryParams.get('kc_id') !== currentKcId)) {
                 const navigateUrl = currentKcId 
                                   ? `/student/quiz/${firstQuestionIdInSequence}?kc_id=${currentKcId}&mode=sequential&qnum=1&correct=0`
                                   : `/student/quiz/${firstQuestionIdInSequence}?mode=sequential&qnum=1&correct=0`;
                 console.log(`[QuizView] Navigating to first question in sequence: ${firstQuestionIdInSequence} for KC ID: ${currentKcId}. URL: ${navigateUrl}`);
                 // Ensure navigation doesn't get stuck if the current ID is already the first one.
                 // This can happen if the component re-renders but id is already correct.
                 // The `replace: true` helps manage history.
                 navigate(navigateUrl, { replace: true });
            } else {
                 console.log(`[QuizView] Already on the first question of the sequence (${id}) for KC ID (${queryParams.get('kc_id')}), no navigation needed from loadSequentialIds.`);
                 // If already on the correct ID, ensure content is loaded for it.
                 // This might be handled by the loadSequentialQuiz effect.
            }
        } else {
            console.log('[QuizView] No questions in fetchedSequence');
        }
      } catch (error) {
        console.error("Error loading sequential IDs:", error);
        // Log the detailed error object
        console.error("Axios error details:", {
            message: error.message,
            responseStatus: error.response?.status,
            responseData: error.response?.data,
            requestUrl: error.config?.url
        });
        // Use the specific error message from the backend if available, otherwise provide a helpful generic message
        const specificError = error.response?.data?.error;
        const errorMsg = specificError
                       ? `Error: ${specificError}`
                       : `Could not load quiz content (Status: ${error.response?.status || 'Unknown'}). Please check if questions exist for this topic or try again later.`;
        setError(errorMsg); // Set the specific error message
        setSequentialIds([]);
        setHasLoadedSequentialIds(true); // Mark as loaded to prevent retries if it's a content issue
      } finally {
        console.log('[QuizView] Setting isLoadingSequentialIds to false');
        setIsLoadingSequentialIds(false);
      }
    };
    
    if (isSequentialMode && !hasLoadedSequentialIds && !isLoadingSequentialIds) {
      const kcIdFromQuery = queryParams.get('kc_id');
      console.log('[QuizView] Triggering loadSequentialIds with KC ID:', kcIdFromQuery);
      loadSequentialIds(kcIdFromQuery);
    } else if (isSequentialMode && !id && hasLoadedSequentialIds && sequentialIds.length === 0) {
      // If we've loaded but found no questions, set loading to false
      console.log('[QuizView] No sequential IDs found, setting loading to false');
      setLoading(false);
    }
  }, [isSequentialMode, id, token, studentId, hasLoadedSequentialIds, isLoadingSequentialIds, location.search, navigate, sequentialIds.length]); // Added location.search and navigate

  // Fetch student name
  useEffect(() => {
    const fetchStudentName = async () => {
      if (studentId && token) {
        try {
          const response = await axios.get(`/api/students/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data && response.data.name) {
            setStudentName(response.data.name);
          }
        } catch (err) {
          console.error("Failed to fetch student name:", err);
          // Handle error appropriately, maybe set a default name or show an error
        }
      }
    };
    fetchStudentName();
  }, [studentId, token]);

  // Add URL change prevention
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isNavigating) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [isNavigating]);

  // Modify the sequential quiz loading useEffect
  useEffect(() => {
    let isMounted = true;

    const loadSequentialQuiz = async () => {
      console.log('[QuizView] loadSequentialQuiz called with:', {
        token: !!token,
        isSequentialMode,
        studentId,
        isNavigating,
        hasLoadedSequentialIds,
        id
      });
      
      if (!token || !isSequentialMode || !studentId || isNavigating || !hasLoadedSequentialIds) {
        console.log('[QuizView] Exiting loadSequentialQuiz early, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        console.log('[QuizView] Starting sequential quiz load...');
        setLoading(true);
        setError(null);

        // If we have an ID, try to load that specific content
        if (id) {
          try {
            console.log(`[QuizView] Loading specific content for ID: ${id}`);
            const contentResponse = await axios.get(`/api/content/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!isMounted) return;

            if (contentResponse.data) {
              console.log('[QuizView] Content loaded successfully');
              setContent(contentResponse.data);
              setLastQuizId(id);
              setIsInitialLoad(false);
              setLoading(false);
              return;
            }
          } catch (contentErr) {
            console.log('[QuizView] Could not load specific content:', contentErr);
            setError('Failed to load quiz content. Please try again.');
            setLoading(false);
          }
        }
      } catch (err) {
        if (!isMounted) return;

        console.error('[QuizView] Error in sequential quiz load:', {
          error: err,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data
        });

        setError(err.response?.status === 404 
          ? 'Quiz content not found. Please try again or contact support.'
          : 'Failed to load quiz. Please try again or contact support.');
        setLoading(false);
        setIsNavigating(false);
      }
    };

    if (isSequentialMode && hasLoadedSequentialIds) {
      if (id) {
        // We have an ID, load the quiz
        loadSequentialQuiz();
      } else if (sequentialIds.length === 0) {
        // No sequential IDs and no ID, set loading to false
        console.log('[QuizView] No ID and no sequential IDs, setting loading to false');
        setLoading(false);
      }
      // If we have sequential IDs but no ID yet, navigation should happen in the other effect
    }

    return () => {
      isMounted = false;
    };
  }, [isSequentialMode, token, id, studentId, isNavigating, hasLoadedSequentialIds, sequentialIds.length]);

  // Fetch necessary data upon quiz completion (struggling KCs OR next topic ID)
  useEffect(() => {
    if (quizCompleted && studentId && token) {
      const fetchCompletionData = async () => {
        // Always try to fetch the next topic ID for the "Continue" button logic
        try {
          console.log("[Completion Effect] Fetching next topic ID...");
          let nextKcId = null;
          // 1. Try kid-friendly endpoint first
          try {
            const currentKcCurriculumCode = sequentialIds[0]?.curriculumCode;
            const params = {};
            if (currentKcCurriculumCode) {
              params.current_kc_curriculum_code = currentKcCurriculumCode;
            }
            console.log(`[Completion Effect] Fetching kid-friendly next activity. Current KC curriculum_code: ${currentKcCurriculumCode}`);

            const nextActivityResponse = await axios.get(`/api/students/${studentId}/kid-friendly-next-activity`, {
              headers: { Authorization: `Bearer ${token}` },
              params: params // Pass current_kc_curriculum_code if available
            });

            if (nextActivityResponse.data && nextActivityResponse.data.kc_id) {
              nextKcId = nextActivityResponse.data.kc_id;
              console.log(`[Completion Effect] Found next KC ID via kid-friendly: ${nextKcId} (Curriculum Code: ${nextActivityResponse.data.curriculum_code})`);
              // Optionally store nextKcCurriculumCode if needed for display or other logic
              // setNextKcCurriculumCodeForContinuation(nextActivityResponse.data.curriculum_code);
            } else if (nextActivityResponse.data && (nextActivityResponse.data.completed_sequence || nextActivityResponse.data.all_mastered)) {
              console.log(`[Completion Effect] Kid-friendly endpoint indicated sequence completion or all mastered: ${nextActivityResponse.data.message}`);
              // Handle sequence completion: no next KC ID, maybe show a special message or navigate to dashboard.
              // For now, setting nextKcId to null will prevent the "Continue" button from showing for a *new* topic.
              nextKcId = null; 
            }
          } catch (err) {
             console.warn("[Completion Effect] Error fetching kid-friendly next activity:", err.message);
          }

          // 2. If not found via kid-friendly (e.g., it returned an error, not a completion message), try recommended content endpoint as a fallback
          if (!nextKcId && !(queryParams.get('mode') === 'sequential')) { // Only fallback if not strictly in sequential mode or if kid-friendly failed
            try {
               console.log("[Completion Effect] Kid-friendly did not return a next KC, trying /recommended-content as fallback.");
               const recommendResponse = await axios.get(`/api/students/${studentId}/recommended-content`, {
                 headers: { Authorization: `Bearer ${token}` },
               });
               if (recommendResponse.data && recommendResponse.data.length > 0 && recommendResponse.data[0].kc_id) {
                 nextKcId = recommendResponse.data[0].kc_id;
                 console.log(`[Completion Effect] Found next KC ID via recommended-content: ${nextKcId}`);
               }
            } catch (err) {
               console.warn("[Completion Effect] Error fetching recommended content:", err.message);
            }
          }
          
          if (nextKcId) {
            setNextKcIdForContinuation(nextKcId);
          } else {
             console.log("[Completion Effect] No next KC ID found for continuation after all attempts.");
             setNextKcIdForContinuation(null); // Ensure it's null if none found
          }

        } catch (error) {
          console.error("[Completion Effect] Error fetching next topic ID:", error);
          setNextKcIdForContinuation(null);
        }

        // Fetch struggling KCs if needed (e.g., based on local mastery calculation)
        const actualTotalQuestions = isSequentialMode && sequentialIds.length > 0 ? sequentialIds.length : totalQuestions;
        const masteryLevel = actualTotalQuestions > 0 ? correctAnswersCount / actualTotalQuestions : 0;
        if (masteryLevel < 0.8) { // Fetch if mastery is below 80%
           try {
             console.log("[Completion Effect] Fetching struggling KCs...");
             const response = await axios.get(`/api/students/${studentId}/struggling-kcs`, {
               headers: { Authorization: `Bearer ${token}` }
             });
             setStrugglingKCs(response.data || []);
           } catch (error) {
             console.error("[Completion Effect] Error fetching struggling KCs:", error);
             setStrugglingKCs([]);
           }
        } else {
           setStrugglingKCs([]); // Clear if mastery is high
        }
      };

      fetchCompletionData();
    }
  }, [quizCompleted, studentId, token, correctAnswersCount, isSequentialMode, sequentialIds.length, totalQuestions]); // Dependencies

  const handleRetryQuiz = () => {
    // Reset state for retrying the same quiz
    setQuizCompleted(false);
    setQuizCompletionStatus(null);
    setAnsweredQuestions([]);
    setCorrectAnswersCount(0);
    setCurrentSequentialIndex(0); // Reset sequential index
    setQuestionNumber(1); // Reset question number
    setSubmitted(false);
    setSelectedOption(null);
    setCorrect(null);
    setShowHint(false);
    setFeedback(null);
    setAttempts(1);
    setTimeSpent(0); // Reset timer
    setError(null);
    setLoading(true); // Show loading while potentially re-navigating/fetching
    setHasLoadedSequentialIds(false); // Force reload of sequential IDs if needed

    // Navigate back to the first question of the current sequence/KC
    const firstQuestionId = sequentialIds.length > 0 ? sequentialIds[0].id : id; // Use first sequential ID or current ID
    const kcIdFromQuery = queryParams.get('kc_id');
    const retryUrl = kcIdFromQuery
                     ? `/student/quiz/${firstQuestionId}?kc_id=${kcIdFromQuery}&mode=sequential&qnum=1&correct=0`
                     : `/student/quiz/${firstQuestionId}?mode=sequential&qnum=1&correct=0`;

    console.log(`Retrying quiz. Navigating to: ${retryUrl}`);
    navigate(retryUrl, { replace: true });
  };

  const handleContinueToNextTopic = () => {
    if (!nextKcIdForContinuation) {
      console.warn("Cannot continue, next KC ID not available. Navigating to dashboard.");
      navigate('/student');
      return;
    }
    // Reset state for the next quiz
    setQuizCompleted(false);
    setQuizCompletionStatus(null);
    setAnsweredQuestions([]);
    setCorrectAnswersCount(0);
    setCurrentSequentialIndex(0);
    setQuestionNumber(1);
    setSubmitted(false);
    setSelectedOption(null);
    setCorrect(null);
    setShowHint(false);
    setFeedback(null);
    setAttempts(1);
    setTimeSpent(0);
    setError(null);
    setLoading(true);
    setHasLoadedSequentialIds(false); // Force reload of sequence for the new KC
    setNextKcIdForContinuation(null); // Clear the stored next ID

    // Navigate to the start of the next KC's sequence
    // Don't include start=1 to allow proper KC sequencing based on mastery
    const nextUrl = `/student/quiz?kc_id=${nextKcIdForContinuation}&mode=sequential&qnum=1&correct=0`;
    console.log(`Continuing to next topic. Navigating to: ${nextUrl}`);
    navigate(nextUrl); // Don't replace history here, it's a new topic
  };

  // Separate useEffect for content fetching
  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      console.log('[QuizView] fetchContent called with:', {
        id,
        token: !!token,
        isSequentialMode
      });
      
      if (!id || !token || isSequentialMode) {
        console.log('[QuizView] Exiting fetchContent early');
        setLoading(false);
        return;
      }

      try {
        console.log(`[QuizView] Starting to fetch content for ID: ${id}`);
        setLoading(true);
        setError(null);

        // First try to get the content directly
        const response = await axios.get(`/api/content/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!isMounted) return;

        if (!response.data) {
          console.error('[QuizView] No data received from content endpoint');
          throw new Error('No content data received');
        }

        console.log('[QuizView] Content fetched successfully:', response.data);
        
        let fetchedContent = response.data;
        
        // Parse metadata if it's a string
        if (fetchedContent.metadata && typeof fetchedContent.metadata === 'string') {
          try {
            fetchedContent.metadata = JSON.parse(fetchedContent.metadata);
          } catch (parseError) {
            console.error('[QuizView] Failed to parse metadata:', parseError);
            fetchedContent.metadata = {};
          }
        }

        // Ensure KnowledgeComponent data is properly structured
        if (fetchedContent.KnowledgeComponent) {
          console.log('[QuizView] Knowledge Component data:', fetchedContent.KnowledgeComponent);
        } else {
          console.warn('[QuizView] No Knowledge Component data in response');
        }

        setContent(fetchedContent);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;

        console.error('[QuizView] Error fetching content:', {
          error: err,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data
        });

        // If content not found, try to get it from the KC endpoint
        if (err.response?.status === 404) {
          try {
            console.log('[QuizView] Content not found, trying KC endpoint...');
            const kcResponse = await axios.get(`/api/kcs/${id}/question`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!isMounted) return;

            if (kcResponse.data) {
              console.log('[QuizView] Content found via KC endpoint:', kcResponse.data);
              setContent(kcResponse.data);
              setLoading(false);
              return;
            }
          } catch (kcErr) {
            console.error('[QuizView] Error fetching from KC endpoint:', kcErr);
          }
        }

        // If we get here, both attempts failed
        setError(err.response?.status === 404 
          ? 'Question not found. Please try again or contact support.'
          : 'Failed to load question. Please try again or contact support.');
        setLoading(false);
      }
    };

    // Reset state when ID changes
    setContent(null);
    setSelectedOption(null);
    setSubmitted(false);
    setCorrect(null);
    setShowHint(false);
    setTimeSpent(0);
    setHintRequests(0);
    setAttempts(1);
    setFeedback(null);
    setNextContentItemId(null);

    fetchContent();

    const timer = setInterval(() => {
      if (isMounted) {
        setTimeSpent(prevTime => prevTime + 1);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [id, token, isSequentialMode]);

  const handleOptionSelect = (option) => {
    if (!submitted) {
      setSelectedOption(option);
    }
  };
  
  const handleShowHint = () => {
    setShowHint(true);
    setHintRequests(prev => prev + 1);
  };
  
  // Enhanced answer validation function
  const validateAnswer = (studentAnswer, correctAnswer) => {
    console.log("validateAnswer called with:", { studentAnswer, correctAnswer });
    
    if (!studentAnswer || !correctAnswer) {
      console.log("Missing student answer or correct answer");
      return false;
    }
    
    // Convert both to strings and trim whitespace
    const studentAns = String(studentAnswer).trim().toLowerCase();
    const correctAns = String(correctAnswer).trim().toLowerCase();
    console.log("Normalized answers:", { studentAns, correctAns });
    
    // Direct match check
    if (studentAns === correctAns) {
      console.log("Direct match found!");
      return true;
    }
    
    // For numeric answers, extract just the number
    const studentNumMatch = studentAns.match(/^(-?\d+(\.\d+)?)(\s*[a-zA-Z²³°]+\d*)?$/);
    const correctNumMatch = correctAns.match(/^(-?\d+(\.\d+)?)(\s*[a-zA-Z²³°]+\d*)?$/);
    console.log("Numeric matches:", { studentNumMatch, correctNumMatch });
    
    if (studentNumMatch && correctNumMatch) {
      // Compare just the numeric part
      const numericMatch = studentNumMatch[1] === correctNumMatch[1];
      console.log("Numeric comparison:", {
        studentNumber: studentNumMatch[1],
        correctNumber: correctNumMatch[1],
        match: numericMatch
      });
      return numericMatch;
    }
    
    // Special case for negative numbers question
    if (correctAns === "-10" && (studentAns.includes("negative 10") || studentAns.includes("-10"))) {
      console.log("Special case for negative 10 matched!");
      return true;
    }
    
    // Additional checks for fill-in-the-blank questions
    console.log("Checking additional fill-in-the-blank rules");
    
    // Check for alternative spellings or formats
    const alternatives = [
      correctAns,
      correctAns.replace(/\s+/g, ''), // Remove all spaces
      correctAns.replace(/[.,;:!?]/g, ''), // Remove punctuation
      correctAns.replace(/\s+/g, '').replace(/[.,;:!?]/g, '') // Remove both spaces and punctuation
    ];
    console.log("Alternative formats:", alternatives);
    
    // Check if student answer matches any of the alternatives
    if (alternatives.includes(studentAns)) {
      console.log("Match found in alternatives!");
      return true;
    }
    
    // Check for close matches (e.g., small typos)
    if (studentAns.length > 3 && correctAns.length > 3) {
      console.log("Checking for close matches");
      
      // If the student answer is at least 80% similar to the correct answer
      if (studentAns.includes(correctAns) || correctAns.includes(studentAns)) {
        console.log("One string contains the other - match found!");
        return true;
      }
      
      // Check if removing one character from either would make them match
      if (Math.abs(studentAns.length - correctAns.length) <= 1) {
        let matchCount = 0;
        const minLength = Math.min(studentAns.length, correctAns.length);
        for (let i = 0; i < minLength; i++) {
          if (studentAns[i] === correctAns[i]) matchCount++;
        }
        
        const matchPercentage = matchCount / minLength;
        console.log(`Character match: ${matchCount}/${minLength} (${(matchPercentage * 100).toFixed(1)}%)`);
        
        // If at least 80% of characters match
        if (matchPercentage >= 0.8) {
          console.log("80% character match found!");
          return true;
        }
      }
    }
    
    console.log("No match found, returning false");
    return false;
  };

  const handleSubmit = async () => {
    if (!selectedOption || submitted || !studentId) return;
    
    setSubmitted(true);
    // Increment attempts counter when submitting an answer
    setAttempts(prevAttempts => prevAttempts + 1);
    
    // Add debug logging to see what's happening
    console.log("Student answer:", selectedOption);
    console.log("Correct answer:", content?.correct_answer);
    
    // Check if we're in practice mode (Math Challenge)
    const isPracticeMode = queryParams.get('practice_mode') === 'true';
    console.log(`Quiz is in practice mode: ${isPracticeMode}`);
    
    const isCorrect = content?.correct_answer ?
      validateAnswer(selectedOption, content.correct_answer) : false;
    
    // Log the result of validation
    console.log("validateAnswer result:", isCorrect);
    
    setCorrect(isCorrect);

    // Update local correct answer count for the summary display
    let newCorrectAnswersCount = correctAnswersCount;
    if (isCorrect) {
      newCorrectAnswersCount = correctAnswersCount + 1;
      setCorrectAnswersCount(newCorrectAnswersCount);
    }

    // Store details of the answered question
    setAnsweredQuestions(prev => [
      ...prev,
      {
        questionText: content?.content,
        studentAnswer: selectedOption,
        correctAnswer: content?.correct_answer,
        isCorrect: isCorrect,
        options: content?.options || null, // Store options for MCQs
        knowledgeComponent: content?.KnowledgeComponent?.name || 'N/A',
        questionNumber: questionNumber // Store the question number for this item
      }
    ]);
    
    try {
      if (!token) { 
          setError("Authentication token not found. Cannot submit."); 
          return; 
      }

      // Check if in practice mode - if so, don't update mastery
      if (isPracticeMode) {
        console.log("Practice mode active - not updating mastery level");
        
        // Create a simulated response with feedback but don't send to server
        const simulatedFeedback = {
          message: 'Practice mode response processed',
          responseId: Date.now(), // Just a placeholder ID
          correct: isCorrect,
          knowledgeState: {
            p_mastery: content?.knowledgeState?.p_mastery || 0.5 // Keep existing mastery level
          },
          nextContentItemId: null, // We'll handle this ourselves
          quizCompletionStatus: null, // We'll handle completion ourselves
          questionNumber: questionNumber,
          totalQuestions: 8
        };
        
        setFeedback(simulatedFeedback);
        
        // Calculate if we should show completion screen
        if (questionNumber >= 8) {
          const completionStatus = {
            status: 'practice_completed',
            message: 'Great job completing this practice challenge!',
            masteryAchieved: false, // In practice mode, we don't affect mastery
            nextAction: 'continue_practice',
            currentMastery: content?.knowledgeState?.p_mastery || 0.5,
            masteryThreshold: 0.8,
            showKCRecommendations: false
          };
          
          setQuizCompletionStatus(completionStatus);
        }
        
        // Get the next question via the recommended-content endpoint
        try {
          const recommendResponse = await axios.get(`/api/students/${studentId}/recommended-content`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (recommendResponse.data && recommendResponse.data.length > 0) {
            setNextContentItemId(recommendResponse.data[0].id);
          }
        } catch (recError) {
          console.error('Error fetching next practice question:', recError);
        }
        
        return; // Skip the normal API call
      }

      // Not in practice mode - proceed with normal API call to update mastery
      const response = await axios.post(`/api/students/${studentId}/responses`, {
        content_item_id: content?.id ? parseInt(content.id, 10) : null,
        answer: selectedOption,
        time_spent: timeSpent, 
        interaction_data: {
          hintRequests,
          attempts,
          selectedOption
        },
        correct: isCorrect 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFeedback(response.data);
      
      // Store quiz completion status if provided
      if (response.data?.quizCompletionStatus) {
        setQuizCompletionStatus(response.data.quizCompletionStatus);
      }
      
      // Log current question progress
      console.log(`Question completed. Will move to next question when Continue is clicked. (Frontend count)`);
      
      if (response.data?.nextContentItemId) {
        setNextContentItemId(response.data.nextContentItemId);
      }

    } catch (err) {
      console.error('handleSubmit: Error submitting response:', err);
      setError(err.response?.data?.error || 'Failed to submit response.'); 
      setFeedback({
        correct: isCorrect,
        knowledgeState: { p_mastery: content?.knowledgeState?.p_mastery || 0.5 }
      });
      setNextContentItemId(null); // Ensure no navigation attempt on error
    }
  }; 
  
  const handleNextQuestion = () => {
    // Capture the current count *before* potential navigation/state changes
    const currentCorrectCount = correctAnswersCount;

    // Reset submission state for the next question
    setSubmitted(false);
    setSelectedOption(null);
    setCorrect(null);
    setShowHint(false);
    setFeedback(null);
    setAttempts(1);
    // Keep timeSpent accumulating, reset happens elsewhere if needed

    if (isSequentialMode && sequentialIds.length > 0) {
      const nextIndex = currentSequentialIndex + 1;
      const nextQNum = nextIndex + 1; // Question number is index + 1

      if (nextIndex < sequentialIds.length) {
        console.log(`Navigating to next sequential question. Index: ${nextIndex}, QNum: ${nextQNum}, Correct Count: ${currentCorrectCount}`);
        setCurrentSequentialIndex(nextIndex);
        // Pass updated counts in URL
        navigate(`/student/quiz/${sequentialIds[nextIndex].id}?mode=sequential&qnum=${nextQNum}&correct=${currentCorrectCount}`, { replace: true });
      } else {
        console.log(`Quiz completed. Final Correct Count: ${currentCorrectCount}`);
        // Quiz completed
        setQuizCompleted(true);
        // Set completion status using the final correctAnswersCount state
        setQuizCompletionStatus({
          status: 'completed',
          message: 'Quiz completed! Great job!',
          // Use the state value directly here as it should be correct by the time completion is triggered
          masteryAchieved: correctAnswersCount >= Math.ceil(sequentialIds.length * 0.75),
          currentMastery: correctAnswersCount / sequentialIds.length,
          masteryThreshold: 0.75,
          showKCRecommendations: true
        });
      }
    } else {
      // Handle non-sequential mode (less likely path now, but fix anyway)
      const nextQNum = questionNumber + 1;
      if (questionNumber < totalQuestions) {
        console.log(`Navigating to next non-sequential question. QNum: ${nextQNum}, Correct Count: ${currentCorrectCount}`);
        setQuestionNumber(nextQNum); // Update question number state
        if (nextContentItemId) {
          // Pass updated counts in URL
          navigate(`/student/quiz/${nextContentItemId}?qnum=${nextQNum}&correct=${currentCorrectCount}`, { replace: true });
        } else {
            console.warn("handleNextQuestion: nextContentItemId is missing in non-sequential mode.");
            // Potentially end quiz or show error if no next item ID
             setQuizCompleted(true);
             // Set completion status using the final correctAnswersCount state
             setQuizCompletionStatus({
               status: 'completed',
               message: 'Quiz ended unexpectedly.',
               masteryAchieved: correctAnswersCount >= Math.ceil(totalQuestions * 0.75),
               currentMastery: correctAnswersCount / totalQuestions,
               masteryThreshold: 0.75,
               showKCRecommendations: true
             });
        }
      } else {
        console.log(`Quiz completed (non-sequential). Final Correct Count: ${currentCorrectCount}`);
        setQuizCompleted(true);
        // Set completion status using the final correctAnswersCount state
         setQuizCompletionStatus({
          status: 'completed',
          message: 'Quiz completed! Great job!',
          masteryAchieved: correctAnswersCount >= Math.ceil(totalQuestions * 0.75),
          currentMastery: correctAnswersCount / totalQuestions,
          masteryThreshold: 0.75,
          showKCRecommendations: true
        });
      }
    }
  };
  
  // Add effect to monitor navigation state
  useEffect(() => {
    console.log('[QuizView] Navigation state changed:', {
      isSequentialMode,
      sequentialIds,
      currentSequentialIndex,
      questionNumber,
      correctAnswersCount,
      isNavigating,
      debugInfo
    });
  }, [isSequentialMode, sequentialIds, currentSequentialIndex, questionNumber, correctAnswersCount, isNavigating, debugInfo]);

  // Add effect to handle location changes
  useEffect(() => {
    console.log('[QuizView] Location changed:', {
      pathname: location.pathname,
      search: location.search,
      state: location.state
    });
  }, [location]);

  if (loading) {
    console.log('[QuizView] Rendering loading state with:', {
      isSequentialMode,
      hasLoadedSequentialIds,
      sequentialIdsLength: sequentialIds.length,
      id,
      error
    });
    return (
      <div className="loading">
        <h2>Loading quiz...</h2>
        <p>Please wait while we prepare your question.</p>
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                // Force a reload of the current content
                if (id) {
                  navigate(`/student/quiz/${id}?mode=sequential`, { replace: true });
                }
              }} 
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/student')} 
            className="back-button"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
      return (
          <div className="error-container">
              <h2>Error</h2>
              <p>Could not load the quiz content.</p>
              <button onClick={() => navigate('/student')}>Back to Dashboard</button>
          </div>
      );
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  // Quiz completion view
  if (quizCompleted) {
    const actualTotalQuestions = isSequentialMode && sequentialIds.length > 0 ? sequentialIds.length : totalQuestions;
    const masteryLevel = actualTotalQuestions > 0 ? correctAnswersCount / actualTotalQuestions : 0;
    const currentKcName = answeredQuestions[0]?.knowledgeComponent || "This Topic"; // Get KC name from first answered question

    let masteryStatusText = '';
    let currentKcStatusText = '';
    let encouragingQuote = '';
    let showUnlockMessage = false;

    if (masteryLevel >= 0.9) { // Consider 90%+ as mastered for this display
      masteryStatusText = 'Mastered!';
      currentKcStatusText = 'Mastered! 🎉';
      encouragingQuote = `Wow, ${studentName || 'Explorer'}! You mastered ${currentKcName}! Amazing job! 🚀`;
    } else if (masteryLevel >= 0.75) {
      masteryStatusText = 'Excellent!';
      currentKcStatusText = 'Excellent Progress! 👍';
      encouragingQuote = `Great work, ${studentName || 'Explorer'}! You're doing fantastic on ${currentKcName}! Keep it up! ✨`;
      showUnlockMessage = true;
    } else if (masteryLevel >= 0.5) {
      masteryStatusText = 'Good Progress';
      currentKcStatusText = 'Making Good Progress 😊';
      encouragingQuote = `Nice try, ${studentName || 'Explorer'}! You're learning ${currentKcName}. Practice makes perfect! 💪`;
      showUnlockMessage = true;
    } else {
      masteryStatusText = 'Not Yet Mastered';
      currentKcStatusText = 'Needs Review 🧐';
      encouragingQuote = `Great start, ${studentName || 'Explorer'}! Let's keep practicing ${currentKcName} to get even better! 💡`;
      showUnlockMessage = true;
    }

    // Simplified completion screen based on user feedback
    return (
      <div className="quiz-completion-simple">
        <h2>Quiz Complete!</h2>

        <div className="completion-summary">
          <p className="score">
            Your Score: {correctAnswersCount} out of {actualTotalQuestions} ({masteryStatusText})
          </p>
          <p className="progress-indicator">
            📊 Progress: {currentKcName} – {currentKcStatusText}
          </p>
          {showUnlockMessage && (
            <p className="unlock-message">
              🔓 Keep going to unlock the next topic!
            </p>
          )}
        </div>

        <div className="completion-actions">
          {/* Show Continue button if score is 75% or higher AND a next topic is available */}
          {masteryLevel >= 0.75 && nextKcIdForContinuation ? ( 
            <button onClick={handleContinueToNextTopic} className="button continue-button">
              🚀 Continue to Next Topic!
            </button>
          ) : (
            <button onClick={handleRetryQuiz} className="button retry-button">
              🔁 Retry Quiz
            </button>
          )}
          <button onClick={() => navigate('/student')} className="button back-button"> {/* Use back-button class */}
            🏠 Back to Dashboard
          </button>
        </div>

        <p className="encouragement-quote">
          💬 "{encouragingQuote}"
        </p>

         {/* Optional: Keep item breakdown for review */}
         <details className="item-breakdown-details">
           <summary>Show Question Breakdown</summary>
           <div className="item-breakdown-section">
             {answeredQuestions.map((item, index) => (
               <div key={index} className={`breakdown-item ${item.isCorrect ? 'correct-item' : 'incorrect-item'}`}>
                 <h4>Question {item.questionNumber}: {item.knowledgeComponent}</h4>
                 <p className="question-text"><strong>Q:</strong> {item.questionText}</p>
                 {item.options && (
                   <ul className="options-list">
                     {item.options.map((opt, i) => (
                       <li key={i}
                           className={`
                             ${item.studentAnswer === opt ? 'student-choice' : ''}
                             ${item.correctAnswer === opt ? 'correct-answer-option' : ''}
                           `}
                       >
                         {opt}
                         {item.studentAnswer === opt && <span className="your-answer-indicator"> (Your answer)</span>}
                         {item.correctAnswer === opt && item.studentAnswer !== opt && <span className="correct-answer-indicator"> (Correct answer)</span>}
                       </li>
                     ))}
                   </ul>
                 )}
                 {!item.options && ( // For fill-in-the-blank
                   <>
                     <p><strong>Your Answer:</strong> <span className={item.isCorrect ? 'text-correct' : 'text-incorrect'}>{item.studentAnswer}</span></p>
                     {!item.isCorrect && <p><strong>Correct Answer:</strong> {item.correctAnswer}</p>}
                   </>
                 )}
                 <p><strong>Status:</strong> {item.isCorrect ? <span className="status-correct">Correct ✔️</span> : <span className="status-incorrect">Incorrect ❌</span>}</p>
               </div>
             ))}
              {answeredQuestions.length === 0 && <p>No question details available for this quiz.</p>}
           </div>
         </details>
      </div>
    );
  }

  // --- Original detailed completion screen (now replaced) ---
  /*
  if (quizCompleted) {
    // ... existing detailed completion logic ...
  }
  */

  // --- DEBUG LOGGING ---
  // --- DEBUG LOGGING ---
  const currentMetadata = content?.metadata;
  const hintValue = currentMetadata && typeof currentMetadata === 'object' ? currentMetadata.hint : undefined;
  console.log("[QuizView Render] Content object:", content);
  console.log("[QuizView Render] Content metadata:", currentMetadata);
  console.log("[QuizView Render] Metadata type:", typeof currentMetadata);
  console.log("[QuizView Render] Hint value:", hintValue);
  console.log("[QuizView Render] Has hint?:", !!hintValue);
  // --- END DEBUG LOGGING ---

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h2>Math Mastery Quiz</h2>
        
        {/* Knowledge Component Information */}
        {content?.KnowledgeComponent && (
          <div className="kc-info">
            <h3 className="kc-title">{content.KnowledgeComponent.name}</h3>
            {content.KnowledgeComponent.curriculum_code && (
              <span className="kc-code">{content.KnowledgeComponent.curriculum_code}</span>
            )}
          </div>
        )}
        
        {/* Quiz Progress */}
        <div className="quiz-progress">
          {isSequentialMode && sequentialIds.length > 0 ? (
            <>
              <span>Question {currentSequentialIndex + 1} of {sequentialIds.length}</span>
              <div className="progress-bar">
                <div style={{
                  width: `${((currentSequentialIndex + 1) / sequentialIds.length) * 100}%`
                }}></div>
              </div>
            </>
          ) : (
            <>
              <span>Question {questionNumber} of {totalQuestions}</span>
              <div className="progress-bar">
                <div style={{
                  width: `${(questionNumber / totalQuestions) * 100}%`
                }}></div>
              </div>
            </>
          )}
        </div>
        
        <div className="quiz-timer">Time: {formatTime(timeSpent)}</div>
      </div>
      
      <div className="quiz-question">
        <h3>{content?.content || 'Question text not available.'}</h3>
        
        {/* Display question image if available */}
        {content?.metadata?.imageUrl && (
          <div className="quiz-image-container">
            <img
              src={content.metadata.imageUrl}
              alt="Question visual"
              className="quiz-image"
            />
          </div>
        )}
      </div>
      
      <div className="quiz-options">
        {content?.options ? ( // Check the dedicated 'options' field instead of 'metadata.choices'
          // Multiple choice questions
          content.options.map((option, index) => ( // Use content.options here
            <div 
              key={index}
              className={`quiz-option ${selectedOption === option ? 'selected' : ''} 
                        ${submitted && content?.correct_answer && option === content.correct_answer ? 'correct' : ''}
                        ${submitted && content?.correct_answer && selectedOption === option && option !== content.correct_answer ? 'incorrect' : ''}`}
              onClick={() => handleOptionSelect(option)}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </div>
          ))
        ) : (
          // Text input for non-multiple choice questions
          <div className="text-input-container">
            <input
              type="text"
              placeholder="Type your answer here..."
              disabled={submitted}
              value={selectedOption || ''}
              onChange={(e) => setSelectedOption(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !submitted && selectedOption) {
                  handleSubmit();
                }
              }}
              className={`text-answer-input ${
                submitted
                  ? (correct ? 'correct' : 'incorrect')
                  : ''
              }`}
            />
          </div>
        )}
      </div>
      
      <div className="quiz-actions">
        {!submitted && (
          <>
            <button 
              className="hint-button" 
              onClick={handleShowHint}
              disabled={showHint || !hintValue} // Use derived hintValue
            >
              Show Hint
            </button>
            <button 
              className="submit-button" 
              onClick={handleSubmit}
              disabled={!selectedOption}
            >
              Submit Answer
            </button>
          </>
        )}
        
        {submitted && ( 
          <>
        <button 
          className="next-button" 
          onClick={handleNextQuestion}
          style={{ 
            backgroundColor: '#4285f4', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Continue to Next Question
        </button>
          </>
        )}
      </div>
      
      {showHint && hintValue && ( // Use derived hintValue
        <div className="quiz-hint">
          <h4>Hint:</h4>
          <p>{hintValue}</p>
        </div>
      )}
      
      {submitted && (
        <div className={`quiz-feedback ${correct ? 'correct' : 'incorrect'}`}>
          <h4>{correct ? 'Correct!' : 'Not quite right'}</h4>
          {/* Display the explanation if it exists */}
          {content?.explanation && <p><strong>Explanation:</strong> {content.explanation}</p>}
          
          {feedback?.knowledgeState && ( 
            <div className="mastery-update">
              <p>Your mastery level is now: {(feedback.knowledgeState.p_mastery * 100).toFixed(0)}%</p>
              <div className="mastery-bar">
                <div 
                  className="mastery-fill" 
                  style={{ width: `${feedback.knowledgeState.p_mastery * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizView;
