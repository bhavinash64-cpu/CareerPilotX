# CareerPilot X — AI-Powered Career Platform 🚀

> **AMD AI Hackathon Submission** — Built with GPU-accelerated AI inference for real-time career intelligence.

## 🎯 What is CareerPilot?

CareerPilot X is a **premium, AI-powered career platform** that helps professionals build elite resumes, analyze skill gaps, generate cover letters, and visualize career roadmaps — all powered by real-time AI models running on GPU-accelerated infrastructure.

## ✨ Features

| Feature | Description | AI Model |
|---------|-------------|----------|
| 📄 **Resume Builder** | 35+ templates, live preview, PDF & Image export | NVIDIA Nemotron |
| 🔥 **Resume Roast** | Brutally honest AI feedback on your resume | NVIDIA Nemotron |
| 🎯 **Skill Gap Analysis** | Compare your skills vs job requirements | NVIDIA Nemotron |
| ✉️ **Cover Letter Generator** | Personalized cover letters for any role | NVIDIA Nemotron |
| 📧 **Email Generator** | Professional application & follow-up emails | NVIDIA Nemotron |
| 📱 **Bio Generator** | Instagram & Facebook professional bios | NVIDIA Nemotron |
| 🧠 **Career GPS** | Visual roadmap with **AI-generated imagery** | NVIDIA FLUX.1-dev (GPU) |
| 🤖 **AI Career Coach** | Real-time career guidance chat | NVIDIA Nemotron |
| 📚 **Resume Resources** | Curated tools and websites for resume building | NVIDIA Nemotron |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Frontend (Vanilla JS + CSS)        │
│  index.html · app.js · ai-tools.js · styles │
└──────────────────┬──────────────────────────┘
                   │ HTTP API
┌──────────────────▼──────────────────────────┐
│         Node.js Backend (Express)            │
│              server/index.js                 │
│  ┌─────────────┐  ┌───────────────────────┐ │
│  │  OpenRouter  │  │  NVIDIA NIM (GPU)     │ │
│  │  Text AI     │  │  Image Generation     │ │
│  │  Nemotron    │  │  FLUX.1-dev           │ │
│  └─────────────┘  └───────────────────────┘ │
└──────────────────────────────────────────────┘
         │                      │
    ┌────▼────┐          ┌──────▼──────┐
    │Firebase │          │  Stripe     │
    │Auth/DB  │          │  Payments   │
    └─────────┘          └─────────────┘
```

## 🔥 AMD/GPU AI Integration

- **NVIDIA NIM FLUX.1-dev** — GPU-accelerated image generation for Career GPS visual roadmaps
- **NVIDIA Nemotron 120B** — Large language model for all text-based AI tools (via OpenRouter)
- **Multi-provider fallback** — Automatic failover to ensure 100% uptime

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/your-repo/careerpilot-x.git
cd careerpilot-x

# 2. Install dependencies
cd server && npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start the backend
node server/index.js

# 5. Open in browser
# Open index.html directly or use Live Server
```

## 🔑 Environment Variables

See `.env.example` for required configuration.

## 👥 Team

Built with ❤️ for the AMD AI Hackathon 2026.

## 📄 License

MIT
