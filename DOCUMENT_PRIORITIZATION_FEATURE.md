# Document Prioritization Feature

## Overview

The enhanced RAG (Retrieval-Augmented Generation) system now intelligently prioritizes uploaded documents when answering user questions. This ensures that when you upload documents to your knowledge base, the system will check those documents first and prioritize their content when providing answers.

## How It Works

### 1. Multi-Stage Document Search

The system follows a sophisticated retrieval strategy:

1. **High-Quality Document Search**: First searches uploaded documents with a strict similarity threshold (0.5+)
2. **Quality Assessment**: Evaluates if uploaded documents provide sufficient relevant content (60%+ similarity)
3. **Priority Decision**: If good matches are found, prioritizes uploaded document content
4. **Supplementation**: Only adds web search or other sources if uploaded documents don't fully answer the question

### 2. Intelligent Source Prioritization

- **HIGHEST PRIORITY**: Uploaded documents that match the query
- **SECOND PRIORITY**: Web search results (only as supplementary content)
- **THIRD PRIORITY**: Sports data or other specialized sources

### 3. Context Formatting

The system clearly indicates source priority in responses:
- `=== UPLOADED DOCUMENTS (HIGHEST PRIORITY) ===` - Your uploaded content
- `=== CURRENT WEB SEARCH RESULTS (SUPPLEMENTARY) ===` - Web content to supplement
- Clear instructions to the AI about which sources to prioritize

## Key Features

### Smart Threshold Management
- Uses higher similarity thresholds (0.5+) for uploaded documents to ensure quality
- Falls back to lower thresholds (0.3) only if insufficient high-quality matches are found
- Filters results by similarity scores to prioritize the most relevant content

### Source Attribution
- All uploaded document chunks show similarity percentages
- Clear labeling of document titles and sources
- Explicit indication when content comes from uploaded vs. web sources

### Fallback Strategy
- If uploaded documents don't contain relevant information, gracefully falls back to web search
- Expands document search with lower thresholds before resorting to external sources
- Maintains performance even when document search fails

## Usage Examples

### Document-Specific Queries ✅
**Query**: "What are the main topics covered in the uploaded documents?"
**Expected Behavior**: Should prioritize uploaded documents and show "UPLOADED DOCUMENTS (HIGHEST PRIORITY)" in sources.

### Mixed Queries 🔄
**Query**: "How does the information in my documents compare to current trends?"
**Expected Behavior**: Uses uploaded documents as foundation, supplements with web search for current trends.

### General Queries ➡️
**Query**: "What's the latest news in artificial intelligence?"
**Expected Behavior**: Falls back to web search since no relevant uploaded documents exist.

## System Prompts Enhancement

The AI system prompts have been updated to emphasize document priority:

```
CRITICAL DOCUMENT PRIORITY RULES:
1. UPLOADED DOCUMENTS ARE HIGHEST PRIORITY
2. Answer from uploaded documents FIRST
3. Cite uploaded documents explicitly
4. Supplement carefully with other sources
5. Be explicit about source types
```

## Testing

Use the **Document Priority Test** page (`/document-priority-test`) to:

1. Upload test documents
2. Ask document-specific questions
3. Verify that uploaded content is prioritized
4. Test fallback behavior with general queries

## Benefits

- **Accuracy**: Ensures your specific content is always checked first
- **Relevance**: Prioritizes the documents you've uploaded as most relevant
- **Transparency**: Clear indication of which sources are being used
- **Efficiency**: Intelligent fallback prevents over-reliance on external sources
- **Control**: You control the knowledge base priority through document uploads

## Implementation Details

### Enhanced `retrieveRelevantChunks` Method
- Multi-stage search with quality assessment
- Dynamic threshold adjustment
- Intelligent source mixing
- Comprehensive logging for debugging

### Updated Context Formatting
- Clear priority sections in context
- Similarity scores for transparency
- Explicit instructions to AI about source priority

### System Prompt Integration
- Document-aware prompting
- Source-specific instructions
- Fallback guidance for edge cases

This feature ensures that your uploaded documents are always given the highest priority when answering questions, while still maintaining the ability to supplement with external sources when needed. 