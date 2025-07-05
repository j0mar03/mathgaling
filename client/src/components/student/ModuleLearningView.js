import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './ModuleLearningView.css';

const ModuleLearningView = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [module, setModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [progress, setProgress] = useState({ completedLessons: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Module 1: Numero at Ang Kahulugan Nito Content
  const module1Content = {
    title: "Module 1: Numero at Ang Kahulugan Nito",
    description: "Learn to represent, identify, read, and write numbers from 1001 to 10,000",
    lessons: [
      {
        id: 1,
        title: "KC1: Representing Numbers from 1001 to 10,000",
        melc_code: "M3NS-Ia-9.1",
        steps: [
          {
            type: "introduction",
            title: "Welcome to Number Representation!",
            content: "Today we'll learn how to represent large numbers using different tools and methods.",
            visual: "🔢"
          },
          {
            type: "explanation",
            title: "Understanding Place Value Tools",
            content: `We use different tools to represent numbers:
            
• **Blocks** = 1000 units (1 block = 1000)
• **Flats** = 100 units (1 flat = 10 longs = 100 units)  
• **Longs** = 10 units (1 long = 10 squares)
• **Squares** = 1 unit

Let's see how to represent the number 1,222:`,
            visual: "📦",
            example: {
              number: 1222,
              breakdown: [
                { tool: "Blocks", count: 1, value: 1000, visual: "🟫" },
                { tool: "Flats", count: 2, value: 200, visual: "🟨🟨" },
                { tool: "Longs", count: 2, value: 20, visual: "🟦🟦" },
                { tool: "Squares", count: 2, value: 2, visual: "🟩🟩" }
              ]
            }
          },
          {
            type: "interactive",
            title: "Try It Yourself!",
            question: "How many BLOCKS do we need to represent the number 3,456?",
            hint: "Remember: 1 block = 1000 units. Look at the thousands place!",
            correctAnswer: "3",
            options: ["2", "3", "4", "5"],
            explanation: "3,456 has 3 in the thousands place, so we need 3 blocks (3 × 1000 = 3000)"
          },
          {
            type: "practice",
            title: "Number Discs Practice",
            content: "Number discs help us organize our numbers by place value.",
            question: "Use number discs to show 2,847. How many discs go in the HUNDREDS place?",
            hint: "Look at the digit in the hundreds place of 2,847",
            correctAnswer: "8",
            explanation: "In 2,847, the digit 8 is in the hundreds place, so we need 8 hundred-discs."
          }
        ]
      },
      {
        id: 2,
        title: "KC2: Identifying Place Value and Value of Digits",
        melc_code: "M3NS-Ia-9.2",
        steps: [
          {
            type: "introduction",
            title: "Understanding Place Value",
            content: "Every digit in a number has a specific place and value. Let's learn the Filipino terms!",
            visual: "🔢"
          },
          {
            type: "explanation",
            title: "Place Value Names (Filipino)",
            content: `In Filipino, we call the place values:

• **Libuhan** = Thousands place (1000s)
• **Sandaanan** = Hundreds place (100s)
• **Sampuan** = Tens place (10s)  
• **Isahan** = Ones place (1s)

Example with 3,548:`,
            example: {
              number: 3548,
              breakdown: [
                { digit: "3", place: "Libuhan", value: 3000, position: "thousands" },
                { digit: "5", place: "Sandaanan", value: 500, position: "hundreds" },
                { digit: "4", place: "Sampuan", value: 40, position: "tens" },
                { digit: "8", place: "Isahan", value: 8, position: "ones" }
              ]
            }
          },
          {
            type: "interactive",
            title: "Place Value Challenge",
            question: "In the number 6,739, what is the VALUE of the digit 7?",
            hint: "The digit 7 is in the sandaanan (hundreds) place. What is 7 × 100?",
            correctAnswer: "700",
            options: ["7", "70", "700", "7000"],
            explanation: "The digit 7 is in the hundreds place, so its value is 7 × 100 = 700"
          },
          {
            type: "practice",
            title: "Place Value Chart",
            content: "Let's fill in a place value chart for better understanding.",
            question: "In the number 4,925, which digit is in the 'sampuan' (tens) place?",
            correctAnswer: "2",
            hint: "Sampuan means tens place. Count from right: ones, tens, hundreds, thousands.",
            explanation: "In 4,925: 5=ones, 2=tens(sampuan), 9=hundreds, 4=thousands. So 2 is in sampuan."
          }
        ]
      },
      {
        id: 3,
        title: "KC3: Reading and Writing Numbers in Symbols and Words",
        melc_code: "M3NS-Ia-9.3",
        steps: [
          {
            type: "introduction",
            title: "Numbers in Words (Filipino)",
            content: "Now we'll learn to read and write numbers in Filipino words!",
            visual: "📝"
          },
          {
            type: "explanation",
            title: "Filipino Number Words",
            content: `Key Filipino number words:
            
• **libo** = thousand
• **daan** = hundred  
• **sampu** = ten
• **isa, dalawa, tatlo, apat, lima, anim, pito, walo, siyam** = 1-9

Example: 3,548 = "tatlong libo, limang daan, at apatnapu't-walo"`,
            example: {
              number: 3548,
              breakdown: [
                { part: "tatlong libo", value: 3000, meaning: "three thousand" },
                { part: "limang daan", value: 500, meaning: "five hundred" },
                { part: "apatnapu't-walo", value: 48, meaning: "forty-eight" }
              ],
              fullWords: "tatlong libo, limang daan, at apatnapu't-walo"
            }
          },
          {
            type: "interactive",
            title: "Words to Numbers",
            question: "What number is 'dalawang libo, tatlong daan, at limampu'?",
            hint: "dalawang libo = 2000, tatlong daan = 300, limampu = 50",
            correctAnswer: "2350",
            options: ["2350", "2530", "2305", "2035"],
            explanation: "dalawang libo (2000) + tatlong daan (300) + limampu (50) = 2,350"
          },
          {
            type: "practice",
            title: "Number Writing Practice",
            content: "Practice writing numbers in Filipino words.",
            question: "Write 1,750 in Filipino words. What comes after 'isang libo'?",
            correctAnswer: "pitong daan at limampu",
            hint: "1,750 = isang libo + pitong daan + limampu",
            explanation: "1,750 = 'isang libo, pitong daan at limampu' (one thousand, seven hundred and fifty)"
          }
        ]
      }
    ]
  };

  useEffect(() => {
    const fetchModuleData = async () => {
      if (!token || !moduleId) {
        setError('Authentication required or invalid module');
        setLoading(false);
        return;
      }

      try {
        // For Module 1, use our predefined content
        if (moduleId === "1") {
          setModule({
            module_id: 1,
            module_title: module1Content.title,
            module_description: module1Content.description,
            quarter_number: 1,
            estimated_weeks: 3,
            completion_percentage: 0
          });
        } else {
          setError('This module is not yet available.');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading module:', err);
        setError('Failed to load module data');
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [moduleId, token]);

  const handleAnswerSubmit = () => {
    const currentStepData = module1Content.lessons[currentLesson].steps[currentStep];
    
    if (currentStepData.type === 'interactive' || currentStepData.type === 'practice') {
      const isCorrect = userAnswer.toLowerCase() === currentStepData.correctAnswer.toLowerCase();
      
      setShowFeedback(true);
      setFeedbackMessage(isCorrect ? 
        `🎉 Excellent! ${currentStepData.explanation}` : 
        `Not quite. ${currentStepData.hint} The correct answer is: ${currentStepData.correctAnswer}. ${currentStepData.explanation}`
      );

      // Auto-advance after feedback
      setTimeout(() => {
        setShowFeedback(false);
        setUserAnswer('');
        handleNextStep();
      }, 4000);
    }
  };

  const handleNextStep = () => {
    const currentLessonData = module1Content.lessons[currentLesson];
    
    if (currentStep < currentLessonData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentLesson < module1Content.lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
      setCurrentStep(0);
    } else {
      // Module completed
      alert('🎉 Congratulations! You completed Module 1: Numero at Ang Kahulugan Nito!');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
      setCurrentStep(module1Content.lessons[currentLesson - 1].steps.length - 1);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/student/deped-modules');
  };

  if (loading) {
    return (
      <div className="module-learning-container">
        <div className="loading-spinner"></div>
        <h2>Loading Module...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module-learning-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBackToDashboard}>Back to Modules</button>
        </div>
      </div>
    );
  }

  const currentLessonData = module1Content.lessons[currentLesson];
  const currentStepData = currentLessonData.steps[currentStep];
  const totalSteps = module1Content.lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0);
  const currentStepNumber = module1Content.lessons.slice(0, currentLesson).reduce((sum, lesson) => sum + lesson.steps.length, 0) + currentStep + 1;
  const progressPercentage = (currentStepNumber / totalSteps) * 100;

  return (
    <div className="module-learning-container">
      <div className="module-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Modules
        </button>
        
        <div className="module-title-section">
          <h1>{module.module_title}</h1>
          <div className="progress-info">
            <span className="lesson-badge">{currentLessonData.title}</span>
            <span className="melc-badge">{currentLessonData.melc_code}</span>
          </div>
        </div>

        <div className="overall-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="progress-text">Step {currentStepNumber} of {totalSteps}</span>
        </div>
      </div>

      <div className="learning-content">
        <div className="step-container">
          <div className="step-header">
            <span className="step-type">{currentStepData.type}</span>
            <h2>{currentStepData.title}</h2>
          </div>

          <div className="step-content">
            {currentStepData.visual && (
              <div className="visual-element">
                <span className="visual-icon">{currentStepData.visual}</span>
              </div>
            )}

            <div className="content-text">
              {currentStepData.content && (
                <div className="explanation">
                  {currentStepData.content.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              )}

              {currentStepData.example && (
                <div className="example-section">
                  <h3>Example: {currentStepData.example.number}</h3>
                  <div className="example-breakdown">
                    {currentStepData.example.breakdown.map((item, index) => (
                      <div key={index} className="breakdown-item">
                        {item.visual && <span className="item-visual">{item.visual}</span>}
                        <span className="item-text">
                          {item.tool || item.digit || item.part}: {item.value} 
                          {item.meaning && ` (${item.meaning})`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {currentStepData.example.fullWords && (
                    <div className="full-words">
                      <strong>Complete: "{currentStepData.example.fullWords}"</strong>
                    </div>
                  )}
                </div>
              )}

              {(currentStepData.type === 'interactive' || currentStepData.type === 'practice') && (
                <div className="interactive-section">
                  <div className="question-box">
                    <h3>📝 {currentStepData.question}</h3>
                    
                    {currentStepData.options ? (
                      <div className="options-grid">
                        {currentStepData.options.map((option, index) => (
                          <button
                            key={index}
                            className={`option-button ${userAnswer === option ? 'selected' : ''}`}
                            onClick={() => setUserAnswer(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="answer-input"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                      />
                    )}

                    {!showFeedback && (
                      <button 
                        className="submit-button"
                        onClick={handleAnswerSubmit}
                        disabled={!userAnswer}
                      >
                        Submit Answer
                      </button>
                    )}

                    {currentStepData.hint && !showFeedback && (
                      <div className="hint-section">
                        <span className="hint-icon">💡</span>
                        <p className="hint-text">{currentStepData.hint}</p>
                      </div>
                    )}
                  </div>

                  {showFeedback && (
                    <div className={`feedback-box ${feedbackMessage.includes('🎉') ? 'correct' : 'incorrect'}`}>
                      <p>{feedbackMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="navigation-controls">
            <button 
              className="nav-button prev"
              onClick={handlePreviousStep}
              disabled={currentLesson === 0 && currentStep === 0}
            >
              ← Previous
            </button>
            
            {currentStepData.type === 'introduction' || currentStepData.type === 'explanation' ? (
              <button className="nav-button next" onClick={handleNextStep}>
                Next →
              </button>
            ) : null}

            {(currentLesson === module1Content.lessons.length - 1 && 
              currentStep === currentLessonData.steps.length - 1) && (
              <button className="complete-button" onClick={handleBackToDashboard}>
                🎉 Complete Module
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleLearningView;