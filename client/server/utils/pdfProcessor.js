/**
 * PDF Processor Utility - Enhanced for Structured Content Extraction
 * 
 * This utility handles the extraction, parsing, and processing of PDF curriculum documents,
 * focusing on identifying specific sections and extracting structured items within them.
 */

const { PDFExtract } = require('pdf.js-extract');
const pdfExtract = new PDFExtract();
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const natural = require('natural');
const { OpenAI } = require('openai'); // Import OpenAI library
const { ContentItem, KnowledgeComponent, PdfUpload } = require('../models'); // Import Sequelize models
// Configuration options for PDF extraction
const options = {
  // loadImagesWithPDF: true // Consider enabling if OCR is needed later
};

// --- OpenAI Client Initialization ---
// Ensure OPENAI_API_KEY is set in your .env file or environment variables
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.error("FATAL: OPENAI_API_KEY environment variable not set. PDF processing via LLM will fail.");
  // Handle appropriately - maybe throw error or disable LLM feature
}


/**
 * Extracts content from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - Promise resolving to the extracted PDF data
 */
const extractPdfContent = async (filePath) => {
  try {
    console.log(`Extracting content from PDF: ${filePath}`);
    const data = await pdfExtract.extract(filePath, options);
    
    // Add page numbers for easier reference
    data.pages = data.pages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    }));
    
    console.log(`Successfully extracted ${data.pages.length} pages from PDF`);
    return data;
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error(`Failed to extract PDF content: ${error.message}`);
  }
};

// --- LLM-Based Content Extraction ---

// Define known section keywords for the prompt context
const TARGET_SECTIONS = [
  "Subukin", "Balikan", "Tuklasin", "Suriin",
  "Pagyamanin", "Isaisip", "Isagawa", "Tayahin",
  "Karagdagang Gawain"
];

// Mapping from keywords (lowercase) to DB types
const SECTION_TYPE_MAP = {
  'subukin': 'quiz-pre',
  'balikan': 'review',
  'tuklasin': 'discovery',
  'suriin': 'analysis',
  'pagyamanin': 'enrichment',
  'isaisip': 'generalization',
  'isagawa': 'application',
  'tayahin': 'assessment-post',
  'karagdagang gawain': 'additional_activity'
};

/**
 * Creates the system prompt for the OpenAI API call.
 */
const createSystemPrompt = () => {
  // Instructions for the LLM
  return `You are an expert AI assistant specialized in extracting structured content from Filipino educational modules (PDF text). Your task is to identify specific sections and extract all numbered items within them accurately.

Target Section Headers: ${TARGET_SECTIONS.join(', ')}.

For each page of text provided:
1. Identify if any target section headers appear. Determine the section type based on the header (e.g., "Subukin" corresponds to "quiz-pre", "Tayahin" to "assessment-post", "Pagyamanin" to "enrichment", etc.). Use the provided mapping: ${JSON.stringify(SECTION_TYPE_MAP)}. If a header is found but not in the map, use 'unknown'.
2. Within the text belonging to each identified target section, extract all numbered items (e.g., "1.", "2.", etc.).
3. For each numbered item, extract its full text content, potentially spanning multiple lines. Combine lines that logically belong together based on proximity and indentation.
4. Identify if the item is multiple-choice by looking for options like "A.", "B.", "C.", "D." immediately following or associated with the item text.
5. Extract the text of each choice associated with a multiple-choice item.
6. Determine the primary type of the item (e.g., 'multiple-choice', 'fill-in-the-blank', 'computation', 'word-problem', 'instruction', 'open-ended-question'). Default to 'instruction' or 'open-ended-question' if unsure.

Output Format: Respond ONLY with a valid JSON object containing a single key "extractedItems". The value should be an array of objects, where each object represents a structured item found on the page and has the following structure:
{
  "sectionTitle": "string (The exact text of the section header found, e.g., 'Subukin')",
  "sectionType": "string (The corresponding type, e.g., 'quiz-pre', 'assessment-post', 'enrichment')",
  "itemNumber": "number | null (The number of the item, e.g., 1, 2, or null if not numbered)",
  "itemText": "string (The full text of the question or instruction)",
  "itemType": "string (e.g., 'multiple-choice', 'computation', 'instruction')",
  "isMultipleChoice": "boolean",
  "choices": ["string"] | null (Array of choice strings like "A. Choice text", or null if not multiple-choice)
}

If no target sections or structured items are found on a page, return an empty array: {"extractedItems": []}. Do not include explanations or apologies in your response, only the JSON object. Ensure the JSON is valid.`;
};

