import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PDFContentUploader.css';

/**
 * PDF Content Uploader Component
 * 
 * This component allows teachers to upload PDF curriculum documents,
 * review extracted content, and create knowledge components and content items.
 */
const PDFContentUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [currentUpload, setCurrentUpload] = useState(null);
  const [extractedKCs, setExtractedKCs] = useState([]);
  const [extractedContent, setExtractedContent] = useState([]);
  const [selectedKCs, setSelectedKCs] = useState({});
  const [selectedContent, setSelectedContent] = useState({});
  const [creatingKCs, setCreatingKCs] = useState(false);
  const [creatingContent, setCreatingContent] = useState(false);
  const [step, setStep] = useState('upload'); // upload, review, create-kcs, create-content, complete
  
  const navigate = useNavigate();
  
  // Fetch previous uploads when component mounts
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await axios.get('/api/pdf-content/uploads');
        setUploads(response.data);
      } catch (err) {
        console.error('Error fetching uploads:', err);
        setError('Failed to load previous uploads');
      }
    };
    
    fetchUploads();
  }, []);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a PDF file');
    }
  };
  
  // Handle file upload and processing
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('curriculum', file);
    
    try {
      // Upload and process the PDF
      setProcessing(true);
      const response = await axios.post('/api/pdf-content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Set extracted data for review
      setCurrentUpload(response.data);
      setExtractedKCs(response.data.extracted_kcs);
      setExtractedContent(response.data.extracted_content_items);
      
      // Initialize selected items (all selected by default)
      const kcSelections = {};
      response.data.extracted_kcs.forEach(kc => {
        kcSelections[kc.name] = true;
      });
      setSelectedKCs(kcSelections);
      
      const contentSelections = {};
      response.data.extracted_content_items.forEach(item => {
        contentSelections[item.content] = true;
      });
      setSelectedContent(contentSelections);
      
      // Move to review step
      setStep('review');
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload and process PDF');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };
  
  // Handle KC selection toggle
  const handleKCToggle = (kcName) => {
    setSelectedKCs(prev => ({
      ...prev,
      [kcName]: !prev[kcName]
    }));
  };
  
  // Handle content selection toggle
  const handleContentToggle = (content) => {
    setSelectedContent(prev => ({
      ...prev,
      [content]: !prev[content]
    }));
  };
  
  // Create knowledge components from selected extracted items
  const handleCreateKCs = async () => {
    setCreatingKCs(true);
    setError(null);
    
    try {
      // Filter selected KCs
      const selectedKCsList = extractedKCs.filter(kc => selectedKCs[kc.name]);
      
      // Submit selected KCs for creation
      const response = await axios.post('/api/pdf-content/create-kcs', {
        upload_id: currentUpload.upload_id,
        knowledge_components: selectedKCsList
      });
      
      // Move to content creation step
      setStep('create-content');
      setCreatingKCs(false);
      
      // Update extracted content with created KC IDs
      // This maps extracted content to actual KCs in the database
      const createdKCs = response.data.knowledge_components;
      const updatedContent = extractedContent.map(item => {
        // Try to find a matching KC by name
        if (item.knowledge_component_id === null && item.relevantKC) {
          const matchedKC = createdKCs.find(kc => kc.name === item.relevantKC.name);
          if (matchedKC) {
            return {
              ...item,
              knowledge_component_id: matchedKC.id
            };
          }
        }
        return item;
      });
      
      setExtractedContent(updatedContent);
    } catch (error) {
      console.error('Error creating KCs:', error);
      setError(error.response?.data?.error || 'Failed to create knowledge components');
      setCreatingKCs(false);
    }
  };
  
  // Create content items from selected extracted items
  const handleCreateContent = async () => {
    setCreatingContent(true);
    setError(null);
    
    try {
      // Filter selected content items
      const selectedContentList = extractedContent.filter(
        item => selectedContent[item.content] && item.knowledge_component_id
      );
      
      // Submit selected content for creation
      const response = await axios.post('/api/pdf-content/create-content-items', {
        upload_id: currentUpload.upload_id,
        content_items: selectedContentList
      });
      
      // Move to completion step
      setStep('complete');
      setCreatingContent(false);
    } catch (error) {
      console.error('Error creating content items:', error);
      setError(error.response?.data?.error || 'Failed to create content items');
      setCreatingContent(false);
    }
  };
  
  // Handle navigation to content management
  const handleGoToContent = () => {
    navigate('/teacher/content');
  };
  
  // Reset the form for a new upload
  const handleReset = () => {
    setFile(null);
    setCurrentUpload(null);
    setExtractedKCs([]);
    setExtractedContent([]);
    setSelectedKCs({});
    setSelectedContent({});
    setStep('upload');
    setError(null);
  };
  
  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="pdf-upload-container">
            <h2>Upload PDF Curriculum</h2>
            <div className="file-input-container">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                id="pdf-file-input"
              />
              <label htmlFor="pdf-file-input" className="file-input-label">
                {file ? file.name : 'Choose PDF file'}
              </label>
            </div>
            
            {file && (
              <div className="selected-file">
                <span>Selected: {file.name}</span>
                <span>({Math.round(file.size / 1024)} KB)</span>
              </div>
            )}
            
            <button 
              className="upload-button"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload & Process'}
            </button>
            
            {processing && (
              <div className="processing-indicator">
                <div className="spinner"></div>
                <p>Processing PDF content. This may take a moment...</p>
              </div>
            )}
            
            {uploads.length > 0 && (
              <div className="previous-uploads">
                <h3>Previous Uploads</h3>
                <div className="uploads-list">
                  {uploads.map(upload => (
                    <div className="upload-item" key={upload.id}>
                      <span>{upload.filename}</span>
                      <span className={`status status-${upload.status}`}>{upload.status}</span>
                      <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'review':
        return (
          <div className="pdf-review-container">
            <h2>Review Extracted Content</h2>
            <p>The system has extracted the following content from your PDF. Please review and select what you'd like to create.</p>
            
            <div className="extraction-summary">
              <div>
                <strong>File:</strong> {file.name}
              </div>
              <div>
                <strong>Knowledge Components:</strong> {extractedKCs.length} extracted
              </div>
              <div>
                <strong>Content Items:</strong> {extractedContent.length} extracted
              </div>
            </div>
            
            <div className="extracted-content-section">
              <h3>Knowledge Components</h3>
              <div className="select-actions">
                <button onClick={() => {
                  const newSelection = {};
                  extractedKCs.forEach(kc => { newSelection[kc.name] = true; });
                  setSelectedKCs(newSelection);
                }}>Select All</button>
                <button onClick={() => {
                  const newSelection = {};
                  extractedKCs.forEach(kc => { newSelection[kc.name] = false; });
                  setSelectedKCs(newSelection);
                }}>Deselect All</button>
              </div>
              
              <div className="extracted-items-list">
                {extractedKCs.map((kc, index) => (
                  <div className="extracted-item" key={index}>
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedKCs[kc.name] || false}
                        onChange={() => handleKCToggle(kc.name)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="item-details">
                      <div className="item-name">{kc.name}</div>
                      <div className="item-description">{kc.description}</div>
                      {kc.score && <div className="item-score">Confidence: {Math.round(kc.score * 100)}%</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="review-actions">
              <button onClick={handleReset} className="secondary-button">Cancel</button>
              <button 
                onClick={handleCreateKCs} 
                disabled={!Object.values(selectedKCs).some(Boolean) || creatingKCs}
                className="primary-button"
              >
                {creatingKCs ? 'Creating...' : 'Create Knowledge Components'}
              </button>
            </div>
          </div>
        );
        
      case 'create-content':
        return (
          <div className="pdf-content-container">
            <h2>Create Content Items</h2>
            <p>Select the content items you want to create and associate with knowledge components.</p>
            
            <div className="select-actions">
              <button onClick={() => {
                const newSelection = {};
                extractedContent.forEach(item => { newSelection[item.content] = true; });
                setSelectedContent(newSelection);
              }}>Select All</button>
              <button onClick={() => {
                const newSelection = {};
                extractedContent.forEach(item => { newSelection[item.content] = false; });
                setSelectedContent(newSelection);
              }}>Deselect All</button>
            </div>
            
            <div className="extracted-items-list">
              {extractedContent.map((item, index) => (
                <div 
                  className={`extracted-item ${!item.knowledge_component_id ? 'error-item' : ''}`} 
                  key={index}
                >
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedContent[item.content] || false}
                      onChange={() => handleContentToggle(item.content)}
                      disabled={!item.knowledge_component_id}
                    />
                    <span className="checkmark"></span>
                  </label>
                  <div className="item-details">
                    <div className="item-type">{item.type}</div>
                    <div className="item-content">{item.content}</div>
                    <div className="item-difficulty">Difficulty: {item.difficulty}</div>
                    {!item.knowledge_component_id && (
                      <div className="item-error">No associated knowledge component</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="review-actions">
              <button onClick={() => setStep('review')} className="secondary-button">Back</button>
              <button 
                onClick={handleCreateContent} 
                disabled={!Object.values(selectedContent).some(Boolean) || creatingContent}
                className="primary-button"
              >
                {creatingContent ? 'Creating...' : 'Create Content Items'}
              </button>
            </div>
          </div>
        );
        
      case 'complete':
        return (
          <div className="pdf-complete-container">
            <h2>Content Creation Complete</h2>
            <div className="completion-message">
              <p>Your PDF curriculum has been successfully processed and the content has been created.</p>
              <div className="completion-summary">
                <div className="summary-item">
                  <span className="summary-icon">✓</span>
                  <span className="summary-text">PDF processed successfully</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">✓</span>
                  <span className="summary-text">Knowledge components created</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">✓</span>
                  <span className="summary-text">Content items created and linked to knowledge components</span>
                </div>
              </div>
            </div>
            
            <div className="completion-actions">
              <button onClick={handleReset} className="secondary-button">Upload Another PDF</button>
              <button onClick={handleGoToContent} className="primary-button">Go to Content Management</button>
            </div>
          </div>
        );
        
      default:
        return <div>Invalid step</div>;
    }
  };
  
  return (
    <div className="pdf-content-uploader">
      {error && <div className="error-message">{error}</div>}
      {renderStep()}
    </div>
  );
};

export default PDFContentUploader;
