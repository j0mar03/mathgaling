import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Assuming React Router is used for navigation
import { getPendingReviews } from '../../services/reviewService';
import './PDFReviewList.css'; // We'll create this next

function PDFReviewList() {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPendingReviews();
        setPendingReviews(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch pending reviews.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="pdf-review-list-container">
      <h2>PDF Content Reviews Pending</h2>

      {isLoading && <p>Loading pending reviews...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!isLoading && !error && (
        <>
          {pendingReviews.length === 0 ? (
            <p>No PDFs are currently awaiting review.</p>
          ) : (
            <ul className="review-list">
              {pendingReviews.map((review) => (
                <li key={review.id} className="review-list-item">
                  <div className="review-item-info">
                    <strong>Filename:</strong> {review.filename} <br />
                    <strong>Uploaded By:</strong> {review.uploader?.name || 'N/A'} <br />
                    <strong>Uploaded At:</strong> {new Date(review.createdAt).toLocaleString()}
                  </div>
                  <div className="review-item-actions">
                    {/* Link to the detailed review page (Route needs to be set up) */}
                    <Link to={`/review/${review.id}`} className="review-button">
                      Start Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default PDFReviewList;