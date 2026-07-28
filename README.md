# FutureMe — Meet the Version of You Who Already Made It

FutureMe is a premium, AI-powered personal reflection platform built inside **Nitish's Founder Labs**. It enables users to reflect on their aspirations, current fears, execution roadblocks, and timeline parameters, then synthesizes a highly personal, emotional, and actionable strategic plan from their future self using the Gemini API. 

Users can immediately copy/share their synthesized reflection matrices and engage in conversational follow-up sessions with their future identity through a terminal chat interface.

---

## Technical Architecture

The application is structured into a clean full-stack setup:
- **Frontend**: Clean Vanilla HTML5 semantic structure, bespoke CSS for responsive, glassmorphic layouts, and optimized JavaScript for interactive AJAX streams, form controls, copy actions, and historical state memory.
- **Backend**: Express (Node.js) server running securely on port `5000`. This service hides your private Gemini API credentials and encapsulates all complex system prompting and JSON deserializations. It also hosts the static assets directly, enabling a single unified server instance.
- **AI Integration**: Google Gemini API SDK (`@google/generative-ai`) executing structural JSON prompting configurations.

---

## Installation & Setup

Follow these simple steps to run the application locally on your machine:

### 1. Project Directory Structure
The project is set up as a unified directory:
```
futureme/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── netlify/
│   └── functions/
│       └── api.js
├── netlify.toml
├── package.json
├── server.js
├── start.bat
└── README.md
```

### 2. Install Node Dependencies
Open your terminal inside the root `futureme/` folder and run:
```bash
npm install
```

### 3. Add Your Gemini API Key
Create a `.env` file by copying the template file:
```bash
copy .env.example .env
```
Open the `.env` file and input your Gemini API credentials:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
PORT=5000
```

---

## Running the Application

Start the backend server in development mode:
```bash
npm run dev
```

This starts the unified full-stack server. You will see a console message confirming:
```
===================================================
FutureMe server is running successfully!
Local Access URL: http://localhost:5000
===================================================
```

### 4. Open the Interface
Simply launch your browser and open:
👉 **[http://localhost:5000](http://localhost:5000)**

*(The Express backend automatically serves the frontend folder, eliminating the need to manage CORS or run separate static tooling servers).*

---

## API Documentation

### 1. `POST /api/generate-futureme`
Synthesizes the core future identity and reflection cards.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Nitish",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  }
  ```
- **Response Format**:
  ```json
  {
    "success": true,
    "data": {
      "message": "...",
      "futureIdentity": "...",
      "nextMoves": ["Action 1", "Action 2", "Action 3"],
      "habit": "...",
      "warning": "...",
      "mantra": "..."
    }
  }
  ```

### 2. `POST /api/chat-futureme`
Runs active follow-up communication sessions with conversational memory support.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "userProfile": {
      "name": "Nitish",
      "age": "23",
      "goal": "Build a successful AI startup",
      "struggle": "Lack of consistency",
      "oneYearVision": "Running a profitable AI company",
      "tone": "Brutally Honest"
    },
    "chatHistory": [
      {
        "role": "user",
        "message": "Will I actually make it?"
      },
      {
        "role": "futureme",
        "message": "Only if your daily actions stop negotiating with your dreams."
      }
    ],
    "question": "What should I focus on this week?"
  }
  ```
- **Response Format**:
  ```json
  {
    "success": true,
    "reply": "..."
  }
  ```

---

## Netlify Serverless Deployment

FutureMe is fully configured to deploy serverlessly on Netlify!

### Configuration files:
* **`netlify.toml`**: Maps build parameters and routes API redirects (`/api/*` -> Netlify Functions).
* **`netlify/functions/api.js`**: Serverless wrapper calling our Express app instance.

### Deployment Steps:
1. Push your repository to **GitHub** (ensuring your `.env` containing local secrets is ignored).
2. Log into **Netlify** and import your site from GitHub.
3. Netlify will read `netlify.toml` and automatically detect the static frontend assets and functions.
4. Set your API Key in Netlify:
   * Go to **Site settings > Environment variables** in your Netlify Dashboard.
   * Add a new environment variable:
     * **Key**: `GEMINI_API_KEY`
     * **Value**: `AQ.your_gemini_api_key_here`
5. Click **Deploy Site**! Your full-stack project is now live globally.

