import axios from 'axios'; // Assuming axios is used for API calls

// Base URL for the API - adjust if needed
const API_BASE_URL = '/api'; // Or your specific API prefix

// Helper to get authorization headers (assuming token-based auth)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // Adjust based on your auth implementation
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetches PDF uploads pending review.
 */
export const getPendingReviews = async () => {
  try {
    // Correct the endpoint URL to match the backend route registration
    const response = await axios.get(`${API_BASE_URL}/pdf-content/reviews/pending`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pending reviews:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch pending reviews');
  }
};

/**
 * Fetches details for a specific PDF review.
 * @param {number|string} pdfId - The ID of the PdfUpload record.
 */
export const getReviewDetails = async (pdfId) => {
  try {
    // Correct the endpoint URL to match the backend route registration
    const response = await axios.get(`${API_BASE_URL}/pdf-content/reviews/pdf/${pdfId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching review details for PDF ${pdfId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch review details');
  }
};

/**
 * Updates and approves a suggested Content Item.
 * @param {number|string} itemId - The ID of the ContentItem.
 * @param {object} itemData - The updated data for the item (content, type, difficulty, options, etc.).
 */
export const updateApproveContentItem = async (itemId, itemData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/pdf-content/reviews/content-item/${itemId}`, itemData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating content item ${itemId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update content item');
  }
};

/**
 * Updates and approves a suggested Knowledge Component.
 * @param {number|string} kcId - The ID of the KnowledgeComponent.
 * @param {object} kcData - The updated data for the KC (name, description, etc.).
 */
export const updateApproveKnowledgeComponent = async (kcId, kcData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/pdf-content/reviews/kc/${kcId}`, kcData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating knowledge component ${kcId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update knowledge component');
  }
};

/**
 * Rejects (deletes) a suggested Content Item.
 * @param {number|string} itemId - The ID of the ContentItem suggestion.
 */
export const rejectDeleteContentItem = async (itemId) => {
  try {
    await axios.delete(`${API_BASE_URL}/pdf-content/reviews/content-item/${itemId}`, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error(`Error deleting content item suggestion ${itemId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to delete content item suggestion');
  }
};

/**
 * Rejects (deletes) a suggested Knowledge Component.
 * @param {number|string} kcId - The ID of the KnowledgeComponent suggestion.
 */
export const rejectDeleteKnowledgeComponent = async (kcId) => {
  try {
    await axios.delete(`${API_BASE_URL}/pdf-content/reviews/kc/${kcId}`, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error(`Error deleting knowledge component suggestion ${kcId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to delete knowledge component suggestion');
  }
};

/**
 * Creates a new Content Item manually.
 * @param {object} itemData - Data for the new item (content, type, pdf_upload_id, etc.).
 */
export const createManualContentItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/pdf-content/reviews/content-item`, itemData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating manual content item:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to create manual content item');
  }
};

/**
 * Creates a new Knowledge Component manually.
 * @param {object} kcData - Data for the new KC (name, pdf_upload_id, etc.).
 */
export const createManualKnowledgeComponent = async (kcData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/pdf-content/reviews/kc`, kcData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating manual knowledge component:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to create manual knowledge component');
  }
};

/**
 * Marks the review process for a PDF as complete.
 * @param {number|string} pdfId - The ID of the PdfUpload record.
 */
export const markReviewComplete = async (pdfId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/pdf-content/reviews/pdf/${pdfId}/complete`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error marking review complete for PDF ${pdfId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to mark review complete');
  }
};