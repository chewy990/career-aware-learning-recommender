# AGENTS.md

## Project

Career-aware educational content recommender for computing learners.

Local project folder: `C:\Users\Admin\Documents\mods\FYP`

This is an FYP prototype, not a full LMS. It recommends staged learning paths from career pathway, current skill levels, skill gaps, completed topics, preferred difficulty, and curated resource metadata.

Core idea: **learn just enough, build early, deepen later**.

## Product Direction

Current working app: Streamlit prototype in `src/app.py`.

Planned polished app direction: React frontend plus FastAPI backend, reusing the existing Python recommender modules and CSV data. Framer is no longer part of the main project architecture.

## Pathways

Current target pathways:

- Data Analyst
- Data Scientist
- Data Engineer
- Machine Learning Engineer
- Software Developer

Data Scientist can also appear as a follow-on path from Data Analyst after the practical analyst foundation is complete.

## Key Files

- `src/app.py` - Streamlit app and learner UI
- `src/run_pipeline.py` - evaluation runner
- `src/edu_recommender/data.py` - CSV loading
- `src/edu_recommender/models.py` - popularity, content-based, hybrid recommenders
- `src/edu_recommender/learning_path.py` - staged path construction
- `src/edu_recommender/ui_helpers.py` - shared display helpers
- `data/resources.csv` - resource metadata and pathway relevance columns
- `data/resource_modules.csv` - verified module/source metadata
- `data/skill_map.csv` - pathway skill requirements
- `data/learner_profiles.csv` - sample learners
- `data/relevance_judgements.csv` - evaluation labels
- `assets/desktop-background.jpg` - app hero image
- `outputs/` - generated recommendations, metrics, and report output

## Streamlit App Rules

Learning stages:

1. `1. Learn just enough`
2. `2. Start a practical project`
3. `3. Deepen later`
4. `Optional structured tracks`

Important UX rules:

- Show all recommendations in each stage; completing items must not reorder, hide, or collapse them.
- Use checkboxes labelled `Completed` beside resources.
- Keep `Reset progress`; only it clears completed resources.
- Keep `Reset skills`; only it clears saved session skills.
- Session skills persist across pathway switches and overlapping skills.
- Custom learners first enter skill levels, then choose one or more pathways with course buttons.
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

React/FastAPI local development:\n\n- Backend: python -m uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000\n- Frontend: cd frontend; npm install; npm run dev\n\nFuture React/FastAPI deployment will likely split into:\n\n- Frontend: Vercel or Netlify\n- Backend API: Render, Railway, or similar Python host

## Current Metrics

- popularity: `Precision@5=0.2727`, `Recall@5=0.058`, `NDCG@5=0.2878`
- content_based: `Precision@5=0.8182`, `Recall@5=0.182`, `NDCG@5=0.8398`
- hybrid: `Precision@5=0.9273`, `Recall@5=0.2067`, `NDCG@5=0.9386`

## Commands

Bundled Python:

`C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`

Run app:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m streamlit run src\app.py
```

Run checks:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m py_compile src\app.py src\run_pipeline.py src\edu_recommender\data.py src\edu_recommender\models.py src\edu_recommender\learning_path.py src\edu_recommender\ui_helpers.py
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" src\run_pipeline.py
```

Do not run Telegram completion notifications; the notifier was removed from this machine.

