# Supabase Edge Functions: Docker-based Deploy

This repo includes a Docker-based workflow to deploy all Edge Functions without installing the Supabase CLI locally.

## Requirements
- Docker Desktop running on your machine
- A Supabase Personal Access Token with access to the project
- Your project ref (e.g. `lblcjyeiwgyanadssqac`)

## One-time environment variables (PowerShell)
Set these in your current terminal session (replace with your values):

```powershell
$env:SUPABASE_ACCESS_TOKEN = "<YOUR_ACCESS_TOKEN>"
$env:SUPABASE_PROJECT_REF = "lblcjyeiwgyanadssqac"
```

## Deploy all functions
Run from the `express-supabase-api/supabase` folder:

```powershell
cd .\express-supabase-api\supabase
# Deploy using Docker Compose
docker compose -f docker-compose.functions.yml run --rm deploy
```

This will:
- Start a `supabase/cli` container
- Mount the current folder
- Deploy every function under `functions/` (skips `_shared/`)

## Notes
- If you add new functions, just rerun the same command.
- The script exits early if `SUPABASE_ACCESS_TOKEN` or `SUPABASE_PROJECT_REF` aren’t set.
- The updated CORS helper will be included automatically on redeploy.
