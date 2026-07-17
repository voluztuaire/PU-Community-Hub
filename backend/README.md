# Backend — PU Academic Hub

This folder contains the **backend logic** for the project.

> ⚠️ **Important architecture note**
> The actual backend that runs in production is implemented as **Supabase Edge Functions** (Deno/TypeScript) located in `/supabase/functions/`.
>
> The Python file `main.py` in this folder is the **original FastAPI reference**.
> It is kept here so you can:
> - Run it locally yourself (`uvicorn main:app --reload`) if you want a Python backend.
> - Read it as a spec — every endpoint here has a matching Edge Function.

## Environment

The deployed Edge Functions read `GROQ_API_KEY` from Supabase secrets (already configured in production).
If you run `main.py` locally, create a `.env` here with:

```
GROQ_API_KEY=your_groq_key
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Run the Python backend locally (optional)

```bash
cd backend
python -m venv .venv 
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
