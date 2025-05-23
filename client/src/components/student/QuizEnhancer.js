// QuizView Enhancement Functions
// This adds enhanced styling and logic to the existing quiz completion

export const enhanceQuizCompletion = (
  score, 
  totalQuestions, 
  actualKcMastery, 
  searchingNextTopic, 
  nextTopicSearchComplete, 
  nextKcIdForContinuation,
  handleContinueToNextTopic,
  handleRetryQuiz
) => {
  const scorePercentage = score / totalQuestions;
  const actualPerformance = Math.max(scorePercentage, actualKcMastery);
  const perfectScore = score === totalQuestions;
  const excellentScore = scorePercentage >= 0.9;
  const goodScore = scorePercentage >= 0.75;
  const performedWell = actualPerformance >= 0.75 || scorePercentage >= 0.75;

  // Enhanced action button logic
  if (performedWell && searchingNextTopic) {
    return {
      type: 'loading',
      content: (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div className="loading-spinner-inline"></div>
          <p style={{ color: '#3498db', fontWeight: '600' }}>🔍 Finding your next learning adventure...</p>
        </div>
      )
    };
  }

  if (perfectScore && nextTopicSearchComplete && nextKcIdForContinuation) {
    return {
      type: 'perfect',
      content: (
        <div className="enhanced-action-card perfect-score-card">
          <h3>🏆 PERFECT SCORE ACHIEVED!</h3>
          <p>Amazing! You've mastered this topic completely!</p>
          <button onClick={handleContinueToNextTopic} className="enhanced-action-button">
            👑 Continue as Champion → Next Topic
          </button>
        </div>
      )
    };
  }

  if (excellentScore && nextTopicSearchComplete && nextKcIdForContinuation) {
    return {
      type: 'excellent',
      content: (
        <div className="enhanced-action-card excellent-score-card">
          <h3>⭐ EXCELLENT WORK!</h3>
          <p>Outstanding performance! Ready for the next challenge?</p>
          <button onClick={handleContinueToNextTopic} className="enhanced-action-button">
            🚀 Start Next Topic
          </button>
        </div>
      )
    };
  }

  if (performedWell && nextTopicSearchComplete && nextKcIdForContinuation) {
    return {
      type: 'good',
      content: (
        <div className="enhanced-action-card good-score-card">
          <h3>👏 GREAT JOB!</h3>
          <p>You're doing really well! Continue your learning journey?</p>
          <button onClick={handleContinueToNextTopic} className="enhanced-action-button">
            ✨ Continue Learning
          </button>
        </div>
      )
    };
  }

  if (!perfectScore && scorePercentage < 0.8) {
    return {
      type: 'retry',
      content: (
        <div className="enhanced-action-card retry-card">
          <h3>💪 WANT TO IMPROVE?</h3>
          <p>Practice makes perfect! Try again to master this topic.</p>
          <button onClick={handleRetryQuiz} className="enhanced-action-button">
            🔄 Try Again
          </button>
        </div>
      )
    };
  }

  return {
    type: 'wellDone',
    content: (
      <div className="enhanced-action-card well-done-card">
        <h3>🎯 WELL DONE!</h3>
        <p>You've shown great understanding of this topic!</p>
      </div>
    )
  };
};

export const getMotivationalQuote = (scorePercentage, currentKcName) => {
  const quotes = {
    perfect: [
      "Perfect! You're a math superstar! ⭐",
      "Incredible! You've mastered this completely! 🎯",
      "Amazing work! You're on fire! 🔥"
    ],
    excellent: [
      `Fantastic! You're really understanding ${currentKcName}! 🌟`,
      "Outstanding effort! Keep up the great work! 💫",
      "Brilliant! You're becoming a math expert! 🧠"
    ],
    good: [
      `Great job! You're making real progress with ${currentKcName}! 📈`,
      "Nice work! You're getting stronger every day! 💪",
      "Well done! Practice is making you better! ✨"
    ],
    needsWork: [
      "Every expert was once a beginner! Keep going! 🌱",
      "You're learning and growing! That's what matters! 🌟",
      "Each try makes you stronger! Don't give up! 💪"
    ]
  };

  let category;
  if (scorePercentage === 1) category = 'perfect';
  else if (scorePercentage >= 0.8) category = 'excellent';
  else if (scorePercentage >= 0.6) category = 'good';
  else category = 'needsWork';

  const categoryQuotes = quotes[category];
  return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
};

export const createEnhancedQuestionBreakdown = (answeredQuestions) => {
  const correctCount = answeredQuestions.filter(q => q.isCorrect).length;
  const incorrectCount = answeredQuestions.filter(q => !q.isCorrect).length;
  
  return {
    summary: {
      correct: correctCount,
      incorrect: incorrectCount,
      total: answeredQuestions.length,
      percentage: Math.round((correctCount / answeredQuestions.length) * 100)
    },
    insights: answeredQuestions
      .filter(q => !q.isCorrect)
      .slice(0, 2)
      .map(item => ({
        questionNumber: item.questionNumber,
        topic: item.knowledgeComponent,
        tip: generateLearningTip(item.knowledgeComponent)
      }))
  };
};

const generateLearningTip = (knowledgeComponent) => {
  const tips = {
    'Addition': "💡 Remember to line up the numbers by place value when adding!",
    'Subtraction': "💡 Check your borrowing when subtracting larger numbers!",
    'Multiplication': "💡 Practice your times tables to solve faster!",
    'Division': "💡 Think about how many groups you can make!",
    'Fractions': "💡 Remember that the bottom number tells you how many equal parts!",
    'Place Value': "💡 Each position has a different value - ones, tens, hundreds!",
    'default': "💡 Take your time and read the question carefully!"
  };

  for (const [key, tip] of Object.entries(tips)) {
    if (knowledgeComponent.includes(key)) {
      return tip;
    }
  }
  
  return tips.default;
};