/**
 * Extracts structured content from a single page's text using OpenAI API.
 * @param {string} pageText - The text content of a single PDF page.
 * @param {number} pageIndex - The 0-based index of the page.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of extracted item objects for the page.
 */
const extractContentWithOpenAI = async (pageText, pageIndex) => {
  if (!openai) {
      console.error("OpenAI client not initialized. Skipping LLM extraction.");
      return [];
  }
  
  // Ensure pageText is a string
  const textContent = typeof pageText === 'string' ? pageText : String(pageText || '');
  
  if (textContent.trim().length < 20) {
    console.log(`Skipping OpenAI call for short/empty page ${pageIndex + 1}`);
    return []; // Skip very short pages
  }

  const systemPrompt = createSystemPrompt();
  // Consider using newer models if available and cost-effective
  // Newer models might support JSON mode directly, simplifying parsing.
  const model = "gpt-3.5-turbo"; // Or "gpt-4", "gpt-4-turbo", etc.

  console.log(`Sending page ${pageIndex + 1} text to OpenAI (${model})...`);

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      // If using a model that supports JSON mode:
      // response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract structured items from the following text from page ${pageIndex + 1}:\n\n${textContent}` }
      ],
      temperature: 0.1, // Low temperature for factual extraction
      // max_tokens: 1500, // Adjust based on expected output size and model limits
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      console.warn(`OpenAI response content was empty for page ${pageIndex + 1}.`);
      return [];
    }

    // Attempt to parse the JSON response
    try {
      // Handle potential markdown code block wrapping ```json ... ```
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStringToParse = jsonMatch ? jsonMatch[1] : responseContent;
      
      const parsedJson = JSON.parse(jsonStringToParse);

      if (parsedJson && Array.isArray(parsedJson.extractedItems)) {
        console.log(`Successfully extracted ${parsedJson.extractedItems.length} items from page ${pageIndex + 1}.`);
        // Add pageIndex to each extracted item for reference when saving
        return parsedJson.extractedItems.map(item => ({ ...item, sourcePageIndex: pageIndex }));
      } else {
        console.warn(`OpenAI response for page ${pageIndex + 1} did not contain a valid 'extractedItems' array. Response:`, responseContent);
        return [];
      }
    } catch (parseError) {
      console.error(`Failed to parse JSON response from OpenAI for page ${pageIndex + 1}:`, parseError);
      console.error("Raw OpenAI Response:", responseContent);
      return []; // Return empty on parsing error
    }

  } catch (apiError) {
    console.error(`Error calling OpenAI API for page ${pageIndex + 1}:`, apiError);
    // Consider more specific error handling (e.g., rate limits, auth errors)
    throw new Error(`OpenAI API error: ${apiError.message}`); // Re-throw to signal processing failure
  }
};


// --- Section Marker Identification --- // Keep this section for now, might be useful for pre-filtering or context


// --- LLM-Based Content Extraction ---
// (Duplicate definitions below will be removed)


/**
 * Extracts text from an image using OCR (Tesseract.js)
 * @param {Buffer|string} imageData - Image data buffer or path to image file
 * @returns {Promise<string>} - Promise resolving to the extracted text
 */
const extractTextFromImage = async (imageData) => {
  try {
    console.log('Starting OCR text extraction from image');
    const worker = await createWorker();
    
    // Configure worker with appropriate settings
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Process the image
    const result = typeof imageData === 'string' 
      ? await worker.recognize(imageData) 
      : await worker.recognize(Buffer.from(imageData));
    
    // Clean up
    await worker.terminate();
    
    console.log('OCR text extraction completed');
    return result.data.text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`OCR text extraction failed: ${error.message}`);
  }
};

