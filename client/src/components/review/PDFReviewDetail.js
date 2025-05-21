import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReviewDetails, markReviewComplete, createManualContentItem, createManualKnowledgeComponent } from '../../services/reviewService';
// Import the actual review item components
import KnowledgeComponentReviewItem from './KnowledgeComponentReviewItem';
import ContentItemReviewItem from './ContentItemReviewItem';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PDFReviewDetail.css';
import './ReviewItem.css'; // Import shared item styles

// Configure PDF.js worker to use the locally hosted file
// Ensure pdf.worker.min.mjs is copied to the public folder
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

function PDFReviewDetail() {
  const { pdfId } = useParams(); // Get pdfId from URL
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [approvedKCs, setApprovedKCs] = useState([]); // State for approved KCs for linking
  // Add state for manual creation forms if needed later
  // const [showManualKCForm, setShowManualKCForm] = useState(false);
  // const [showManualItemForm, setShowManualItemForm] = useState(false);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReviewDetails(pdfId);
      setReviewData(data);
      setCurrentPage(1);
      setNumPages(null);
      // TODO: Fetch *approved* KCs associated with this PDF or globally?
      // For now, let's assume we get *all* KCs from the review data (pending & approved)
      // Or make a separate API call if needed. Placeholder:
      // const fetchedApprovedKCs = await someApiService.getApprovedKCs();
      // setApprovedKCs(fetchedApprovedKCs);
      // For demo, let's just use the pending ones + imagine some are approved
      setApprovedKCs(data.pendingKnowledgeComponents || []); // Placeholder
    } catch (err) {
      setError(err.message || `Failed to fetch review details for PDF ${pdfId}.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [pdfId]); // Dependency on pdfId

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]); // Fetch details when component mounts or pdfId changes

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const handleCompleteReview = async () => {
    if (!window.confirm('Are you sure you want to mark this review as complete? Any remaining pending suggestions will be rejected.')) {
      return;
    }
    setIsLoading(true); // Indicate loading state
    try {
      await markReviewComplete(pdfId);
      alert('Review marked as complete!');
      navigate('/reviews'); // Navigate back to the list after completion
    } catch (err) {
      setError(err.message || 'Failed to mark review as complete.');
      console.error(err);
      setIsLoading(false); // Stop loading on error
    }
    // No finally setIsLoading(false) here, as we navigate away on success
  };

  // Callback for when an item/kc is updated/approved or rejected/deleted
  const handleItemUpdate = () => {
    // Re-fetch details to update the lists
    console.log("Item updated/rejected, refreshing details...");
    fetchDetails();
  };

  // TODO: Implement handlers for manual creation forms
  // const handleAddManualKC = async (kcData) => { ... call createManualKnowledgeComponent ... handleItemUpdate() ... }
  // const handleAddManualItem = async (itemData) => { ... call createManualContentItem ... handleItemUpdate() ... }

  if (isLoading) {
    return <div className="review-detail-loading">Loading review details...</div>;
  }

  if (error) {
    return <div className="error-message review-detail-error">Error: {error}</div>;
  }

  if (!reviewData) {
    return <div className="review-detail-container">No review data found.</div>;
  }

  const { uploadDetails, pendingKnowledgeComponents, pendingContentItems } = reviewData;

  // Construct the PDF file path (assuming it's served statically or via a specific route)
  // IMPORTANT: Adjust this based on how your backend serves the uploaded files.
  // This example assumes files in 'uploads/pdf' are accessible relative to the server root.
  // You might need a dedicated route like '/api/uploads/pdf/:filename'
  // Extract the actual filename (including prefix) from the full filepath stored in the DB
  const actualFilename = uploadDetails.filepath ? uploadDetails.filepath.split(/[\\/]/).pop() : null;
  const pdfFilePath = actualFilename ? `/uploads/pdf/${actualFilename}` : null; // Use the actual filename

  return (
    <div className="review-detail-container">
      <h2>Reviewing PDF: {uploadDetails.filename}</h2>
      <p>Uploaded by: {uploadDetails.uploader?.first_name} {uploadDetails.uploader?.last_name} on {new Date(uploadDetails.createdAt).toLocaleDateString()}</p>
      
      <div className="review-layout">
        {/* PDF Viewer Section */}
        <div className="pdf-viewer-section">
          <h3>PDF Document</h3>
          <div className="pdf-document-view">
            <Document
              file={pdfFilePath}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(pdfError) => setError(`Failed to load PDF: ${pdfError.message}`)}
              options={{ workerSrc: pdfjs.GlobalWorkerOptions.workerSrc }}
            >
              <Page pageNumber={currentPage} />
            </Document>
          </div>
          {numPages && (
            <div className="pdf-pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                Previous
              </button>
              <span> Page {currentPage} of {numPages} </span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= numPages}>
                Next
              </button>
            </div>
          )}
        </div>

        {/* Review Items Section */}
        <div className="review-items-section">
          <div className="review-column">
            <h3>Suggested Knowledge Components ({pendingKnowledgeComponents.length})</h3>
            {pendingKnowledgeComponents.length > 0 ? (
              pendingKnowledgeComponents.map(kc => (
                <KnowledgeComponentReviewItem
                  key={kc.id}
                  kc={kc}
                  pdfUploadId={pdfId}
                  onUpdate={handleItemUpdate} // Pass callback
                  onReject={handleItemUpdate} // Pass callback (can differentiate if needed)
                />
              ))
            ) : (
              <p>No pending knowledge component suggestions.</p>
            )}
             {/* TODO: Add button/form for manual KC creation */}
             {/* <button onClick={() => setShowManualKCForm(true)} className="add-manual-button">Add Manual KC</button> */}
             {/* {showManualKCForm && <ManualKCForm onSubmit={handleAddManualKC} onCancel={() => setShowManualKCForm(false)} pdfUploadId={pdfId} />} */}
             <button disabled className="add-manual-button">Add Manual KC</button>
          </div>

          <div className="review-column">
            <h3>Suggested Content Items ({pendingContentItems.length})</h3>
            {pendingContentItems.length > 0 ? (
              pendingContentItems.map(item => (
                <ContentItemReviewItem
                  key={item.id}
                  item={item}
                  pdfUploadId={pdfId}
                  availableKCs={approvedKCs} // Pass available KCs for linking
                  onUpdate={handleItemUpdate} // Pass callback
                  onReject={handleItemUpdate} // Pass callback
                />
              ))
            ) : (
              <p>No pending content item suggestions.</p>
            )}
             {/* TODO: Add button/form for manual Item creation */}
             {/* <button onClick={() => setShowManualItemForm(true)} className="add-manual-button">Add Manual Item</button> */}
             {/* {showManualItemForm && <ManualItemForm onSubmit={handleAddManualItem} onCancel={() => setShowManualItemForm(false)} pdfUploadId={pdfId} availableKCs={approvedKCs} />} */}
             <button disabled className="add-manual-button">Add Manual Item</button>
          </div>
        </div>
      </div>

      <div className="review-actions-footer">
         <button onClick={handleCompleteReview} className="complete-review-button" disabled={isLoading}>
           Mark Review as Complete
         </button>
      </div>
    </div>
  );
}

export default PDFReviewDetail;