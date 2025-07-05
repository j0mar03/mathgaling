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

  // Module Content Data
  const moduleContent = {
    1: {
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
  },
  2: {
    title: "Module 2: Paghahambing at Pagkakaayos ng mga Numero",
    description: "Learn to compare, order, and round numbers from 1001 to 10,000",
    lessons: [
      {
        id: 4,
        title: "KC4: Comparing Numbers up to 10,000 using symbols (>, <, =)",
        melc_code: "M3NS-Ib-5.1-2",
        steps: [
          {
            type: "introduction",
            title: "Welcome to Number Comparison!",
            content: "Today we'll learn how to compare numbers using special symbols: > (greater than), < (less than), and = (equal to).",
            visual: "⚖️"
          },
          {
            type: "explanation",
            title: "Rules for Comparing Numbers",
            content: `Follow these steps to compare numbers:

**Step 1:** Compare the number of digits first
• A number with more digits is always larger
• Example: 125 < 1000 (3 digits vs 4 digits)

**Step 2:** If digits are equal, compare from left to right
• Start with thousands, then hundreds, then tens, then ones
• Stop when you find a difference

**Symbols to Remember:**
• **>** means "greater than" (mas malaki)
• **<** means "less than" (mas maliit)
• **=** means "equal to" (katumbas)`,
            visual: "🔢",
            example: {
              number: "1375 vs 1345",
              breakdown: [
                { step: "Step 1", check: "Same digits (4 each)", result: "Continue to Step 2" },
                { step: "Step 2", check: "Thousands: 1 = 1", result: "Continue comparing" },
                { step: "Step 3", check: "Hundreds: 3 = 3", result: "Continue comparing" },
                { step: "Step 4", check: "Tens: 7 > 4", result: "1375 > 1345" }
              ]
            }
          },
          {
            type: "interactive",
            title: "Tree Planting Comparison",
            question: "FES planted 1236 tree seedlings and CIS planted 1165 seedlings. Which symbol shows the correct comparison: 1236 ___ 1165?",
            hint: "Both numbers have 4 digits. Compare from left: thousands (1=1), hundreds (2>1), so 1236 > 1165",
            correctAnswer: ">",
            options: [">", "<", "="],
            explanation: "1236 > 1165 because when comparing hundreds place: 2 > 1, so FES planted more seedlings."
          },
          {
            type: "practice",
            title: "Digit Value Challenge",
            content: "Some digits have different values depending on their position.",
            question: "Which number has the largest VALUE for the digit 4: 1254, 1245, 3456, or 4215?",
            hint: "Look at the place value of digit 4 in each number. Thousands > Hundreds > Tens > Ones",
            correctAnswer: "4215",
            options: ["1254", "1245", "3456", "4215"],
            explanation: "In 4215, the digit 4 is in the thousands place (4000), which is the largest value compared to other positions."
          }
        ]
      },
      {
        id: 5,
        title: "KC5: Ordering Numbers with 4 to 5 Digits",
        melc_code: "M3NS-Ic-6.1-2",
        steps: [
          {
            type: "introduction",
            title: "Arranging Numbers in Order",
            content: "Let's learn how to arrange numbers from smallest to largest (ascending) or largest to smallest (descending).",
            visual: "📊"
          },
          {
            type: "explanation",
            title: "Ascending vs Descending Order",
            content: `**Ascending Order (Pataas):**
• Arrange from smallest to largest
• Example: 1268, 1537, 3416, 4796, 7811

**Descending Order (Pababa):**
• Arrange from largest to smallest
• Example: 7811, 4796, 3416, 1537, 1268

**How to Order Numbers:**
1. Compare numbers from left to right
2. Start with the leftmost digit (highest place value)
3. Arrange based on the required order`,
            visual: "🔄",
            example: {
              numbers: "4379, 4381, 4375, 4378, 4380",
              breakdown: [
                { step: "Compare thousands", result: "All have 4 (same)" },
                { step: "Compare hundreds", result: "All have 3 (same)" },
                { step: "Compare tens", result: "All have 7 (same)" },
                { step: "Compare ones", result: "5, 8, 9, 0, 1" }
              ],
              ascending: "4375, 4378, 4379, 4380, 4381"
            }
          },
          {
            type: "interactive",
            title: "Market Weights Challenge",
            question: "Aling Lita bought: mais (3225g), mangga (3750g), isda (2500g), karne (1500g). Which is the HEAVIEST item?",
            hint: "Compare the numbers: 3225, 3750, 2500, 1500. Which is the largest?",
            correctAnswer: "mangga",
            options: ["mais", "mangga", "isda", "karne"],
            explanation: "Mangga at 3750g is the heaviest. Order from heaviest to lightest: mangga (3750g), mais (3225g), isda (2500g), karne (1500g)."
          },
          {
            type: "practice",
            title: "Descending Order Practice",
            content: "Practice arranging numbers from largest to smallest.",
            question: "Arrange these numbers in descending order: 1236, 1326, 1632, 1623. What is the FIRST (largest) number?",
            hint: "Compare each number. Which has the largest value when you compare from left to right?",
            correctAnswer: "1632",
            options: ["1236", "1326", "1632", "1623"],
            explanation: "1632 is the largest. Complete descending order: 1632, 1623, 1326, 1236."
          }
        ]
      },
      {
        id: 6,
        title: "KC6: Rounding Numbers to Nearest Tens, Hundreds, Thousands",
        melc_code: "M3NS-Ib-4.1-3",
        steps: [
          {
            type: "introduction",
            title: "Learning to Round Numbers",
            content: "Rounding helps us estimate and work with simpler numbers. We'll learn to round to the nearest tens, hundreds, and thousands.",
            visual: "🎯"
          },
          {
            type: "explanation",
            title: "Rounding Rules",
            content: `**Rounding to Nearest Tens:**
• Look at the ones place digit
• If 0, 1, 2, 3, or 4 → round DOWN (pababa)
• If 5, 6, 7, 8, or 9 → round UP (pataas)
• Example: 427 → 430 (7 ≥ 5, so round up)

**Rounding to Nearest Hundreds:**
• Look at the tens place digit
• Same rule: 0-4 round down, 5-9 round up
• Example: 1345 → 1300 (4 < 5, so round down)

**Rounding to Nearest Thousands:**
• Look at the hundreds place digit
• Same rule: 0-4 round down, 5-9 round up
• Example: 1530 → 2000 (5 ≥ 5, so round up)`,
            visual: "🔄",
            example: {
              number: "Rounding 2387",
              breakdown: [
                { type: "To nearest tens", digit: "7", rule: "7 ≥ 5, round up", result: "2390" },
                { type: "To nearest hundreds", digit: "8", rule: "8 ≥ 5, round up", result: "2400" },
                { type: "To nearest thousands", digit: "3", rule: "3 < 5, round down", result: "2000" }
              ]
            }
          },
          {
            type: "interactive",
            title: "Ribbon Length Problem",
            question: "Rina needs 156 cm of ribbon. The store sells ribbon in lengths of 100 cm, 150 cm, 200 cm, and 250 cm. Which length should she buy?",
            hint: "Round 156 to the nearest hundred to find the best length. Look at the tens digit: 5 ≥ 5, so round up.",
            correctAnswer: "200 cm",
            options: ["100 cm", "150 cm", "200 cm", "250 cm"],
            explanation: "156 rounded to the nearest hundred is 200 (since 5 ≥ 5, round up). So Rina should buy 200 cm of ribbon."
          },
          {
            type: "practice",
            title: "Islands Estimation",
            content: "The Philippines has many islands. Let's practice rounding large numbers.",
            question: "There are 7641 islands in the Philippines. Round this to the nearest thousand.",
            hint: "Look at the hundreds digit in 7641. Is it 0-4 (round down) or 5-9 (round up)?",
            correctAnswer: "8000",
            options: ["7000", "8000", "7600", "7700"],
            explanation: "7641 rounded to the nearest thousand is 8000 because the hundreds digit is 6 (≥ 5), so we round up from 7000 to 8000."
          }
        ]
      }
    ]
  },
  3: {
    title: "Module 3: Ordinal Numbers at Pera",
    description: "Learn ordinal numbers from 1st to 100th and identify, read, and write Philippine money",
    lessons: [
      {
        id: 7,
        title: "KC7: Understanding Ordinal Numbers from 1st to 100th",
        melc_code: "M3NS-Ic-7",
        steps: [
          {
            type: "introduction",
            title: "Welcome to Ordinal Numbers!",
            content: "Today we'll learn about ordinal numbers that show position or order in a sequence, like 1st, 2nd, 3rd, and beyond!",
            visual: "🔢"
          },
          {
            type: "explanation",
            title: "What are Ordinal Numbers?",
            content: `Ordinal numbers tell us the POSITION of things in order:

**Writing Ordinal Numbers in Symbols:**
• **1st, 2nd, 3rd** - Special endings
• **4th, 5th, 6th, 7th, 8th, 9th, 10th** - Use "th"
• **11th, 12th, 13th** - Special cases (always "th")
• **21st, 22nd, 23rd** - Back to special endings
• **20th, 30th, 40th** - Tens use "th"

**Filipino Ordinal Words:**
• Use "ika-" before the number word
• 1st = Una (special case)
• 2nd = Ikalawa
• 6th = Ikaanim
• 11th = Ika-labing isa`,
            visual: "📍",
            example: {
              number: "Writing 21st to 25th",
              breakdown: [
                { position: "21st", filipino: "Ika-dalawampu't isa", rule: "ends in 1 → st" },
                { position: "22nd", filipino: "Ika-dalawampu't dalawa", rule: "ends in 2 → nd" },
                { position: "23rd", filipino: "Ika-dalawampu't tatlo", rule: "ends in 3 → rd" },
                { position: "24th", filipino: "Ika-dalawampu't apat", rule: "ends in 4 → th" },
                { position: "25th", filipino: "Ika-dalawampu't lima", rule: "ends in 5 → th" }
              ]
            }
          },
          {
            type: "interactive",
            title: "Birthday Challenge",
            question: "Ruth's birthday is on the 18th of May. How do we write this ordinal number correctly?",
            hint: "Numbers ending in 8 use 'th'. So 18 becomes 18th.",
            correctAnswer: "18th",
            options: ["18st", "18nd", "18rd", "18th"],
            explanation: "18th is correct because numbers ending in 8 always use 'th' as the superscript."
          },
          {
            type: "practice",
            title: "Filipino Alphabet Challenge",
            content: "The Filipino alphabet has 28 letters: A, B, C, D, E, F, G, H, I, J, K, L, M, N, NG, O, P, Q, R, S, T, U, V, W, X, Y, Z, Ñ",
            question: "What is the 10th letter in the Filipino alphabet?",
            hint: "Count from A (1st), B (2nd), C (3rd)... until you reach the 10th position.",
            correctAnswer: "J",
            options: ["I", "J", "K", "L"],
            explanation: "J is the 10th letter: A(1st), B(2nd), C(3rd), D(4th), E(5th), F(6th), G(7th), H(8th), I(9th), J(10th)."
          }
        ]
      },
      {
        id: 8,
        title: "KC8: Identifying, Reading, and Writing Money",
        melc_code: "M3NS-Id-8-9",
        steps: [
          {
            type: "introduction",
            title: "Learning About Philippine Money",
            content: "Let's learn about our Philippine peso and sentimo! We'll practice reading and writing money amounts in both symbols and words.",
            visual: "💰"
          },
          {
            type: "explanation",
            title: "Philippine Currency System",
            content: `**Philippine Coins:**
• 1 sentimo (silver) - Mangkono tree
• 5 sentimo (silver/bronze) - Kapal-Kapal Baging 
• 10 sentimo (bronze/silver) - BSP logo
• 25 sentimo (gold/silver) - Katmon flower
• Php 1 (silver) - Dr. Jose Rizal
• Php 5 (silver) - Andres Bonifacio
• Php 10 (silver) - Apolinario Mabini
• Php 20 (bi-metallic) - Manuel L. Quezon

**Philippine Bills:**
• Php 20 (orange) - Manuel L. Quezon
• Php 50 (red) - Sergio Osmeña  
• Php 100 (violet) - Manuel A. Roxas
• Php 500 (yellow) - Corazon & Benigno Aquino
• Php 1000 (blue) - Josefa Escoda & Vicente Lim`,
            visual: "🏦",
            example: {
              number: "Writing PhP 36.75",
              breakdown: [
                { format: "Symbol form", result: "PhP 36.75", explanation: "Use PhP, then amount with period" },
                { format: "Word form", result: "Tatlumpu't anim na piso at pitumpu't limang sentimo", explanation: "Pesos first, then 'at', then centavos" },
                { format: "Parts", result: "36 pesos + 75 centavos", explanation: "Period separates pesos from centavos" }
              ]
            }
          },
          {
            type: "interactive",
            title: "Coin Identification Challenge",
            question: "Which coin features Dr. Jose Rizal, our national hero?",
            hint: "Dr. Jose Rizal appears on the silver-colored 1 peso coin along with Apolinario Mabini.",
            correctAnswer: "Php 1",
            options: ["25 sentimo", "Php 1", "Php 5", "Php 10"],
            explanation: "The Php 1 coin (silver) features Dr. Jose Rizal and Apolinario Mabini, our national heroes."
          },
          {
            type: "practice",
            title: "Money Reading Practice",
            content: "Practice reading money amounts in Filipino words.",
            question: "How do you read PhP 125.50 in Filipino words?",
            hint: "Say the pesos first (125), then 'at', then the centavos (50). Remember: 125 = isang daan dalawampu't lima",
            correctAnswer: "Isang daan dalawampu't limang piso at limampung sentimo",
            explanation: "PhP 125.50 = Isang daan dalawampu't limang piso at limampung sentimo. Always say pesos first, then centavos."
          }
        ]
      }
    ]
  }
};

  useEffect(() => {
    const fetchModuleData = async () => {
      if (!token || !moduleId) {
        setError('Authentication required or invalid module');
        setLoading(false);
        return;
      }

      try {
        // Use our predefined content for available modules
        const currentModuleContent = moduleContent[moduleId];
        if (currentModuleContent) {
          setModule({
            module_id: parseInt(moduleId),
            module_title: currentModuleContent.title,
            module_description: currentModuleContent.description,
            quarter_number: moduleId === "1" ? 1 : moduleId === "2" ? 1 : 2,
            estimated_weeks: moduleId === "1" ? 3 : moduleId === "2" ? 4 : 3,
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
    const currentModuleContent = moduleContent[moduleId];
    const currentStepData = currentModuleContent.lessons[currentLesson].steps[currentStep];
    
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
    const currentModuleContent = moduleContent[moduleId];
    const currentLessonData = currentModuleContent.lessons[currentLesson];
    
    if (currentStep < currentLessonData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentLesson < currentModuleContent.lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
      setCurrentStep(0);
    } else {
      // Module completed
      alert(`🎉 Congratulations! You completed ${currentModuleContent.title}!`);
    }
  };

  const handlePreviousStep = () => {
    const currentModuleContent = moduleContent[moduleId];
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
      setCurrentStep(currentModuleContent.lessons[currentLesson - 1].steps.length - 1);
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

  const currentModuleContent = moduleContent[moduleId];
  const currentLessonData = currentModuleContent.lessons[currentLesson];
  const currentStepData = currentLessonData.steps[currentStep];
  const totalSteps = currentModuleContent.lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0);
  const currentStepNumber = currentModuleContent.lessons.slice(0, currentLesson).reduce((sum, lesson) => sum + lesson.steps.length, 0) + currentStep + 1;
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
                          {item.tool || item.digit || item.part || item.step || item.position || item.format}: {item.value || item.check || item.result || item.filipino || item.explanation}
                          {item.meaning && ` (${item.meaning})`}
                          {item.rule && ` - ${item.rule}`}
                          {item.type && ` ${item.type}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {currentStepData.example.fullWords && (
                    <div className="full-words">
                      <strong>Complete: "{currentStepData.example.fullWords}"</strong>
                    </div>
                  )}
                  {currentStepData.example.ascending && (
                    <div className="full-words">
                      <strong>Ascending Order: {currentStepData.example.ascending}</strong>
                    </div>
                  )}
                  {currentStepData.example.numbers && (
                    <div className="full-words">
                      <strong>Numbers: {currentStepData.example.numbers}</strong>
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

            {(currentLesson === currentModuleContent.lessons.length - 1 && 
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