/**
 * Identifies section markers within PDF data
 * @param {Object} pdfData - Extracted PDF data
 * @returns {Array<Object>} - Array of identified section markers
 */
const identifySectionMarkers = (pdfData) => {
  if (!pdfData || !pdfData.pages) {
    console.warn('No PDF data provided for section marker identification');
    return [];
  }
  
  // Simple placeholder implementation - replace with actual implementation
  // This should identify section headers like "Subukin", "Balikan", etc.
  const markers = [];
  
  pdfData.pages.forEach((page, pageIndex) => {
    // For each page, look for target sections in the text content
    if (page.content) {
      TARGET_SECTIONS.forEach(sectionKeyword => {
        // Simple detection - could be enhanced with NLP or regex patterns
        if (page.content.includes(sectionKeyword)) {
          markers.push({
            type: SECTION_TYPE_MAP[sectionKeyword.toLowerCase()] || 'unknown',
            title: sectionKeyword,
            pageIndex: pageIndex,
            // Additional positioning info could be added
          });
        }
      });
    }
  });
  
  return markers;
};

/**
 * Identifies potential knowledge components in PDF data
 * @param {Object} pdfData - Extracted PDF data
 * @param {Array<Object>} sectionMarkers - Identified section markers
 * @returns {Array<Object>} - Array of potential knowledge components
 */
const identifyKnowledgeComponents = (pdfData, sectionMarkers) => {
  // Simple placeholder implementation - replace with more sophisticated logic
  const potentialKCs = [];
  
  // For now, return an empty array as this is meant to be enhanced later
  // A real implementation might use LLM or other techniques to identify KCs
  
  return potentialKCs;
};

/**
 * Extracts structured content items from PDF data
 * @param {Object} pdfData - Extracted PDF data
 * @param {Array<Object>} sectionMarkers - Identified section markers
 * @returns {Promise<Array<Object>>} - Promise resolving to an array of structured content items
 */
const extractStructuredContentItems = async (pdfData, sectionMarkers) => {
  // Simple placeholder implementation
  const items = [];
  
  // Process each page using OpenAI
  const extractionPromises = pdfData.pages.map((page, pageIndex) => {
    // Get text content of the page
    // Ensure pageText is a string
    const pageText = typeof page.content === 'string' ? page.content : String(page.content || '');
    
    // Extract structured items using OpenAI
    return extractContentWithOpenAI(pageText, pageIndex)
      .then(extractedItems => {
        if (extractedItems && extractedItems.length > 0) {
          // Transform extracted items into the format expected by the rest of the code
          const transformedItems = extractedItems.map(item => ({
            sectionType: item.sectionType,
            text: item.itemText,
            number: item.itemNumber,
            isMultipleChoice: item.isMultipleChoice,
            choices: item.choices,
            pageIndex: pageIndex
          }));
          
          items.push(...transformedItems);
        }
        return extractedItems;
      })
      .catch(error => {
        console.error(`Error extracting items from page ${pageIndex + 1}:`, error);
        return []; // Continue processing other pages
      });
  });
  
  // Wait for all pages to be processed
  await Promise.all(extractionPromises)
    .catch(error => {
      console.error('Error processing pages for content extraction:', error);
    });
    
  return items;
};

// --- Main Processing Function ---

/**
 * Estimates content difficulty based on text complexity (Simple Heuristic)
 * @param {string} content - Content text
 * @returns {number} - Difficulty score (1-5)
 */
const estimateDifficulty = (content) => {
  if (!content) return 1;
  
  // Ensure content is a string
  const textContent = typeof content === 'string' ? content : String(content || '');
  
  const words = textContent.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 1;

  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const longWords = words.filter(w => w.length > 8).length;
  const longWordsRatio = longWords / words.length;
  
  let difficulty = 1;
  if (words.length > 20) difficulty += 1;
  if (avgWordLength > 5.5) difficulty += 1;
  if (longWordsRatio > 0.15) difficulty += 1;
  if (textContent.includes('?') && words.length > 12) difficulty += 1;
  
  return Math.max(1, Math.min(5, Math.round(difficulty)));
};


