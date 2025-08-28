# Perplexity API Integration Setup Guide

This guide will help you integrate the Perplexity API into your VoiceVedic project for intelligent spiritual guidance and real-time information.

## What is Perplexity?

Perplexity is an AI-powered search and chat platform that provides:
- Real-time information from the web
- Accurate and up-to-date answers
- Multiple AI models for different use cases
- Comprehensive knowledge base

## Setup Instructions

### 1. Get Perplexity API Key

1. Visit [Perplexity AI](https://www.perplexity.ai/)
2. Sign up for a Pro subscription (required for API access)
3. Go to your account settings
4. Navigate to the API section
5. Generate a new API key

### 2. Configure Environment Variables

Add your Perplexity API key to the `.env` file in the homepage directory:

```env
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### 3. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the AskVoiceVedic screen
3. Ask a spiritual question like:
   - "When is the next Ekadashi?"
   - "What is the significance of Amavasya?"
   - "How to perform a simple pooja at home?"

## Features

### Intelligent Question Routing

The integration automatically routes questions to appropriate contexts:

- **Calendar Questions**: Panchang, tithi, nakshatra, muhurat, dates
- **Spiritual Guidance**: Festivals, rituals, practices, philosophy
- **General Information**: Meditation, prayer, wisdom, traditions

### Specialized Contexts

1. **Spiritual Guidance Context**
   - Deep knowledge of Hindu traditions
   - Vedic wisdom and practices
   - Festival significance and rituals
   - Compassionate and supportive tone

2. **Calendar Information Context**
   - Hindu calendar systems
   - Auspicious timings
   - Festival dates and significance
   - Current and upcoming events

3. **General Spiritual Context**
   - Meditation and mindfulness
   - Philosophical concepts
   - Various spiritual traditions
   - Practical spiritual advice

## API Configuration

### Model Used
- **Model**: `llama-3.1-sonar-small-128k`
- **Features**: High-quality responses with knowledge cutoff
- **Token Limit**: 1000 tokens per response
- **Temperature**: 0.7 (balanced creativity and accuracy)

### Error Handling

The integration includes comprehensive error handling:
- API key validation
- Network error recovery
- Rate limiting awareness
- User-friendly error messages

## Usage Examples

### Calendar Questions
```
User: "When is the next Ekadashi?"
Response: Real-time information about upcoming Ekadashi dates and significance
```

### Spiritual Guidance
```
User: "How to perform a simple pooja at home?"
Response: Step-by-step guidance with traditional practices
```

### Festival Information
```
User: "What is the significance of Diwali?"
Response: Comprehensive information about Diwali traditions and practices
```

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Ensure `VITE_PERPLEXITY_API_KEY` is set in your `.env` file
   - Check that the API key is valid and active

2. **Rate Limiting**
   - Perplexity Pro has generous limits
   - If you hit limits, wait a moment and try again

3. **Network Errors**
   - Check your internet connection
   - Verify Perplexity service status

### Getting Help

- **Perplexity Documentation**: https://docs.perplexity.ai/
- **API Status**: Check Perplexity dashboard
- **Support**: Contact Perplexity support for API issues

## Benefits

The Perplexity integration enhances your spiritual guidance app by:

1. **Real-time Information**: Always up-to-date calendar and festival information
2. **Comprehensive Knowledge**: Access to vast spiritual and cultural knowledge
3. **Accurate Responses**: AI-powered responses with web search verification
4. **Flexible Contexts**: Specialized responses for different types of questions
5. **Professional Quality**: Enterprise-grade AI responses

## Cost Considerations

- **Perplexity Pro**: Required for API access
- **API Usage**: Pay-per-use model
- **Token Costs**: Based on input and output tokens
- **Rate Limits**: Generous limits with Pro subscription

## Security

- API keys are stored in environment variables
- No sensitive data is sent to Perplexity
- All communication is encrypted
- User privacy is maintained

The Perplexity integration provides your VoiceVedic app with intelligent, real-time spiritual guidance powered by advanced AI technology. 