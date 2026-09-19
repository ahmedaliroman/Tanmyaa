<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb6-6e31a0763ed6" />
</div>

# Tanmyaa — OpenAI-powered consulting website

The application uses the OpenAI API on the server for all AI text generation. The API key is never exposed to the browser.

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` or `.env.local`.
3. Set `OPENAI_API_KEY` and the existing Supabase/PayPal variables.
4. Start the app: `npm run dev`

The compatibility layer keeps the existing application services working while replacing the Google AI Studio/Gemini provider with OpenAI models.
