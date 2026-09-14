# Hope Gate — FastAPI + React + MongoDB rebuild

A rebuild of the original Streamlit prototype (`app.py` + `ml_python.ipynb`)
as a proper client/server app: FastAPI backend, MongoDB for storage, React
(Vite) frontend. Bilingual English/Arabic with RTL is preserved throughout.

## What changed vs. the original prototype

- **Real auth.** Doctor login used to accept any non-empty string. It's now
  bcrypt-hashed passwords + JWTs (`app/security.py`, `app/routers/auth.py`).
- **Real storage.** Patient inquiries and doctor records used to be
  read-whole-file-append-rewrite `.xlsx`/`.csv` on local disk (slow at scale,
  no locking, plaintext). They're now MongoDB documents with indexes.
- **One training implementation, not two.** The notebook and `app.py` each
  carried their own copy of the training code. `app/ml/training.py` is now
  the single source, imported by both `scripts/train_model.py` and the API's
  cold-start fallback.
- **Hospital data migrated, fabricated fields dropped.** The 29 real
  hospital entries moved to `app/data/hospitals_seed.json` → MongoDB. The
  `success_rate` / `annual_cases` fields were **not** carried forward — they
  were invented numbers that the original app deliberately never rendered.
  Add them back only with a real, citable source.
- **The image-upload "lab scanner" was reinstated at the user's request,
  with one change.** It reproduces the original's mock exactly (same
  hash-derived, deterministic-per-file measurement generation) via
  `POST /api/reports/mock-image-scan`. The difference: the original
  disclosed the mock only in a code comment. Here, `is_simulated: true`
  and a plain-language notice are in the API response itself, and the
  frontend (`DoctorNewRecord.jsx`) renders that as a persistent on-screen
  label on both the upload panel and the result — a doctor can't reach a
  probability without seeing "SIMULATED RESULT" next to it. The paste-report
  path (`POST /api/reports/parse-text`) does real regex extraction from
  pasted text, same as the original.
- **No deprecated libraries.** PyJWT (not python-jose), bcrypt directly (not
  passlib), pydantic-settings (not the old `BaseSettings`), FastAPI's
  `lifespan` context manager (not `on_event`), Motor as the async Mongo
  driver, Vite + React Router v7 on the frontend (patched past
  CVE-2025-68470 — verified with `npm audit`: 0 vulnerabilities).

## What still needs work before real patients touch this

- **Model scope is unchanged.** It's still trained on post-biopsy cell
  measurements, not pre-diagnosis risk factors — see the disclaimer surfaced
  on every prediction and on the home page.
- **Data protection.** MongoDB here has no auth configured and no
  encryption at rest — fine for local dev, not fine for real patient data.
  Add MongoDB auth, TLS, and field-level encryption for sensitive fields
  before any real deployment, and review against Egypt's Personal Data
  Protection Law.
- **Rate limiting / abuse protection** isn't implemented on the public
  `/api/patients/inquiries` and `/api/predict` endpoints.
- **Frontend prod build.** The frontend Dockerfile runs the Vite dev server
  for convenience; for real deployment, build static assets
  (`npm run build`) and serve them from nginx or a CDN instead.

## Deploying

- **Render** (backend as a Docker web service + frontend as a static site,
  MongoDB via Atlas) is a straightforward fit since it runs the existing
  `Dockerfile` as a persistent process — no rearchitecting needed.
- **Vercel** works well for the frontend directly. The backend can run there
  too via Vercel's Python runtime, but it deploys as serverless functions,
  not a persistent server — see the note in `app/ml/model.py` about cold
  starts before choosing that route.
- Either way, the trained model artifacts in `app/ml/artifacts/` are
  committed to the repo (not gitignored) specifically so a fresh deploy
  loads them instead of retraining on every cold start / redeploy. Set
  `frontend`'s `VITE_API_URL` env var to the backend's deployed URL at
  build time if frontend and backend live on different domains.

## Running locally

### Option A — Docker Compose (fastest)
```
cp backend/.env.example backend/.env   # edit JWT_SECRET
docker compose up --build
```
- Backend: http://localhost:8000/docs (interactive API docs)
- Frontend: http://localhost:5173

### Option B — manual
```
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit JWT_SECRET; point MONGODB_URI at your Mongo
python -m scripts.train_model      # writes app/ml/artifacts/*
python -m scripts.seed_hospitals   # loads hospitals into Mongo
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Project layout
```
backend/
  app/
    main.py            FastAPI app (lifespan startup: load model, ensure indexes)
    config.py           env-driven settings
    database.py          Motor/MongoDB connection + indexes
    security.py          bcrypt hashing + JWT issue/verify
    models/               Pydantic request/response schemas
    ml/
      training.py         single source of truth for training the demo model
      model.py             loads artifacts, exposes predict_one/predict_batch
    routers/               auth, predict, batch, hospitals, patients, dashboard
    data/hospitals_seed.json
  scripts/
    train_model.py
    seed_hospitals.py
frontend/
  src/
    api/client.js          axios instance, attaches JWT, handles 401
    context/                AuthContext (JWT/session), LanguageContext (RTL)
    i18n/                   en.json / ar.json
    components/             NavBar, Disclaimer, HospitalRow, ProtectedRoute
    pages/                  Home, Predict, PatientIntake, Hospitals,
                             BatchPredict, DoctorAuth, DoctorDashboard, Analytics
docker-compose.yml
```
