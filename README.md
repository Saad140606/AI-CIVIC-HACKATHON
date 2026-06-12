# 🇵🇰 WakalaLens Pakistan — AI Civic Budget Intelligence Platform

> **AI FOR CIVIC INNOVATION HACKATHON 2025 Submission**
> _Open data + AI to make Pakistan's federal budget understandable for every citizen_

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4-black?logo=express)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Groq](https://img.shields.io/badge/Fallback-Groq%20LLaMA3-F54B26)](https://groq.com/)

---

## 🎯 Problem Statement

Pakistan's federal budget is released as hundreds of pages of dense PDFs. Ordinary citizens — farmers, teachers, shopkeepers — cannot understand how PKR 17 trillion in public money is allocated, which MNA voted for what, or how the budget affects them personally.

**WakalaLens Pakistan** solves this with an open-data AI platform that translates government budget data into plain English and Urdu.

---

## ✨ Key Features

### 📊 Budget Intelligence Dashboard
- **Real FY2025-26 budget data** parsed directly from the official Ministry of Finance Excel files (43 ministries, PKR 17.0 trillion total)
- 3-year comparison: FY2023-24 → FY2024-25 → FY2025-26
- Year-over-year change indicators per ministry
- Export to CSV for researchers and journalists

### 🤖 AI Budget Assistant (Bilingual)
- Ask questions in **English, Urdu, or Roman Urdu**
- AI-powered responses with real budget figures cited from Finance Division, GoP
- **Dual AI engine**: Google Gemini 1.5 Flash (primary) → Groq LLaMA3-70B (automatic fallback)
- Intent-routing for 10+ budget topic keywords without wasting API calls

### 🏛️ WakalaCheck — MNA Accountability
- 31 members of the 16th National Assembly with attendance, bills, and questions data
- **AI Performance Rating** (Grade A–F with English + Urdu assessment)
- Parliamentary voting records on 5 key bills (Finance Act, Education Reform, Cybercrime, etc.)
- Province and constituency filters + city-level constituency selector
- **MNA Leaderboard** sortable by attendance, bills sponsored, questions raised
- Source: National Assembly of Pakistan — [na.gov.pk](https://na.gov.pk)

### 📄 AI Legislative Bill Summarizer
- Drag-and-drop PDF upload of any National Assembly bill
- AI extracts and summarizes in 3 plain-language sentences in English + Urdu
- Powered by Gemini → Groq fallback chain

### ⚖️ Budget Comparator
- Side-by-side ministry comparison across all 3 budget years
- Sector-level YoY change chart (Education, Health, Defence, Railways, etc.)
- Real figures computed from actual budget data

### 💡 Personalized Budget Insights
- Select your province + sector of interest
- AI explains how the FY2025-26 budget affects you specifically

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Vanilla CSS + custom design system (glassmorphism, dark mode) |
| Animations | Framer Motion |
| Charts | Recharts |
| State | TanStack Query v5 |
| Backend | Node.js, Express 4, TypeScript |
| AI Primary | Google Gemini 1.5 Flash |
| AI Fallback | Groq LLaMA3-70B-8192 |
| PDF Parsing | pdf-parse |
| Budget Data | xlsx (official MoF Excel files) |

---

## 📁 Data Sources

| Source | URL | Usage |
|--------|-----|-------|
| Ministry of Finance, GoP | [finance.gov.pk](https://www.finance.gov.pk) | Budget Excel files FY2023-24, FY2024-25, FY2025-26 |
| National Assembly of Pakistan | [na.gov.pk](https://na.gov.pk) | MNA profiles, attendance, voting records |
| Planning Division, GoP | [pc.gov.pk](https://www.pc.gov.pk) | PSDP allocations data |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))
- Groq API key (free tier at [console.groq.com](https://console.groq.com/keys))

### 1. Clone & Install

```bash
git clone https://github.com/Saad140606/AI-CIVIC-HACKATHON
cd Pakistan-national-budgets/budgetlens

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env and fill in your API keys:
# GEMINI_API_KEY=your_key_here
# GROQ_API_KEY=your_key_here
```

### 3. Run Development Servers

**Terminal 1 — Backend (port 3001):**
```bash
cd budgetlens/backend
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd budgetlens/frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🗂️ Project Structure

```
budgetlens/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── routes/
│   │   │   ├── ai.ts             # AI endpoints (Gemini→Groq fallback)
│   │   │   ├── budget.ts         # Budget data endpoints
│   │   │   └── mna.ts            # MNA data endpoints
│   │   └── lib/
│   │       ├── dataLoader.ts     # Excel budget data parser
│   │       └── naScraper.ts      # MNA data (16th NA seed + auto voting records)
│   └── .env.example              # Environment variable template
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx     # Main budget overview
│       │   ├── MinistryExplorer.tsx  # Detailed ministry drill-down
│       │   ├── Compare.tsx       # Year-over-year comparison
│       │   └── WakalaCheck.tsx   # MNA accountability platform
│       └── components/
│           ├── ChatBar.tsx       # Floating AI chat interface
│           └── HeroStats.tsx     # Key budget statistics banner
└── data/
    ├── budget_2023_24.xlsx
    ├── budget_2024_25.xlsx
    └── budget_2025_26.xlsx       # Real FY25-26 budget data
```

---

## 🔒 Security

- API keys are stored in `.env` (git-ignored — never committed)
- Use `.env.example` as a template only
- AI fallback chain ensures the app works even if one provider is down

---

## 📊 Budget Data Notes

All budget figures are in **PKR Billions**. The FY2025-26 Excel file stores values in **PKR Millions**, which is automatically converted by the data loader (`× 1,000,000 ÷ 1,000,000,000` = `÷ 1,000`).

**FY2025-26 Summary:**
- Total Federal Budget: **~PKR 17.0 trillion** (PKR 16,995 billion)
- Largest allocation: Debt Servicing (~52% of total)
- 43 ministries/divisions tracked

---

## 👥 Team

Built for the **AI for Civic Innovation Hackathon 2025** by students passionate about government transparency and open data in Pakistan.
Saad Najam - Student at FAST NUCES KARACHI
Nabeel Ali - Student at FAST NUCES KARACHI
---

## 📜 License

MIT License — open for civic use, research, and education.

Data sourced from Government of Pakistan official publications. All budget figures are public domain.
