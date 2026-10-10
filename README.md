# Skinfolio

Skinfolio is a React + TypeScript skincare product tracker with a small, curated ingredient knowledge base. Deterministic rules produce structured matches first; the backend can ask Gemini to explain those matches. Gemini does not invent or decide the interaction rules.

## Setup

Use Node.js and npm. Install the two app dependencies:

```sh
npm --prefix backend install
npm --prefix frontend install
```

Copy `frontend/.env.example` to `frontend/.env.local` and add the Firebase web configuration. The scanner uses `http://localhost:8787` automatically in development if `VITE_API_URL` is empty; the checked-in example includes that value explicitly.

Copy `backend/.env.example` to `backend/.env` and set the Gemini key:

```dotenv
GEMINI_API_KEY=
PORT=8787
CORS_ORIGIN=http://localhost:5173
```

Keep `GEMINI_API_KEY` in the backend environment only. Configure Firebase Authentication anonymous sign-in and deploy the repository's `firestore.rules` if you want per-user product persistence. My Rack and routines use the existing Firestore services; the static starter catalogue and knowledge base do not require Firestore.

Start the API from `backend` and the Vite app from `frontend` in separate terminals:

```sh
cd backend && npm run dev
# in a second terminal
cd frontend && npm run dev
```

Vite reads `frontend/.env.local` when its dev server starts. Restart `npm run dev` after changing Vite variables. Vercel embeds `VITE_*` variables in the frontend at build time, so redeploy/rebuild after changing them.

## Deploying the backend and frontend on Vercel

The backend is an Express app that Vercel can run as a Node.js Function. `backend/src/index.ts` is the recognized Express entry point and exports the app for Vercel. Local and traditional server execution uses `backend/server.ts`, which listens on `process.env.PORT` (default `8787`). No `vercel.json` is required for this Express deployment.

### Create the backend Vercel project

1. In the Vercel dashboard, choose **Add New → Project** and import `https://github.com/aaikm2005/skinfolio`.
2. Set **Root Directory** to `backend`.
3. In the Root Directory settings, enable **Include source files outside of the Root Directory in the Build Step**. The backend imports types and knowledge from the sibling `shared/` directory.
4. Use the Express preset if Vercel detects it. Keep the output directory unset. Use `npm run build` as the build command if a build command must be specified; the function entry is `src/index.ts`.
5. Select Node.js 24.x (the Vercel default; the Gemini SDK requires Node 20 or later).
6. In **Settings → Environment Variables**, add `GEMINI_API_KEY` with the real Gemini API key and `CORS_ORIGIN` with the exact deployed frontend origin, such as the origin shown in that frontend's Vercel project. Do not add the Gemini key to the frontend project or any `VITE_*` variable. Add preview origins as comma-separated values only if preview deployments should be allowed.
7. Deploy. Vercel will display the backend deployment URL; that URL is not present in this repository and must not be guessed.

### Connect the existing frontend

In the Vercel project serving `frontend/`, add `VITE_API_URL` as an environment variable with the backend's deployed origin (scheme and host only; no trailing `/api/extract`). Set it for Production and any Preview environment that should scan products, then redeploy the frontend. Vite embeds this variable during the build.

### Request size limitation

The Express route accepts JPEG, PNG, and WebP raw image bodies up to 8 MB. Vercel Functions impose a hard **4.5 MB request-body limit** before Express runs, so Vercel cannot accept all files allowed by the current frontend's 8 MB selection limit. Images below Vercel's cap reach the route; larger ones receive Vercel's 413 response before backend validation. This platform limit cannot be raised with Express or `vercel.json`. Because this task is backend-only, the frontend was left unchanged; to support the full current 8 MB range, the frontend must compress images or the API must use a host that accepts larger request bodies.

### Verify the deployment

After deployment, use the actual URL Vercel assigned:

```sh
curl -i "https://<backend-origin>/api/health"
curl -i -X POST "https://<backend-origin>/api/extract" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/clear-product-photo.jpg
```

The health endpoint should return `200` and `{ "ok": true }`. A successful extraction returns structured product data; expected error cases include `400` for empty or invalid image bytes, `413` for request size limits, `415` for unsupported MIME types, `503` when `GEMINI_API_KEY` is missing, `422` when the photo has no readable product text, and `502` when Gemini fails or returns invalid data. Use a real JPEG, PNG, or WebP below 4.5 MB and inspect Vercel Function logs if extraction fails. This repository has not been deployed, so no live URL or extraction result is claimed.

## Analysis and knowledge endpoints

- `GET /api/health` reports API availability.
- `GET /api/knowledge` returns the starter product catalogue, ingredient knowledge, and interaction rules.
- `POST /api/analyse` accepts `{ "products": [...] }`, `{ "product": {...} }`, or `{ "ingredients": ["Retinol"] }`.
- `POST /api/extract` accepts a JPEG, PNG, or WebP image body (up to 8 MB) and uses Gemini to read label details. The scanner can submit several photos to this same endpoint, then combines results and lets the user edit the ingredient names. Raw visible text and uncertain readings are shown for verification. Uncertain AI readings are excluded from compatibility matching unless the user corrects them or confirms the complete list; extracted ingredients are not authoritative and should be checked against the package.

Analysis responses include deterministic findings, per-product and per-ingredient matches, source references, warnings for unknown or incomplete data, and an optional `aiSummary` plus `aiGenerated` flag. When Gemini is not configured or unavailable, the API returns a cautious fallback summary and sets `aiGenerated` to `false`.

The starter data in `shared/knowledge.ts` is intentionally small. Catalogue formulations can vary by date and region, as noted by the manufacturer. Unrecognized ingredients are reported as unknown rather than assumed safe. A missing rule match is not a safety guarantee.

## Build and tests

```sh
npm --prefix backend test
npm --prefix backend run build
npm --prefix frontend run build
```

The backend test cases cover catalogue references, recognized and unknown ingredients, a sourced retinol/glycolic-acid caution, ingredients within a single formula, and missing or partial ingredient lists.
