# Biz Analysis Frontend (Vite + React + TS)

Minimal UI that calls a FastAPI backend for business analyses.

## Features

- **BCG Matrix Analysis**: Interactive scatter chart with sample data
- **Snapshot Management**: Save and list analysis results with kind filtering
- **PNG Export**: Export BCG charts as downloadable images
- **Demo Banner**: Dismissible banner indicating demo mode
- **Health Check**: Backend connectivity verification

## Local Dev
```bash
cd frontend
cp .env.example .env
# edit .env and set VITE_API_BASE_URL=https://YOUR_RAILWAY_API_URL
npm i

# Export PNG functionality
npm i html2canvas

npm run dev
```

Open http://localhost:5173

## Deploy (Vercel)

Push this repo to GitHub (e.g., afrazja/bizanalysis-frontend).

In Vercel, New Project → Import GitHub repo.

Framework Preset: Vite → Build Command `npm run build` → Output `.dist` or `dist`.

Environment Variable: `VITE_API_BASE_URL` = your Railway API base URL.

Deploy → test the live URL.
