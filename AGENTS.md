# ECHOO

Monorepo: `backend/` Express API, `frontend/` Vite React.

## Cursor Cloud specific instructions

Cloud Agents clone https://github.com/Poshu1984/ECHOO.

1. After install, backend listens on 3000 and frontend on 5173 (see `.cursor/environment.json`).
2. Do not commit `.env`. Copy `backend/.env.example` and `frontend/.env.example` locally in the VM if secrets are injected as environment variables.
3. Required secrets (set in Cursor Cloud Agents Secrets, never in git): `GOOGLE_TTS_API_KEY`, `JWT_SECRET`, `ECHO_ADMIN_USER`, `ECHO_ADMIN_PASSWORD`, `FRONTEND_URL`. Optional: `ANTHROPIC_API_KEY`, `GOOGLE_GEMINI_API_KEY`.
4. Health check: `GET http://localhost:3000/api/health`
5. Frontend API base: `VITE_API_URL=http://localhost:3000`
6. Do not print API keys in logs or commits.
