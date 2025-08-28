# Green-API Integration Setup Guide for VoiceVedic

## Overview
This guide will help you set up Green-API to connect your VoiceVedic backend with WhatsApp.

## Step 1: Create Green-API Account 📱

1. **Visit**: https://green-api.com/
2. **Sign up** for a free account
3. **Verify your email** and log in to the dashboard

## Step 2: Get Your API Credentials 🔑

1. **Go to your Green-API dashboard**
2. **Find your ID Instance** (looks like: `123456789`)
3. **Get your API Token** (long string of characters)
4. **Note down your phone number** (the one you'll use for WhatsApp)

## Step 3: Install Green-API App 📲

1. **Download** the Green-API app from your dashboard
2. **Install** it on your phone
3. **Open the app** and scan the QR code
4. **Connect** your WhatsApp account
5. **Wait for connection** (should show "Connected")

## Step 4: Configure Environment Variables ⚙️

In your Render dashboard, add these environment variables:

```
PERPLEXITY_API_KEY=your_perplexity_api_key
GREEN_API_ID_INSTANCE=your_id_instance
GREEN_API_API_TOKEN=your_api_token
GREEN_API_URL=https://api.green-api.com
```

## Step 5: Set Up Webhook 🔗

1. **In Green-API dashboard**, go to **Webhook Settings**
2. **Set Webhook URL**: `https://homepage-5-wbh0.onrender.com/api/green-api`
3. **Set Webhook Method**: POST
4. **Save the settings**

## Step 6: Test the Integration 🧪

1. **Send a message** to your Green-API connected WhatsApp number
2. **Ask**: "when is next amavasya in mumbai"
3. **You should receive** a VoiceVedic response with spiritual guidance

## Your VoiceVedic Green-API Endpoints:

- **Webhook URL**: `https://homepage-5-wbh0.onrender.com/api/green-api`
- **Health Check**: `https://homepage-5-wbh0.onrender.com/health`
- **Frontend**: https://voivevedic.netlify.app

## Troubleshooting 🔧

### If messages aren't received:
1. **Check Green-API app** is connected
2. **Verify webhook URL** is correct
3. **Check environment variables** are set
4. **Look at Render logs** for errors

### If responses aren't sent:
1. **Verify Perplexity API key** is set
2. **Check Green-API credentials** are correct
3. **Test webhook** with curl command

## Test Commands:

```bash
# Test webhook
curl -X POST https://homepage-5-wbh0.onrender.com/api/green-api \
  -H "Content-Type: application/json" \
  -d '{"body":{"messageData":{"textMessageData":{"textMessage":"test message"}},"senderData":{"sender":"1234567890@c.us"}}}'

# Test health
curl https://homepage-5-wbh0.onrender.com/health
```

## Cost Comparison:

| Service | Setup Cost | Monthly Cost | Messages |
|---------|------------|--------------|----------|
| Green-API | Free | $5-15 | 1000-10000 |
| Chat-API | Free | $5-20 | 1000-10000 |
| Twilio | Free | $20-50 | 1000-10000 |
| MessageBird | Free | $25-100 | 1000-10000 |

## Why Green-API?

✅ **More Reliable** - Better uptime and stability
✅ **Better Documentation** - Clearer setup instructions
✅ **Affordable** - Competitive pricing
✅ **Good Support** - Responsive customer service
✅ **Easy Integration** - Simple API structure

## Next Steps:

1. **Set up environment variables** in Render
2. **Configure webhook** in Green-API dashboard
3. **Test with WhatsApp messages**
4. **Share your VoiceVedic WhatsApp number** with users

Your VoiceVedic WhatsApp bot will be ready to provide spiritual guidance! 🪔
