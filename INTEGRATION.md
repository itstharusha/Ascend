# Frontend-Backend Integration Guide

This document describes how the frontend and backend are connected.

## Architecture Overview

- **Backend**: FastAPI server running on `http://localhost:8000`
- **Frontend**: Next.js app running on `http://localhost:3000`
- **API Client**: Centralized API client in `frontend/lib/api/`

## Environment Variables

### Frontend
Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If not set, it defaults to `http://localhost:8000`.

### Backend
The backend uses environment variables from `.env` in the root directory:
- `GROQ_API_KEY`: Required for LLM API calls
- `LLM_MODEL`: Optional, defaults to "llama-3.1-70b-versatile"

## Starting the Application

### 1. Start the Backend

```bash
# From project root
uvicorn app.api.main:app --reload --port 8000
```

Or using Python:
```bash
python -m uvicorn app.api.main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
# From frontend directory
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`.

## API Endpoints

### Consultations

- `POST /api/consultations` - Create a new consultation
- `GET /api/consultations` - List all consultations
- `GET /api/consultations/{id}` - Get a single consultation
- `POST /api/consultations/{id}/feedback` - Submit feedback
- `DELETE /api/consultations/{id}` - Delete a consultation

## Data Flow

1. **Creating a Consultation**:
   - User fills form in frontend (`/dashboard/new-consultation`)
   - Frontend calls `createConsultation()` from API client
   - API client sends POST to `/api/consultations`
   - Backend processes through LangGraph workflow
   - Backend returns consultation data
   - Frontend stores in Zustand store and redirects to detail page

2. **Fetching Consultations**:
   - Frontend calls `fetchConsultations()` from API client
   - API client sends GET to `/api/consultations`
   - Backend returns list from in-memory store
   - Frontend updates Zustand store

3. **Viewing a Consultation**:
   - Frontend calls `fetchConsultationById()` from API client
   - API client sends GET to `/api/consultations/{id}`
   - Backend returns consultation data
   - Frontend displays in detail view

## CORS Configuration

CORS is configured in `app/api/main.py` to allow:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

For production, add your production domain to the `allow_origins` list.

## Error Handling

The API client (`frontend/lib/api/client.ts`) handles:
- Network errors
- HTTP error responses
- JSON parsing errors
- Empty responses

Errors are wrapped in `ApiClientError` with status codes and details.

## Type Mapping

The API client (`frontend/lib/api/consultations.ts`) handles mapping between:
- Backend snake_case fields → Frontend camelCase fields
- Backend date strings → Frontend Date objects
- Backend response structure → Frontend TypeScript types

## Storage

Currently, consultations are stored in-memory in the backend. This means:
- Data is lost on server restart
- For production, implement a database (PostgreSQL, MongoDB, etc.)

## Visualization Data

The backend returns `visualization_code` (Python code for plotly), but the frontend expects structured `VisualizationData`. Currently:
- If `visualization_data` is provided by backend, it's used
- Otherwise, the frontend can handle missing visualization data gracefully

Future enhancement: Execute the Python visualization code server-side and return structured data.
