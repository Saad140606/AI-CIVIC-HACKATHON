# 🇵🇰 WakalaLens Pakistan

> AI for Civic Innovation Hackathon 2025 submission
>
> A bilingual budget intelligence app that turns Pakistan’s public finance data into plain-language insights for citizens, journalists, and researchers.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4-black?logo=express)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4285F4?logo=google)](https://ai.google.dev/)

---

## 🎯 What this project does

WakalaLens Pakistan combines official budget data, parliamentary accountability data, and AI narration to answer questions such as:

- How much is the federal government spending on each ministry?
- Which ministries grew or shrank the most from FY2023-24 to FY2025-26?
- How does a constituency or MNA profile connect to budget priorities?
- How can tax and budget information be explained in simple English or Urdu?

The app is split into two main parts:

- Backend API: budget parsing, MNA data, and AI routes
- Frontend app: dashboard, explorer, compare, WakalaCheck, tax calculator, and bill summarizer

---

## ✨ Highlights

- Real FY2023-24, FY2024-25, FY2025-26 budget data from the official Ministry of Finance Excel files
- AI-assisted explanations in English and Urdu using Gemini + Groq fallback
- MNA accountability flow with constituency and member lookup
- Bill summarizer for legislative PDFs
- Tax calculator and shareable summary cards for civic communication

---

## 📸 Screenshots

The repository includes sample visuals under the figures folder:

- ![Overview](budgetlens/frontend/public/figures/screenshot_2020.png)
- ![Dashboard view](budgetlens/frontend/public/figures/screenshot_2021.png)
- ![Budget comparison](budgetlens/frontend/public/figures/screenshot_2022.png)

---

## 🧩 Current app structure

```text
Pakistan-national-budgets/
└── budgetlens/
    ├── backend/
    │   ├── data/
    │   │   ├── 2023_2024/
    │   │   ├── 2024_2025/
    │   │   └── 2025_2026/
    │   └── src/
    └── frontend/
        ├── public/
        │   └── figures/    # screenshots used in demos and presentation
        └── src/
```

Inside the app folder:

```text
budgetlens/backend/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── ai.ts
│   │   ├── budget.ts
│   │   └── mna.ts
│   └── lib/
│       ├── dataLoader.ts
│       └── naScraper.ts
└── package.json

budgetlens/frontend/
├── src/
│   ├── App.tsx
│   ├── components/
│   ├── context/
│   ├── i18n/
│   ├── lib/
│   └── pages/
└── package.json
```

---

## 🚀 Run locally

### Prerequisites

- Node.js 18+
- npm 9+
- Gemini API key
- Groq API key (optional fallback)

### 1) Install dependencies

```bash
cd budgetlens/backend
npm install

cd ../frontend
npm install
```

### 2) Configure environment

```bash
cd ../backend
cp .env.example .env
```

Fill in the keys in the backend `.env` file:

```env
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

### 3) Start the app

Terminal 1 — backend

```bash
cd budgetlens/backend
npm run dev
```

Terminal 2 — frontend

```bash
cd budgetlens/frontend
npm run dev
```

Open the frontend at:

```text
http://localhost:5173
```

---

## 📊 Data sources

| Source | Purpose |
|---|---|
| Ministry of Finance, Government of Pakistan | FY2023-24, FY2024-25, FY2025-26 budget figures |
| National Assembly of Pakistan | MNA profiles, attendance, and parliamentary accountability data |
| Government of Pakistan open budget documents | Supporting civic finance context |

---

## 🔐 Security note

API keys are stored in the backend `.env` file and should not be committed to version control.

---

## 👥 Team

Built for the **AI for Civic Innovation Hackathon 2025** by the Pakistan National Budgets team, including Saad Najam and Nabeel Ali from FAST NUCES Karachi.

---

## 📜 License

MIT License — intended for civic use, research, and education.

