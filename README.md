# 🧠 AI Interview Coach & Recruiter Platform

A production-ready full-stack AI-powered interview platform built with Node.js, React, MongoDB, and Google Gemini.
## ✨ Key Features

- **RAG-powered questions** — Gemini reads your resume + JD to generate personalized questions
- **Adaptive difficulty** — Easy → Medium → Hard based on your answers
- **Real-time speech feedback** — Socket.io streams coaching tips while you speak
- **AI Scorecard** — Communication, Technical, Confidence, Clarity scores
- **Filler word detection** — Catches "um", "uh", "like", "you know"
- **PDF generation** — ATS resume + interview report via Puppeteer
- **Monaco code editor** — Full coding interview mode with AI evaluation
- **Recruiter dashboard** — Candidate ranking, filtering, AI summaries
- **Memory system** — AI remembers your past weak topics
- **JWT + refresh tokens** — Secure auth with token blacklisting on logout


---

## 🏗 Project Structure

```
/
├── backend/          # Node.js + Express API
│   ├── config/       # DB, logger
│   ├── controllers/  # Route handlers
│   ├── middleware/   # Auth, error, upload, rate-limit
│   ├── models/       # Mongoose schemas
│   ├── routes/       # Express routers
│   ├── services/     # Business logic + Gemini AI
│   ├── sockets/      # Socket.io real-time
│   └── utils/        # AppError, token utils
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── components/  # Reusable UI
        ├── context/     # AuthContext, InterviewContext
        ├── hooks/       # useVoiceRecorder, useSocket, useTimer
        ├── pages/       # All page components
        └── services/    # API service layer
```

---

## ⚙️ Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `CLIENT_URL` | Frontend URL (for CORS) |

---

## 🚀 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout + blacklist token |
| GET | `/api/auth/me` | Get current user |

### Interviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/interviews` | Create interview (AI generates questions) |
| GET | `/api/interviews` | List user's interviews |
| GET | `/api/interviews/:id` | Get interview detail |
| POST | `/api/interviews/:id/answer` | Submit answer (AI evaluates) |
| POST | `/api/interviews/:id/complete` | Complete + generate scorecard |
| POST | `/api/interviews/:id/followup` | Ask AI follow-up question |
| POST | `/api/interviews/:id/coding` | Submit coding solution |
| POST | `/api/interviews/feedback/realtime` | Real-time speech feedback |
| GET | `/api/interviews/roadmap` | AI learning roadmap |

### Resume
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/resume/upload` | Upload + AI parse PDF resume |
| GET | `/api/resume` | Get parsed resume |
| DELETE | `/api/resume` | Delete resume |

### PDF
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pdf/resume` | Download ATS-optimized resume PDF |
| GET | `/api/pdf/report/:id` | Download interview report PDF |

### Recruiter (role: recruiter/admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/recruiter/candidates` | List all candidates |
| GET | `/api/recruiter/candidates/:id` | Candidate detail + AI summary |
| GET | `/api/recruiter/candidates/:id/interviews` | Candidate's interviews |
| GET | `/api/recruiter/analytics` | Platform analytics |

### Progress
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/progress` | Progress data + graph + memory |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel or run: vercel --prod
```

### Backend → Render / Railway
1. Push to GitHub
2. Connect repo to Render
3. Set environment variables
4. Build command: `npm install`
5. Start command: `node server.js`

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Whitelist `0.0.0.0/0` for production
3. Copy connection string to `MONGO_URI`

---

