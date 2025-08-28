# VoiceVedic - Spiritual Voice Assistant

A modern React-based voice assistant for Hindu calendar and spiritual guidance, built with TypeScript, Vite, and Supabase.

## 🚀 Features

- **Voice-Based Interaction**: Speech-to-text and text-to-speech capabilities
- **Spiritual Guidance**: AI-powered responses for Hindu calendar questions
- **Location-Aware**: Precise location detection for accurate timing
- **Voice Preferences**: Customizable voice settings with Catherine (en-AU)
- **Real-time Responses**: Local and API-based spiritual guidance
- **Modern UI**: Beautiful, accessible interface with spiritual design

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom spiritual theme
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Voice**: Browser Speech Synthesis API
- **AI**: Perplexity API for spiritual guidance and real-time information
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voicevedic/homepage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PERPLEXITY_API_KEY=your_perplexity_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `VITE_PERPLEXITY_API_KEY` | Perplexity API key for spiritual guidance | ✅ |

### Supabase Setup

1. **Create Supabase project**
2. **Deploy Edge Functions**:
   ```bash
   cd supabase
   npx supabase functions deploy askvoicevedic-enhanced
   npx supabase functions deploy match-similar-questions
   npx supabase functions deploy generate-faq-embeddings
   ```

3. **Set environment variables in Supabase Dashboard**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 🎯 Usage

### Voice Commands
- Ask about Hindu calendar events
- Get spiritual guidance
- Check fasting days
- Learn about festivals

### Voice Settings
- Select Catherine (en-AU) voice
- Adjust speech rate and pitch
- Enable/disable voice responses

### Location Features
- Automatic location detection
- Location-based timing calculations
- Privacy-focused location handling

## 🐛 Troubleshooting

### Common Issues

1. **Voice not working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Try reloading the page

2. **API errors**
   - Verify environment variables
   - Check Supabase function deployment
   - Ensure API keys are valid

3. **Location issues**
   - Allow location permissions
   - Check browser compatibility
   - Verify HTTPS connection

4. **Build errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Check for linting errors
npm run lint

# Type checking
npx tsc --noEmit

# Preview production build
npm run preview
```

## 📁 Project Structure

```
homepage/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   └── main.tsx           # App entry point
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── dist/                   # Build output
```

## 🔒 Security

- Environment variables for sensitive data
- CORS protection on API endpoints
- Rate limiting on Edge Functions
- Input validation and sanitization
- Secure authentication flow

## 📱 Browser Support

- Chrome 66+
- Firefox 60+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the documentation
- Open an issue on GitHub

---

**VoiceVedic** - Your spiritual journey, voice-guided. 🙏
