# Skinfolio

Mobile web app that checks a prospective skincare product against your whole routine.

## Structure
- `frontend/` React + Vite + Tailwind (mobile-first)
- `backend/` Express API: rule-based compatibility checker + Gemini explanations
- `shared/` TypeScript types used by both
- `firestore.rules`, `firebase.json` Firebase config

## Getting started
1. `git clone <repo-url> && cd skinfolio`
2. `cp .env.example frontend/.env` and `cp .env.example backend/.env`
   (ask the team lead for the real Firebase / Gemini values)
3. `npm run install:all`
4. In two terminals: `npm run dev:backend` and `npm run dev:frontend`
5. Open http://localhost:5173 (use browser dev tools mobile view)

## Team workflow
- `main` is protected: no direct pushes, merge via Pull Request (1 review).
- Branch names: `feature/<short-name>`, `fix/<short-name>`.
- Commit small, pull `main` often.
- Never commit `.env` or any API key.

## P0 checklist
- [ ] Skin profile
- [ ] Scan / manual entry
- [ ] Extract ingredients
- [ ] AI-assisted product analysis
- [ ] Save to My Rack
- [ ] AM/PM routines
- [ ] Whole-routine analysis
- [ ] Prioritised findings + next steps
- [ ] Persistence (Firestore)
