import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../teacher/PDFContentUploader.css';

/**
 * Admin PDF Uploader Component
 * 
 * This component extends the teacher PDF uploader with admin-specific
 * features for managing all PDF content in the system.
 */
const AdminPDFUploader = () => {
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
  const [step, setStep] = useState('upload');
  const [viewMode, setViewMode] = useState('list'); // list, detail, upload
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [uploadDetails, setUploadDetails] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const navigate = useNavigate();
  const { token } = useAuth(); // Get authentication token
  
  // Fetch all uploads when component mounts
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await axios.get('/api/admin/pdf-content/uploads', {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        });
        setUploads(response.data);
      } catch (err) {
        console.error('Error fetching uploads:', err);
        setError(`Failed to load PDF uploads: ${err.response?.data?.error || err.message}`);
      }
    };
    
    // Only fetch if token is available
    if (token) {
      fetchUploads();
    }
  }, [viewMode, token]); // Refetch when returning to list view or token changes
  
  // Fetch upload details when an upload is selected
  useEffect(() => {
    if (selectedUploadId && viewMode === 'detail') {
      const fetchUploadDetails = async () => {
        try {
          const response = await axios.get(`/api/admin/pdf-content/uploads/${selectedUploadId}`, {
            headers: { 
              Authorization: `Bearer ${token}` 
            }
          });
          setUploadDetails(response.data);
        } catch (err) {
          console.error('Error fetching upload details:', err);
          setError(`Failed to load upload details: ${err.response?.data?.error || err.message}`);
        }
      };
      
      fetchUploadDetails();
    }
  }, [selectedUploadId, viewMode]);
  
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
      // Upload the PDF via the admin endpoint
      setProcessing(true); // Indicate processing start
      // Use the correct admin endpoint if different, otherwise use the teacher one
      // Use the correct admin-specific endpoint defined in adminPdfContentRoutes.js
      const response = await axios.post('/api/admin/pdf-content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      // Check for 202 Accepted status
      if (response.status === 202) {
        // Success: Upload accepted, processing started in background
        alert(`Upload successful! PDF "${file.name}" is being processed. You can monitor its status or start the review later from the PDF Review list.`);
        setFile(null); // Clear the file input
        setCurrentUpload(null); // Clear any previous upload state
        setStep('upload'); // Reset step
        setViewMode('list'); // Navigate back to the list view
        // Optionally navigate programmatically: navigate('/admin'); or navigate('/reviews');
      } else {
        // Handle unexpected success responses if necessary
        console.warn("Upload endpoint returned unexpected status:", response.status);
        setError("Upload completed but received an unexpected status from the server.");
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };
  
  // Create knowledge components from selected extracted items
  const handleCreateKCs = async () => {
    setCreatingKCs(true);
    setError(null);
    
    try {
      // Filter selected KCs
      const selectedKCsList = extractedKCs.filter(kc => selectedKCs[kc.name]);
      
      // Submit selected KCs for creation
      const response = await axios.post('/api/admin/pdf-content/create-kcs', {
        upload_id: currentUpload.upload_id,
        knowledge_components: selectedKCsList
      }, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      // Move to content creation step
      setStep('create-content');
      setCreatingKCs(false);
      
      // Update extracted content with created KC IDs
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
      const response = await axios.post('/api/admin/pdf-content/create-content-items', {
        upload_id: currentUpload.upload_id,
        content_items: selectedContentList
      }, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
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
  
  // Handle view mode changes
  const handleViewUploadDetails = (id) => {
    setSelectedUploadId(id);
    setViewMode('detail');
  };
  
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUploadId(null);
    setUploadDetails(null);
  };
  
  const handleStartNewUpload = () => {
    setViewMode('upload');
    setFile(null);
    setCurrentUpload(null);
    setExtractedKCs([]);
    setExtractedContent([]);
    setSelectedKCs({});
    setSelectedContent({});
    setStep('upload');
    setError(null);
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
  
  // Handle deletion of a PDF upload
  const handleDeleteUpload = async () => {
    if (!deleteId) return;
    
    try {
      await axios.delete(`/api/admin/pdf-content/uploads/${deleteId}`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      setDeleteConfirm(false);
      setDeleteId(null);
      
      // If in detail view of the deleted upload, go back to list
      if (viewMode === 'detail' && selectedUploadId === deleteId) {
        handleBackToList();
      } else {
        // Just refresh the list
        const response = await axios.get('/api/admin/pdf-content/uploads', {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        });
        setUploads(response.data);
      }
    } catch (error) {
      console.error('Error deleting upload:', error);
      setError('Failed to delete upload: ' + (error.response?.data?.error || error.message));
    }
  };
  
  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteConfirm(true);
  };
  
  // Render list view (all uploads)
  const renderListView = () => {
    return (
      <div className="admin-pdf-list">
        <div className="admin-header">
          <h2>PDF Curriculum Content Management</h2>
          <button 
            className="primary-button" 
            onClick={handleStartNewUpload}
          >
            Upload New PDF
          </button>
        </div>
        
        {uploads.length === 0 ? (
          <div className="empty-state">
            <p>No PDF uploads found in the system.</p>
          </div>
        ) : (
          <div className="uploads-table">
            <div className="table-header">
              <div className="col-filename">Filename</div>
              <div className="col-status">Status</div>
              <div className="col-teacher">Uploaded By</div>
              <div className="col-date">Date</div>
              <div className="col-actions">Actions</div>
            </div>
            {uploads.map(upload => (
              <div className="table-row" key={upload.id}>
                <div className="col-filename">{upload.filename}</div>
                <div className="col-status">
                  <span className={`status status-${upload.status}`}>{upload.status}</span>
                </div>
                <div className="col-teacher">{upload.uploader?.name || "Unknown"}</div>
                <div className="col-date">{new Date(upload.createdAt).toLocaleDateString()}</div>
                <div className="col-actions">
                  <button 
                    className="action-button view-button"
                    onClick={() => handleViewUploadDetails(upload.id)}
                  >
                    View
                  </button>
                  <button 
                    className="action-button delete-button"
                    onClick={() => confirmDelete(upload.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {deleteConfirm && (
          <div className="delete-modal">
            <div className="delete-modal-content">
              <h3>Confirm Deletion</h3>
              <p>This will permanently delete the PDF upload and all associated knowledge components and content items. This action cannot be undone.</p>
              <div className="delete-modal-actions">
                <button 
                  className="secondary-button"
                  onClick={() => {
                    setDeleteConfirm(false);
                    setDeleteId(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="delete-button"
                  onClick={handleDeleteUpload}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render detail view (single upload)
  const renderDetailView = () => {
    if (!uploadDetails) {
      return <div className="loading">Loading upload details...</div>;
    }
    
    const { upload, knowledge_components, content_items } = uploadDetails;
    
    return (
      <div className="admin-pdf-detail">
        <div className="admin-header">
          <button className="back-button" onClick={handleBackToList}>
            &larr; Back to All Uploads
          </button>
          <button 
            className="delete-button"
            onClick={() => confirmDelete(upload.id)}
          >
            Delete Upload
          </button>
        </div>
        
        <div className="pdf-detail-header">
          <h2>PDF Upload Details</h2>
          <div className="pdf-meta">
            <div><strong>Filename:</strong> {upload.filename}</div>
            <div><strong>Status:</strong> <span className={`status status-${upload.status}`}>{upload.status}</span></div>
            <div><strong>Uploader:</strong> {upload.uploader?.name || "Unknown"}</div>
            <div><strong>Upload Date:</strong> {new Date(upload.createdAt).toLocaleString()}</div>
            <div><strong>Pages:</strong> {upload.page_count}</div>
          </div>
        </div>
        
        <div className="detail-sections">
          <div className="detail-section">
            <h3>Knowledge Components ({knowledge_components.length})</h3>
            {knowledge_components.length === 0 ? (
              <p>No knowledge components created from this PDF.</p>
            ) : (
              <div className="detail-list">
                {knowledge_components.map(kc => (
                  <div className="detail-item" key={kc.id}>
                    <div><strong>Name:</strong> {kc.name}</div>
                    <div><strong>Description:</strong> {kc.description}</div>
                    {kc.curriculum_code && <div><strong>Code:</strong> {kc.curriculum_code}</div>}
                    {kc.grade_level && <div><strong>Grade:</strong> {kc.grade_level}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="detail-section">
            <h3>Content Items ({content_items.length})</h3>
            {content_items.length === 0 ? (
              <p>No content items created from this PDF.</p>
            ) : (
              <div className="detail-list">
                {content_items.map(item => (
                  <div className="detail-item" key={item.id}>
                    <div className="item-type">{item.type}</div>
                    <div><strong>Content:</strong> {item.content}</div>
                    <div><strong>Difficulty:</strong> {item.difficulty}</div>
                    <div><strong>KC ID:</strong> {item.knowledge_component_id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {deleteConfirm && (
          <div className="delete-modal">
            <div className="delete-modal-content">
              <h3>Confirm Deletion</h3>
              <p>This will permanently delete the PDF upload and all associated knowledge components and content items. This action cannot be undone.</p>
              <div className="delete-modal-actions">
                <button 
                  className="secondary-button"
                  onClick={() => {
                    setDeleteConfirm(false);
                    setDeleteId(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="delete-button"
                  onClick={handleDeleteUpload}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render upload view (same as teacher's but with admin endpoints)
  const renderUploadView = () => {
    const renderUploadStep = () => {
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
        </div>
      );
    };
    
    const renderReviewStep = () => {
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
            <button onClick={handleBackToList} className="secondary-button">Cancel</button>
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
    };
    
    const renderCreateContentStep = () => {
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
    };
    
    const renderCompleteStep = () => {
      return (
        <div className="pdf-complete-container">
          <h2>Content Creation Complete</h2>
          <div className="completion-message">
            <p>The PDF curriculum has been successfully processed and the content has been created.</p>
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
            <button onClick={handleStartNewUpload} className="secondary-button">Upload Another PDF</button>
            <button onClick={handleBackToList} className="primary-button">View All Uploads</button>
          </div>
        </div>
      );
    };
    
    let content;
    switch (step) {
      case 'upload':
        content = renderUploadStep();
        break;
      case 'review':
        content = renderReviewStep();
        break;
      case 'create-content':
        content = renderCreateContentStep();
        break;
      case 'complete':
        content = renderCompleteStep();
        break;
      default:
        content = <div>Invalid step</div>;
    }
    
    return (
      <div>
        <div className="admin-header">
          <button className="back-button" onClick={handleBackToList}>
            &larr; Back to All Uploads
          </button>
        </div>
        {content}
      </div>
    );
  };
  
  // Main render
  let content;
  switch (viewMode) {
    case 'list':
      content = renderListView();
      break;
    case 'detail':
      content = renderDetailView();
      break;
    case 'upload':
      content = renderUploadView();
      break;
    default:
      content = <div>Invalid view mode</div>;
  }
  
  return (
    <div className="pdf-content-uploader admin-uploader">
      {error && <div className="error-message">{error}</div>}
      {content}
    </div>
  );
};

export default AdminPDFUploader;
