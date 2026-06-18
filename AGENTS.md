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

- User flow: indicate current skills first, then choose a pathway/course.
- React skill levels use words everywhere: `Not started`, `Basic`, `Working knowledge`, `Confident`.
- Do not show sample profile presets in the learner flow.
- Session skills persist across pathway switches and overlapping skills.
- Completed resources must stay visible and keep their original order.
- Completing an item must not reorder, hide, or collapse recommendations.
- Use checkboxes labelled `Completed` beside resources.
- Keep `Reset progress`; only it clears completed resources.
- Keep `Reset skills`; only it clears saved session skills.
- Source lines must be clickable and formatted like `From: Provider - Module title`; whole courses may use `From: Provider`.
- Broad tracks should appear only as optional structured references.
- Show the purple congratulatory mastery message for every fully completed pathway.
- Keep Research View readable with wrapped explanations and generated metrics.

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
