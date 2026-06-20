# AGENTS.md

## Project

Career-aware educational content recommender for computing learners.

Local project folder: `C:\Users\Admin\Documents\mods\FYP`

This is an FYP prototype, not a full LMS. It recommends staged learning paths from career pathway, current skills, skill gaps, completed topics, preferred difficulty, and curated resource metadata.

Core idea: **learn just enough, build early, deepen later**.

## Product Direction

Primary polished app direction: React frontend plus FastAPI backend, reusing the existing Python recommender modules and CSV data.

Streamlit in `src/app.py` remains the backup/deployed prototype. Framer is no longer part of the main architecture.

## Pathways

Current pathways:

- Data Analyst
- Data Scientist
- Data Engineer
- Machine Learning Engineer
- Software Developer

Data Scientist can also appear as a follow-on path from Data Analyst after the practical analyst foundation is complete.

## Key Files

- `frontend/` - React learner interface
- `frontend/public/landing-hero.jpg` - current still-image landing hero background
- `frontend/public/landing-page-video.mp4` - imported landing video source asset, not currently used by the hero
- `src/api/main.py` - FastAPI API for React frontend
- `src/app.py` - Streamlit prototype
- `src/run_pipeline.py` - evaluation runner
- `src/edu_recommender/data.py` - CSV loading
- `src/edu_recommender/models.py` - popularity, content-based, hybrid recommenders
- `src/edu_recommender/learning_path.py` - staged path construction
- `src/edu_recommender/ui_helpers.py` - shared Streamlit display helpers
- `data/resources.csv` - resource metadata and pathway relevance columns
- `data/resource_modules.csv` - verified module/source metadata
- `data/skill_map.csv` - pathway skill requirements
- `data/learner_profiles.csv` - sample learners for evaluation/research, not React UI presets
- `data/relevance_judgements.csv` - evaluation labels
- `outputs/` - generated recommendations, metrics, and report output

## Current UX Rules

- React user flow: Landing -> Pathway Selection -> Skill Setup -> Course/Home Dashboard.
- Landing is the first screen and should stay simple for design iteration.
- Keep the landing hero headline split across two lines after the first full stop: `Learn just enough.` then `Build early. Deepen later.`
- Landing uses a still image hero background from `frontend/public/landing-hero.jpg`, a short supporting line, and a `Start Learning` button.
- `Start Learning` sends signed-out users to Login/Register and signed-in users to Pathway Selection.
- Login/Register uses username and password with a show-password eye toggle.
- React auth is backed by FastAPI endpoints and local SQLite; `data/auth.sqlite3` is ignored by git.
- Each account must have isolated browser-local learner progress, keyed by username. Skills, selected pathways, completions, completed topics, and path snapshots must not persist across different accounts.
- Pathway Selection should show pathway cards only. If generated courses already exist, show `Back to Courses`.
- Skill Setup should show the selected pathway's 5 core skill sliders and `Preferred course difficulty`.
- Course/Home Dashboard is the main home after generation and can hold multiple generated pathway courses.
- Dashboard should show all selected/generated pathways as tabs/chips and one active pathway course at a time.
- Switching pathway tabs should feel smooth, using a light slide/fade transition.
- Dashboard actions should include: Landing page, Choose new pathway, Research view, Reset skills, Reset progress.
- Dashboard should include a subtle Logout action.
- React skill levels use words everywhere: `Not started`, `Basic`, `Working knowledge`, `Confident`.
- Do not show sample profile presets in the learner flow.
- Session skills persist across pathway switches and overlapping skills.
- Multiple generated pathway courses share global skills, completed topics, completed item IDs, and completed item history.
- Completed resources must stay visible and keep their original order.
- Completing an item must not reorder, hide, or collapse recommendations.
- Use checkboxes labelled `Completed` beside resources.
- Keep `Reset progress`; only it clears completed resources.
- Keep `Reset skills`; only it clears saved session skills.
- Source lines must be clickable and formatted like `From: Provider - Module title`; whole courses may use `From: Provider`.
- Broad tracks should appear only as optional structured references.
- Show the purple congratulatory mastery message for every fully completed pathway.
- Keep Research View readable with wrapped explanations, current-learner relevant course cards, generated metrics, NDCG@5 chart, dataset summary, and collapsed evaluation-profile examples.
- Research View must include a direct `Back to Courses` button near the top and at the bottom.

## Git Rules

- Always check with the user before committing anything to git.
- Do not commit or push until the user explicitly approves the commit.

## Deployment

Current Streamlit Community Cloud settings:

- Repository: `chewy990/career-aware-learning-recommender`
- Branch: `main`
- Main file path: `src/app.py`
- Requirements file: `requirements.txt`

React/FastAPI local development:

```powershell
# Backend
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Future React/FastAPI deployment will likely split into:

- Frontend: Vercel or Netlify
- Backend API: Render, Railway, or similar Python host

## Current Metrics

- popularity: `Precision@5=0.2727`, `Recall@5=0.058`, `NDCG@5=0.2878`
- content_based: `Precision@5=0.8182`, `Recall@5=0.182`, `NDCG@5=0.8398`
- hybrid: `Precision@5=0.9273`, `Recall@5=0.2067`, `NDCG@5=0.9386`

## Checks

Bundled Python:

`C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m py_compile src\app.py src\run_pipeline.py src\edu_recommender\data.py src\edu_recommender\models.py src\edu_recommender\learning_path.py src\edu_recommender\ui_helpers.py src\api\main.py
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" src\run_pipeline.py
cd frontend
npm run build
```

Do not run Telegram completion notifications; the notifier was removed from this machine.
