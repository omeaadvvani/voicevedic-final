# VoiceVedic API Documentation

This document describes the VoiceVedic APIs built following OpenAI best practices and modern API design principles.

## Overview

The VoiceVedic API suite provides spiritual guidance, calendar information, and Vedic wisdom through OpenAI-powered responses. All APIs are built as Supabase Edge Functions with comprehensive error handling, rate limiting, and structured responses.

## Base URL

```
https://your-project.supabase.co/functions/v1/
```

## Authentication

All APIs require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Common Response Format

All APIs return responses in this standardized format:

```json
{
  "success": true,
  "data": {
    // API-specific data
  },
  "message": "Optional success message",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid-for-tracking"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly message",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid-for-tracking"
}
```

## API Endpoints

### 1. Ask VoiceVedic (Enhanced)

**Endpoint:** `POST /askvoicevedic-enhanced`

**Description:** Get spiritual guidance for Vedic calendar and timing questions.

**Request Body:**
```json
{
  "question": "When is Amavasya this month?",
  "location": "Mumbai, India",
  "calendar": "Hindu",
  "userPreferences": {
    "language": "English",
    "detailLevel": "brief"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Amavasya falls on Sunday, June 30.\nIt marks the new moon and is ideal for spiritual cleansing and honoring ancestors.\nObserve silence, offer water to your elders, or perform a simple prayer at home.",
    "question": "When is Amavasya this month?",
    "context": {
      "location": "Mumbai, India",
      "calendar": "Hindu",
      "userPreferences": {
        "language": "English",
        "detailLevel": "brief"
      }
    },
    "model": "gpt-4o-mini",
    "tokens": 45
  },
  "message": "Spiritual guidance provided successfully"
}
```

### 2. Calendar Events

**Endpoint:** `POST /calendar-events`

**Description:** Get detailed calendar information for spiritual events and festivals.

**Request Body:**
```json
{
  "query": "What are the important festivals in January 2024?",
  "location": "Varanasi, India",
  "calendar": "Hindu",
  "year": 2024,
  "includeDetails": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Important festivals in January 2024:\n1. Makar Sankranti - January 15, 2024\n2. Pongal - January 15-18, 2024\n3. Lohri - January 13, 2024\n\nThese festivals mark the sun's transition into Capricorn and celebrate harvest season.",
    "query": "What are the important festivals in January 2024?",
    "context": {
      "location": "Varanasi, India",
      "calendar": "Hindu",
      "year": 2024
    },
    "model": "gpt-4o-mini",
    "includeDetails": true
  }
}
```

### 3. Spiritual Guidance

**Endpoint:** `POST /spiritual-guidance`

**Description:** Get personalized spiritual guidance and wisdom.

**Request Body:**
```json
{
  "question": "How can I find inner peace during difficult times?",
  "userProfile": {
    "age": 35,
    "spiritualBackground": "Hindu",
    "experience": "beginner"
  },
  "spiritualLevel": "beginner",
  "preferredPractices": ["meditation", "prayer"],
  "currentChallenges": "work stress and anxiety",
  "includeRelatedWisdom": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "guidance": "During difficult times, remember that challenges are opportunities for growth. Start with simple practices: 5 minutes of deep breathing each morning, gratitude journaling, and connecting with nature. These small steps build inner resilience.",
    "question": "How can I find inner peace during difficult times?",
    "context": {
      "userProfile": {
        "age": 35,
        "spiritualBackground": "Hindu",
        "experience": "beginner"
      },
      "spiritualLevel": "beginner",
      "preferredPractices": ["meditation", "prayer"],
      "currentChallenges": "work stress and anxiety"
    },
    "relatedWisdom": [
      {
        "wisdom": "Peace comes from within. Do not seek it without.",
        "source": "Buddha",
        "relevance": 0.85
      }
    ],
    "model": "gpt-4o-mini",
    "sessionId": "uuid-session-id"
  }
}
```

### 4. Match Similar Questions

**Endpoint:** `POST /match-similar-questions`

**Description:** Find similar questions from the FAQ database using vector similarity.

**Request Body:**
```json
{
  "query": "When is the best time to perform puja?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "What is the best time for morning prayers?",
      "When should I perform daily puja?",
      "What are the auspicious timings for worship?"
    ],
    "debug": {
      "query": "When is the best time to perform puja?",
      "found_matches": 3,
      "similarities": [0.89, 0.85, 0.82]
    }
  }
}
```

### 5. Generate FAQ Embeddings

**Endpoint:** `POST /generate-faq-embeddings`

**Description:** Generate embeddings for FAQ questions (admin function).

**Request Body:** (No body required)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Embedding generation complete! 25 embeddings generated and saved.",
    "updated": 25,
    "failed": 0,
    "total_processed": 25
  }
}
```

## Rate Limiting

All APIs implement rate limiting:

- **Ask VoiceVedic:** 50 requests per minute
- **Calendar Events:** 30 requests per minute  
- **Spiritual Guidance:** 20 requests per minute
- **Match Similar Questions:** 100 requests per minute
- **Generate FAQ Embeddings:** 10 requests per minute

Rate limit exceeded responses include HTTP 429 status code.

## Error Handling

### Common Error Codes

- `400` - Bad Request (missing/invalid parameters)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Response Example

```json
{
  "success": false,
  "error": "Missing required fields: question",
  "message": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid-for-tracking"
}
```

## Best Practices

### 1. Request Optimization

- Use appropriate model selection (gpt-4o-mini for faster responses)
- Set reasonable max_tokens to control response length
- Include relevant context for better responses

### 2. Error Handling

- Always check the `success` field in responses
- Implement exponential backoff for retries
- Log request IDs for debugging

### 3. Rate Limiting

- Implement client-side rate limiting
- Use request queuing for high-volume applications
- Monitor rate limit headers

### 4. Security

- Validate all input parameters
- Sanitize user data before sending to OpenAI
- Use environment variables for sensitive data

## Environment Variables

Required environment variables:

```bash
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Monitoring and Analytics

All API calls are logged with:
- Request timestamp and duration
- Client IP address
- Request parameters
- Response status
- OpenAI model used
- Token usage (approximate)

## Database Schema

The APIs use these tables:

- `vedic_faqs` - FAQ questions with embeddings
- `calendar_queries` - Calendar query logs
- `spiritual_guidance_sessions` - Guidance session logs

## Deployment

Deploy to Supabase Edge Functions:

```bash
supabase functions deploy askvoicevedic-enhanced
supabase functions deploy calendar-events
supabase functions deploy spiritual-guidance
```

## Support

For API support and questions, please refer to the Supabase dashboard logs or contact the development team. 