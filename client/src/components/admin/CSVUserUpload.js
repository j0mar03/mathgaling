import React, { useState, useRef } from 'react';
import axios from 'axios';

const CSVUserUpload = ({ onUsersAdded }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Detect if we're using Netlify functions or Express backend
  const isNetlifyDeployment = process.env.REACT_APP_NETLIFY_DEV || 
                             window.location.hostname.includes('netlify') ||
                             window.location.hostname.includes('vercel');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (validateFile(droppedFile)) {
      setFile(droppedFile);
      setError('');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setError('');
    }
  };

  const validateFile = (file) => {
    if (!file) return false;
    
    // Check file type (must be CSV)
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a CSV file.');
      return false;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadResults(null);
    
    try {
      if (isNetlifyDeployment) {
        // For Netlify/Vercel: Send CSV content as JSON
        const fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
        
        const response = await axios.post('/api/admin/users/csv-upload', {
          csvContent: fileContent
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        setUploadResults(response.data);
      } else {
        // For Express.js backend: Send as FormData (file upload)
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post('/api/admin/users/csv-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setUploadResults(response.data);
      }
      
      // If users were successfully added, notify parent component
      if (response.data.created && response.data.created.length > 0) {
        onUsersAdded();
      }
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setError(err.response?.data?.error || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/api/admin/users/csv-template', {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'user_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading template:', err);
      setError('Failed to download template. Please try again.');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="csv-upload-container">
      <h3>Bulk User Import</h3>

      {!uploadResults ? (
        <>
          <div 
            className={`csv-dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <div className="csv-upload-icon">📄</div>
            <p>Drag and drop a CSV file here, or click to select a file</p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept=".csv" 
              style={{ display: 'none' }}
            />
          </div>

          {file && (
            <div className="csv-file-info">
              Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
          
          <div className="csv-template-info">
            <p>Required CSV format: <strong>name, grade_level, username, password</strong></p>
            <p>
              <span className="csv-template-link" onClick={handleDownloadTemplate}>
                📥 Download CSV template
              </span>
            </p>
          </div>
          
          {error && <div className="csv-error-message">{error}</div>}
          
          <div className="csv-buttons">
            <button 
              className="admin-button" 
              onClick={handleUpload} 
              disabled={!file || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Users'}
            </button>
          </div>
        </>
      ) : (
        <div className="csv-results">
          {uploadResults.created && uploadResults.created.length > 0 && (
            <div className="csv-success-message">
              Successfully created {uploadResults.created.length} users.
            </div>
          )}
          
          {uploadResults.errors && uploadResults.errors.length > 0 && (
            <>
              <div className="csv-error-message">
                Failed to create {uploadResults.errors.length} users.
              </div>
              <h4>Errors:</h4>
              <ul className="csv-error-list">
                {uploadResults.errors.map((err, index) => (
                  <li key={index}>
                    {err.row ? `Row ${err.row}` : ''} {err.email}: {err.error}
                  </li>
                ))}
              </ul>
            </>
          )}
          
          <div className="csv-buttons">
            <button className="admin-button" onClick={resetUpload}>
              Upload Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVUserUpload;