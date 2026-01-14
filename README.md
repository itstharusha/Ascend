## AI Business Consultant (FastAPI + Next.js)

Live, no-mock implementation of an AI-powered business consultation app. The backend (FastAPI) exposes real endpoints for auth, consultations, plans/meta, notifications, and PDF export. The frontend (Next.js 16, app router) consumes those endpoints only—no hardcoded data.

### Stack
- **Backend:** FastAPI, LangGraph/LangChain, Uvicorn
- **Frontend:** Next.js 16 (App Router, Turbopack), React/TypeScript, Zustand, Recharts, Tailwind/Shadcn UI
- **Charts:** Backend-generated `visualization_data` → Recharts
- **Auth:** Cookie-based sessions (FastAPI), no mock login
- **Data:** In-memory stores (users, consultations, notifications) for now

### Repository structure
- `app/api/main.py` — FastAPI app and routes
- `src/` — agents, LangGraph workflow, settings
- `frontend/` — Next.js app (dashboard, auth, consultations)
- `requirements.txt` — backend dependencies
- `frontend/package-lock.json` — npm lockfile

### Prerequisites
- Python 3.13+
- Node 18+ (npm)

### Demo
<img width="1913" height="920" alt="image" src="https://github.com/user-attachments/assets/948052a9-805a-4266-8590-a19cf5050f05" />
<img width="1919" height="925" alt="image" src="https://github.com/user-attachments/assets/970da57e-fc6c-49c5-9022-2e90700073d9" />
<img width="1915" height="913" alt="image" src="https://github.com/user-attachments/assets/55487bfb-93c5-4175-b0a0-860633084766" />
<img width="1911" height="917" alt="image" src="https://github.com/user-attachments/assets/a02d447f-40ea-4375-88b1-2dc9a8c6ca7d" />
<img width="1908" height="923" alt="image" src="https://github.com/user-attachments/assets/d4048f11-ef1f-4975-a3b9-9fa1a9093b31" />
<img width="1909" height="918" alt="image" src="https://github.com/user-attachments/assets/408483bf-ef66-4458-ba54-fc3739ac7a93" />


### Environment variables
Create a `.env` (backend root). Example:
```env
GROQ_API_KEY=your-groq-key             # optional, only needed to generate real LLM output
LLM_MODEL=llama-3.1-70b-versatile
TEMPERATURE=0.65
MAX_TOKENS=4096
```
> If `GROQ_API_KEY` is absent, the API still boots, but creating a consultation will raise until a key is provided.

### Backend setup & run
```bash
python -m pip install -r requirements.txt
python -m uvicorn app.api.main:app --reload --port 8000
```
Notes:
- Auth uses HTTP-only `session_id` cookie set by FastAPI.
- Data is in-memory; restart clears users/consultations.

### Frontend setup & run
```bash
cd frontend
npm install
npm run dev
```
By default the frontend calls `http://localhost:8000` (see `NEXT_PUBLIC_API_URL` in `frontend/lib/api/client.ts` if you need to override).

### Usage flow
1) Open `http://localhost:3000/login` and **Create account** (email + password ≥ 8 chars).  
2) After login, you land on the dashboard (plans, usage, consultations).  
3) Start a **New Consultation**: only business/financial steps are required; plan is auto-derived from your subscription (free/starter→basic, pro→premium, enterprise→ultra).  
4) Charts on the consultation detail page are generated from backend `visualization_data`.  
5) PDF export, feedback, and deletion use real API routes.

### Key API routes (non-mock)
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
- User: `GET/PUT /api/user`, `PUT /api/user/notifications`, `PUT /api/user/password`
- Billing/meta: `GET /api/billing/plans`, `GET /api/meta/{industries,business-stages,suggested-goals,consultation-plans,timezones}`
- Consultations: `POST /api/consultations`, `GET /api/consultations`, `GET/PATCH/DELETE /api/consultations/{id}`, `POST /api/consultations/{id}/feedback`, `GET /api/consultations/{id}/export/pdf`
- Notifications: `GET /api/notifications`, `GET /api/notifications/unread-count`, `POST /api/notifications/{id}/read`

### Production-readiness notes
- Add persistent storage (DB) for users/consultations/notifications.
- Secure cookies over HTTPS (`secure=True`) when deployed.
- Provide real authentication/identity provider instead of in-memory users.
- Move charts and files to durable storage if needed; PDFs are generated on demand.

### Preparing for GitHub
Everything is ready to push:
- No mock data remaining.
- Build passes: `npm run build` (frontend), `python -m py_compile app/api/main.py` (backend syntax).  
- Include this README and your `.env` locally (do **not** commit secrets).