/**
 * Processes a PDF file using OpenAI, extracts structured content, and saves suggestions.
 * @param {string} filePath - Path to the PDF file
 * @param {object} pdfUploadRecord - Sequelize instance of the PdfUpload record
 * @returns {Promise<{kcCount: number, itemCount: number}>} - Counts of created suggestions
 */
const processPdfCurriculum = async (filePath, pdfUploadRecord) => {
  if (!pdfUploadRecord || !pdfUploadRecord.id) {
    throw new Error('Valid pdfUploadRecord with ID is required.');
  }
  const pdfUploadId = pdfUploadRecord.id;

  try {
    console.log(`Starting PDF processing for upload ID: ${pdfUploadId}, file: ${filePath}`);
    
    // 1. Extract raw PDF content
    const pdfData = await extractPdfContent(filePath);
    console.log(`Extracted ${pdfData.pages.length} pages.`);
    await pdfUploadRecord.update({ page_count: pdfData.pages.length });

    // 2. Identify section markers
    const sectionMarkers = identifySectionMarkers(pdfData);

    // 3. Extract structured content based on sections
    const structuredItemsData = await extractStructuredContentItems(pdfData, sectionMarkers); 
    console.log(`Extracted ${structuredItemsData.length} structured Content Items.`);
    
    // 4. Identify potential knowledge components (optional)
    const potentialKCsData = identifyKnowledgeComponents(pdfData, sectionMarkers);
    console.log(`Identified ${potentialKCsData.length} potential Knowledge Components.`);

    // 5. Save suggestions to database - Create one suggestion PER EXTRACTED STRUCTURED ITEM
    const itemPromises = structuredItemsData.map(item =>
        ContentItem.create({
            type: item.sectionType, // Use the identified section type
            content: item.text, // The main text of the item
            difficulty: estimateDifficulty(item.text),
            pdf_upload_id: pdfUploadId,
            status: 'pending_review',
            suggestion_source: 'automatic',
            metadata: { // Store structured details in metadata
                section: item.sectionType,
                // sectionTitle: section.title, // Title isn't directly available here, maybe add later
                itemNumber: item.number,
                isMultipleChoice: item.isMultipleChoice,
                choices: item.choices, // Store choices array
                sourcePage: item.pageIndex + 1 
            }
        })
    );

    // Also save potential KCs as suggestions
    const kcPromises = potentialKCsData.map(kcData =>
      KnowledgeComponent.create({
        name: kcData.name,
        description: kcData.description,
        source_page: kcData.source_page,
        pdf_upload_id: pdfUploadId,
        status: 'pending_review',
        suggestion_source: 'automatic',
        metadata: kcData.metadata 
      })
    );

    // Execute all creation promises
    const createdKCs = await Promise.all(kcPromises);
    const createdItems = await Promise.all(itemPromises);

    console.log(`Successfully saved ${createdKCs.length} KC suggestions and ${createdItems.length} structured Content Item suggestions for upload ID: ${pdfUploadId}.`);
    
    // 6. Process images using OCR (Optional - Placeholder)
    // TODO: Implement image processing if needed

    // 7. Return counts
    return {
      kcCount: createdKCs.length,
      itemCount: createdItems.length // Count of saved suggestions
    };

  } catch (error) {
    console.error(`Error processing PDF curriculum for upload ID ${pdfUploadId}:`, error);
    await pdfUploadRecord.update({ status: 'error' }).catch(err => console.error("Failed to update PdfUpload status to error:", err));
    throw new Error(`Failed to process PDF curriculum: ${error.message}`);
  }
};

module.exports = {
  processPdfCurriculum,
  extractPdfContent,
  extractTextFromImage,
  // Exporting internal functions might be useful for testing/debugging
  identifySectionMarkers,      
  identifyKnowledgeComponents, 
  extractStructuredContentItems, // Export the new structured extractor
  // extractContentItems // Keep old one exported if needed elsewhere, though likely deprecated
};
