# Skill Radar System

A lightweight prototype that lets students register their skills, take a short skill‑test, and see matched peers based on:

1. **Skill interest / offering** – you get matched with someone who can teach the skill you want to learn.
2. **Skill level** – Beginner, Intermediate or Advanced tags are derived from a quick quiz.
3. **Availability overlap** – the more overlapping hours, the higher the rank.

The app consists of a **React** frontend and a **Node.js/Express** backend with a **SQLite** datastore. It runs completely locally (no external services required).

## Project structure
```
skill‑radar/
├─ backend/          # Express server & SQLite DB
│   ├─ package.json
│   ├─ server.js
│   ├─ db.js
│   └─ tests/quiz.json
├─ frontend/         # React UI (Create‑React‑App)
│   ├─ package.json
│   └─ src/
│       ├─ index.js
│       └─ App.js
├─ .gitignore
└─ README.md   (this file)
```

## Prerequisites (Windows)
- **Node.js** (v20 or later) – download from https://nodejs.org/
- **Git** (optional, for pushing to GitHub)

## Setup & Run locally
```powershell
# 1️⃣ Navigate to the project root (adjust the path if you placed it elsewhere)
cd C:\Users\Mantavya\.gemini\antigravity\scratch\skill-radar

# 2️⃣ Install backend dependencies
cd backend
npm install   # creates node_modules and skillradar.db on first run
cd ..

# 3️⃣ Install frontend dependencies (axios was added automatically)
cd frontend
npm install   # pulls React, Bootstrap, axios, etc.
cd ..

# 4️⃣ Start the backend (default port 5000)
cd backend
npm start &   # the & backgrounds the process – you’ll see "Backend listening on 5000"
cd ..

# 5️⃣ Start the React dev server (default port 3000)
cd frontend
npm start
```
Your browser will open at `http://localhost:3000`. Fill out the form, take the quiz, and you’ll see matched peers.

## Pushing to GitHub
1. **Create a new repo** on GitHub (e.g., `skill-radar`).
2. Initialise git locally and push:
```powershell
cd C:\Users\Mantavya\.gemini\antigravity\scratch\skill-radar
git init
git add .
git commit -m "Initial prototype"
git remote add origin https://github.com/<YOUR_USERNAME>/skill-radar.git
git branch -M main
git push -u origin main
```
3. Enable GitHub Pages (optional) – you can build the frontend with `npm run build` (creates `frontend/build`) and serve those static files with the Express server or any static host.

## What to customise later
- Add more skills and corresponding quizzes in `backend/tests/quiz.json`.
- Replace the simple hour parser with a richer library if you need finer granularity.
- Deploy the backend to a cloud service (e.g., Render, Railway) and update `BACKEND_URL` in `frontend/src/App.js`.
- Add user authentication (OAuth, Google, etc.) for a production‑ready product.

---
Feel free to ask if you hit any issues while installing or running the app, or if you need help configuring deployment!
