import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AdminContentManagement.css';

function AdminContentItemForm({ itemToEdit, knowledgeComponents, onSuccess, onClose }) {
  // State for a single Knowledge Component ID for all questions
  const [knowledgeComponentId, setKnowledgeComponentId] = useState('');

  // Form data state - now an array of questions
  const [questions, setQuestions] = useState([{
    type: '',
    content: '',
    difficulty: '',
    language: 'English',
    options: '',
    correct_answer: '',
    explanation: '',
    hint: '',
    imageFile: null,
    imagePreview: '',
    removeImage: false,
  }]);
  
  // Loading and error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get auth token
  const { token } = useAuth();

  // Initialize form when editing a single item
  useEffect(() => {
    if (itemToEdit) {
      setKnowledgeComponentId(itemToEdit.knowledge_component_id || '');
      const optionsString = itemToEdit.options
        ? (typeof itemToEdit.options === 'object'
            ? JSON.stringify(itemToEdit.options, null, 2)
            : itemToEdit.options)
        : '';
      setQuestions([{
        type: itemToEdit.type || '',
        content: itemToEdit.content || '',
        difficulty: itemToEdit.difficulty || '',
        language: itemToEdit.language || 'English',
        options: optionsString,
        correct_answer: itemToEdit.correct_answer || '',
        explanation: itemToEdit.explanation || '',
        hint: itemToEdit.metadata?.hint || '',
        imageFile: null,
        imagePreview: itemToEdit.metadata?.imageUrl || '',
        removeImage: false,
        id: itemToEdit.id // Keep track of id if editing
      }]);
    } else {
      // Reset for creation mode
      setKnowledgeComponentId('');
      setQuestions([{
        type: '', content: '', difficulty: '', language: 'English',
        options: '', correct_answer: '', explanation: '', hint: '',
        imageFile: null, imagePreview: '', removeImage: false,
      }]);
    }
  }, [itemToEdit]);

  // Handle changes for a specific question field
  const handleQuestionChange = (index, e) => {
    const { name, value } = e.target;
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [name]: value };
    setQuestions(newQuestions);
  };

  // Handle image file selection for a specific question
  const handleQuestionImageChange = (index, e) => {
    const file = e.target.files[0];
    const newQuestions = [...questions];
    if (!file) {
      newQuestions[index] = { ...newQuestions[index], imageFile: null, imagePreview: '' };
      setQuestions(newQuestions);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError(`File for question ${index + 1} is not an image.`);
      newQuestions[index] = { ...newQuestions[index], imageFile: null, imagePreview: '' };
      setQuestions(newQuestions);
      return;
    }
    
    newQuestions[index] = { ...newQuestions[index], imageFile: file, removeImage: false };
    const reader = new FileReader();
    reader.onloadend = () => {
      newQuestions[index].imagePreview = reader.result;
      setQuestions([...newQuestions]); // Ensure re-render
    };
    reader.readAsDataURL(file);
    setQuestions(newQuestions);
  };

  // Handle removing image for a specific question
  const handleRemoveQuestionImage = (index) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], imageFile: null, imagePreview: '', removeImage: true };
    setQuestions(newQuestions);
  };

  // Add a new blank question form
  const addQuestion = () => {
    if (itemToEdit) { // Disable adding more questions in edit mode for simplicity
        setError("Adding multiple questions is only supported in creation mode.");
        return;
    }
    setQuestions([...questions, {
      type: '', content: '', difficulty: '', language: 'English',
      options: '', correct_answer: '', explanation: '', hint: '',
      imageFile: null, imagePreview: '', removeImage: false,
    }]);
  };

  // Remove a question form
  const removeQuestion = (index) => {
    if (questions.length <= 1) return; // Keep at least one question form
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!knowledgeComponentId && !itemToEdit) { // itemToEdit implies KC is already set or part of the single item
        setError('Knowledge Component is required.');
        setLoading(false);
        return;
    }

    try {
      const submitData = new FormData();
      submitData.append('knowledge_component_id', knowledgeComponentId);

      // If editing a single item
      if (itemToEdit) {
        const question = questions[0];
        if (!question.type || !question.content) {
          throw new Error('Type and Content are required for the question.');
        }
        Object.keys(question).forEach(key => {
          if (key !== 'imageFile' && key !== 'imagePreview' && question[key] !== undefined && question[key] !== null) {
            submitData.append(key, question[key]);
          }
        });
        if (question.removeImage) {
          submitData.append('removeImage', 'true');
        }
        if (question.imageFile) {
          submitData.append('image', question.imageFile);
        }
        
        const response = await axios.put(`/api/admin/content-items/${itemToEdit.id}`, submitData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        onSuccess(response.data);

      } else { // Creating new items (potentially multiple)
        const questionsPayload = [];
        questions.forEach((q, index) => {
          if (!q.type || !q.content) {
            throw new Error(`Type and Content are required for question ${index + 1}.`);
          }
          const questionData = { ...q };
          delete questionData.imageFile; // Handled by FormData separately
          delete questionData.imagePreview;
          questionsPayload.push(questionData);

          // Append image file with a unique key if it exists
          if (q.imageFile) {
            submitData.append(`image_${index}`, q.imageFile);
          }
        });
        submitData.append('questions', JSON.stringify(questionsPayload));

        const response = await axios.post('/api/admin/content-items/bulk', submitData, { // Changed endpoint for bulk
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        onSuccess(response.data); // Expecting an array or summary
      }
    } catch (err) {
      console.error("Error saving content item(s):", err);
      setError(err.message || err.response?.data?.error || 'Failed to save content item(s)');
    } finally {
      setLoading(false);
    }
  };
  
  // Get field help text based on question type
  const getFieldHelpText = (questionType, fieldName) => {
    if (fieldName === 'options' && questionType === 'multiple_choice') {
      return 'Enter options as a JSON array, e.g., ["Option A", "Option B", "Option C"]';
    }
    if (fieldName === 'correct_answer') {
      if (questionType === 'multiple_choice') {
        return 'Enter the correct option exactly as it appears in the options array';
      }
      if (questionType === 'fill_in_blank') {
        return 'Enter the exact text that should fill the blank';
      }
    }
    return '';
  };
  
  return (
    <div className="admin-content-form">
      <h3>{itemToEdit ? 'Edit Question' : 'Create New Questions'}</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Knowledge Component (common for all questions if creating) */}
        <div className="form-group">
          <label htmlFor="knowledge_component_id">Knowledge Component: *</label>
          <select
            id="knowledge_component_id"
            name="knowledge_component_id"
            value={knowledgeComponentId}
            onChange={(e) => setKnowledgeComponentId(e.target.value)}
            required
            className="form-control"
            // disabled={!!itemToEdit} // Allow editing KC even when itemToEdit is present
          >
            <option value="">-- Select Knowledge Component --</option>
            {knowledgeComponents.map(kc => (
              <option key={kc.id} value={kc.id}>
                {kc.name} (Grade {kc.grade_level})
              </option>
            ))}
          </select>
        </div>

        {questions.map((question, index) => (
          <div key={index} className="question-block">
            <h4>Question {index + 1}</h4>
            {questions.length > 1 && !itemToEdit && (
              <button 
                type="button" 
                onClick={() => removeQuestion(index)}
                className="remove-question-button"
              >
                Remove This Question
              </button>
            )}

            {/* Question Type */}
            <div className="form-group">
              <label htmlFor={`type-${index}`}>Question Type: *</label>
              <select
                id={`type-${index}`}
                name="type"
                value={question.type}
                onChange={(e) => handleQuestionChange(index, e)}
                required
                className="form-control"
              >
                <option value="">-- Select Type --</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="fill_in_blank">Fill in Blank</option>
                <option value="question">Open Question</option>
              </select>
            </div>
            
            {/* Question Content */}
            <div className="form-group">
              <label htmlFor={`content-${index}`}>Question Content: *</label>
              <textarea
                id={`content-${index}`}
                name="content"
                value={question.content}
                onChange={(e) => handleQuestionChange(index, e)}
                rows="4"
                required
                className="form-control"
                placeholder="Enter the question text here"
              />
            </div>
            
            {/* Image Upload */}
            <div className="form-group">
              <label htmlFor={`image-${index}`}>Question Image:</label>
              <input
                type="file"
                id={`image-${index}`}
                accept="image/*"
                onChange={(e) => handleQuestionImageChange(index, e)}
                className="form-control"
              />
              {question.imagePreview && (
                <div className="image-preview">
                  <img 
                    src={question.imagePreview.startsWith('data:') || question.imagePreview.startsWith('/') ? question.imagePreview : `${question.imagePreview}`} 
                    alt={`Question ${index + 1} preview`}
                    style={{ maxWidth: '300px', maxHeight: '200px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveQuestionImage(index)}
                    className="remove-image-button"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
            
            {/* Hint */}
            <div className="form-group">
              <label htmlFor={`hint-${index}`}>Hint:</label>
              <textarea
                id={`hint-${index}`}
                name="hint"
                value={question.hint}
                onChange={(e) => handleQuestionChange(index, e)}
                rows="2"
                className="form-control"
                placeholder="Enter a hint for students who are struggling with this question"
              />
            </div>
            
            {/* Options (for multiple choice) */}
            {question.type === 'multiple_choice' && (
              <div className="form-group">
                <label htmlFor={`options-${index}`}>Options (JSON format): *</label>
                <textarea
                  id={`options-${index}`}
                  name="options"
                  value={question.options}
                  onChange={(e) => handleQuestionChange(index, e)}
                  rows="4"
                  className="form-control"
                  placeholder='e.g., ["Option A", "Option B", "Option C"]'
                  required
                />
                <small className="help-text">{getFieldHelpText(question.type, 'options')}</small>
              </div>
            )}
            
            {/* Correct Answer */}
            <div className="form-group">
              <label htmlFor={`correct_answer-${index}`}>Correct Answer: *</label>
              <input
                type="text"
                id={`correct_answer-${index}`}
                name="correct_answer"
                value={question.correct_answer}
                onChange={(e) => handleQuestionChange(index, e)}
                required
                className="form-control"
                placeholder="Enter the correct answer"
              />
              <small className="help-text">{getFieldHelpText(question.type, 'correct_answer')}</small>
            </div>
            
            {/* Explanation */}
            <div className="form-group">
              <label htmlFor={`explanation-${index}`}>Explanation:</label>
              <textarea
                id={`explanation-${index}`}
                name="explanation"
                value={question.explanation}
                onChange={(e) => handleQuestionChange(index, e)}
                rows="2"
                className="form-control"
                placeholder="Explain why the answer is correct"
              />
            </div>
            
            {/* Difficulty */}
            <div className="form-group">
              <label htmlFor={`difficulty-${index}`}>Difficulty (1-5):</label>
              <input
                type="number"
                id={`difficulty-${index}`}
                name="difficulty"
                value={question.difficulty}
                onChange={(e) => handleQuestionChange(index, e)}
                min="1"
                max="5"
                className="form-control"
              />
            </div>
            
            {/* Language */}
            <div className="form-group">
              <label htmlFor={`language-${index}`}>Language:</label>
              <input
                type="text"
                id={`language-${index}`}
                name="language"
                value={question.language}
                onChange={(e) => handleQuestionChange(index, e)}
                className="form-control"
              />
            </div>
          </div>
        ))}
        
        {!itemToEdit && (
          <button 
            type="button" 
            onClick={addQuestion}
            className="add-question-button"
            disabled={loading}
          >
            Add Another Question
          </button>
        )}
        
        {/* Error message */}
        {error && <div className="error-message">{error}</div>}
        
        {/* Form buttons */}
        <div className="form-buttons">
          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Saving...' : (itemToEdit ? 'Update Question' : 'Create Question')}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminContentItemForm;
