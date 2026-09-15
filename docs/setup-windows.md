# Windows Setup

## Prerequisites

- Windows 10/11
- Python 3.10+
- Git
- VS Code (recommended)

## First run

```powershell
git clone https://github.com/robbirizaldi/oao-ai-router.git
cd oao-ai-router
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and add a newly generated API key.

Start:

```powershell
.\.venv\Scripts\python.exe app.py
```

Open `http://127.0.0.1:5000`.

## Common issue

Do not open `frontend/index.html` with VS Code Live Server on port `5500`.

The application frontend is served by Flask on port `5000` because the frontend calls backend routes such as `/api/chat`.
