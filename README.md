# Skinfolio

Skinfolio is a React + TypeScript skincare product tracker with a small, curated ingredient knowledge base. Deterministic rules produce structured matches first; the backend can ask Gemini to explain those matches. Gemini does not invent or decide the interaction rules.

## Setup

Use Node.js and npm. Install the two app dependencies in separate terminals:

```sh
npm --prefix backend install
npm --prefix frontend install
```

Create `frontend/.env.local` with the Firebase web configuration and API URL:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:8787
```

Create `backend/.env`:

```dotenv
GEMINI_API_KEY=
PORT=8787
CORS_ORIGIN=http://localhost:5173
```

Keep `GEMINI_API_KEY` in the backend environment only. Configure Firebase Authentication anonymous sign-in and deploy the repository's `firestore.rules` if you want per-user product persistence. My Rack and routines use the existing Firestore services; the static starter catalogue and knowledge base do not require Firestore.

Start the API from `backend` and the Vite app from `frontend`:

```sh
npm run dev
```

## Analysis and knowledge endpoints

- `GET /api/health` reports API availability.
- `GET /api/knowledge` returns the starter product catalogue, ingredient knowledge, and interaction rules.
- `POST /api/analyse` accepts `{ "products": [...] }`, `{ "product": {...} }`, or `{ "ingredients": ["Retinol"] }`.
- `POST /api/extract` accepts JPEG, PNG, or WebP image bytes and uses Gemini to read label details. Extracted ingredient lists should be reviewed against the package before marking them complete.

Analysis responses include deterministic findings, per-product and per-ingredient matches, source references, warnings for unknown or incomplete data, and an optional `aiSummary` plus `aiGenerated` flag. When Gemini is not configured or unavailable, the API returns a cautious fallback summary and sets `aiGenerated` to `false`.

The starter data in `shared/knowledge.ts` is intentionally small. Catalogue formulations can vary by date and region, as noted by the manufacturer. Unrecognized ingredients are reported as unknown rather than assumed safe. A missing rule match is not a safety guarantee.

## Build and tests

```sh
npm --prefix backend test
npm --prefix backend run build
npm --prefix frontend run build
```

The backend test cases cover catalogue references, recognized and unknown ingredients, a sourced retinol/glycolic-acid caution, ingredients within a single formula, and missing or partial ingredient lists.
