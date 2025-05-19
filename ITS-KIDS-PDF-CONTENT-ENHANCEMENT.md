# ITS-KIDS Content Management Enhancement for BKT and Fuzzy Logic

This document outlines the enhancements made to the ITS-KIDS system to support PDF curriculum content management and integration with the Bayesian Knowledge Tracing (BKT) and Fuzzy Logic algorithms.

## Overview

The ITS-KIDS system has been enhanced with a comprehensive PDF content management system that allows teachers to:

1. Upload PDF curriculum documents
2. Extract knowledge components and content items automatically
3. Review and edit extracted content
4. Create knowledge components and content items in the database
5. Link content to the appropriate knowledge components

Additionally, a complete BKT implementation with fuzzy logic adjustments has been integrated to provide intelligent student assessment and content recommendation.

## Components

### 1. PDF Processing Module

**Location**: `client/server/utils/pdfProcessor.js`

This module handles the extraction and processing of PDF curriculum documents using:
- PDF.js-extract for PDF parsing
- Tesseract.js for OCR processing of images within PDFs
- Natural language processing for identifying knowledge components and content items

Key features:
- Text extraction from PDFs
- OCR for handling diagrams and charts
- Automatic identification of knowledge components based on formatting and content
- Extraction of questions and examples as content items
- Relevance matching between content and knowledge components

### 2. BKT Algorithm Implementation

**Location**: `client/server/utils/bktAlgorithm.js`

A complete implementation of Bayesian Knowledge Tracing with fuzzy logic enhancements:

- Standardized BKT model with parameters:
  - p(L0): Initial probability of knowing the KC
  - p(T): Probability of transitioning from not knowing to knowing
  - p(S): Probability of slipping (incorrect when knowing)
  - p(G): Probability of guessing (correct when not knowing)

- Fuzzy logic enhancements:
  - Time-based adjustments to knowledge estimates
  - Difficulty-aware assessment
  - Response pattern analysis

- Content recommendation based on:
  - Current knowledge state
  - Content difficulty
  - Student interaction history

### 3. API Controllers

Two new controllers have been added:

**PDF Content Controller** (`client/server/controllers/pdfContentController.js`):
- Handles PDF uploads and processing
- Manages creation of knowledge components and content items from PDFs
- Provides endpoints for monitoring upload status

**BKT Controller** (`client/server/controllers/bktController.js`):
- Processes student responses using the BKT algorithm
- Retrieves and updates knowledge states
- Recommends appropriate content based on student knowledge
- Provides endpoints for adjusting BKT parameters

### 4. Database Models

**PdfUpload Model** (`client/server/models/pdfupload.js`):
- Tracks uploaded PDFs and their processing status
- Links to created knowledge components and content items
- Stores metadata about the extraction process

**Enhanced KnowledgeComponent Model** (`client/server/models/knowledgecomponent.js`):
- Added metadata support for BKT parameters
- Added tracking of PDF source information
- Added support for prerequisite relationships

### 5. Frontend Components

**PDF Content Uploader** (`client/src/components/teacher/PDFContentUploader.js`):
- Multi-step interface for PDF curriculum management
- Upload and processing visualization
- Review interface for extracted knowledge components
- Review interface for extracted content items
- Summary of created content

## API Endpoints

### PDF Content Management

- `POST /api/pdf-content/upload`: Upload and process a PDF curriculum document
- `POST /api/pdf-content/create-kcs`: Create knowledge components from extracted data
- `POST /api/pdf-content/create-content-items`: Create content items from extracted data
- `GET /api/pdf-content/uploads`: List all PDF uploads
- `GET /api/pdf-content/uploads/:id`: Get details about a specific upload

### BKT Algorithm

- `POST /api/bkt/process-response`: Process a student response using BKT
- `GET /api/bkt/knowledge-state`: Get a student's knowledge state for a KC
- `GET /api/bkt/recommend`: Get next recommended content for a student
- `PUT /api/bkt/parameters/:kcId`: Update BKT parameters for a knowledge component

## Installation

The following packages have been added to support the new functionality:

```bash
npm install pdf.js-extract tesseract.js natural sharp multer
```

## Usage

### For Teachers:

1. Navigate to the curriculum management section
2. Upload PDF curriculum documents
3. Review and confirm extracted knowledge components
4. Review and confirm extracted content items
5. Manage created content through the content management interface

### For Students:

No additional steps required. Student interactions will automatically benefit from:
- Improved content based on PDF curriculum documents
- More accurate knowledge tracing through the BKT algorithm
- Intelligent content recommendations based on knowledge state

## BKT Parameter Customization

Knowledge components can have customized BKT parameters adjusted through the admin interface:

- **pL0** (Initial knowledge): Probability a student initially knows the KC (0-1)
- **pT** (Learning rate): Probability of learning the KC when unknown (0-1)
- **pS** (Slip rate): Probability of answering incorrectly despite knowing the KC (0-1)
- **pG** (Guess rate): Probability of answering correctly despite not knowing the KC (0-1)

## Future Enhancements

Potential future improvements include:

1. Enhanced PDF extraction with deep learning models
2. Support for more complex document formats (DOCX, PPT, etc.)
3. Automatic generation of assessment items from extracted content
4. Integration with external curriculum repositories
5. Dynamic adjustment of BKT parameters based on class-wide performance
