# Career-Aware Learning Recommender

A final-year project prototype for recommending computing learning paths by career goal, current skill level, skill gaps, completed topics, preferred difficulty, and curated learning-resource metadata.

The core learning strategy is:

> Learn just enough, build early, deepen later.

This is a recommendation-engine prototype, not a full LMS.

## Current App\n\nThe current working prototype remains available in Streamlit. A new React + FastAPI version is being added as the polished app direction: React owns the full user interface, and FastAPI reuses the existing Python recommender modules and CSV data.

## Pathways

Current pathways:

- Data Analyst
- Data Scientist
- Data Engineer
- Machine Learning Engineer
- Software Developer

Data Scientist can also appear as a follow-on pathway from Data Analyst after the learner completes the practical analyst foundation.

## Features

- Sample and custom learner profiles
- Session skill bank shared across overlapping pathways
- Dynamic staged learning paths
- Stable completion checkboxes that do not reorder completed items
- Clickable source lines for modules and resources
- Optional structured tracks kept separate from core recommendations
- Purple mastery message when a pathway is fully completed
- Research View with model outputs, explanations, and evaluation metrics

Learning stages:

1. Learn just enough
2. Start a practical project
3. Deepen later
4. Optional structured tracks

## Recommender Models

Implemented models:

- Popularity baseline
- Content-based recommender
- Hybrid career-aware recommender

The hybrid model considers:

- Career/pathway relevance
- Learner skill gaps
- Difficulty match
- Prerequisite match
- Resource quality and popularity
- Content similarity

Latest metrics:

| Model | Precision@5 | Recall@5 | NDCG@5 |
|---|---:|---:|---:|
| Popularity | 0.2727 | 0.0580 | 0.2878 |
| Content-based | 0.8182 | 0.1820 | 0.8398 |
| Hybrid | 0.9273 | 0.2067 | 0.9386 |

## Repository Structure

```text
assets/                     App visual assets
data/                       Curated resources, learner profiles, skills, judgements
docs/                       Report drafts, methodology notes, appendices
outputs/                    Generated metrics, recommendations, report output
frontend/                   React user interface\nsrc/api/main.py              FastAPI backend for the React app\nsrc/app.py                  Streamlit backup/current prototype\nsrc/run_pipeline.py          Pipeline and evaluation runner\nsrc/edu_recommender/         Data loading, models, evaluation, path logic, UI helpers\nrequirements.txt             Python dependencies for Streamlit and FastAPI
```

## Run Locally

Install Python dependencies if needed:

```powershell
python -m pip install -r requirements.txt
```

Run the FastAPI backend:

```powershell
python -m uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000
```

Run the React frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

Run the Streamlit backup app:

```powershell
python -m streamlit run src\app.py
```

Run the evaluation pipeline:

```powershell
python src\run_pipeline.py
```

The pipeline writes recommendation and metric outputs into `outputs/`.\n## Deploy On Streamlit Community Cloud

Use these settings:

```text
Repository: chewy990/career-aware-learning-recommender
Branch: main
Main file path: src/app.py
```

Streamlit Cloud will use `requirements.txt` from the repository root.

## Data Notes

The skill map uses a 0-3 scale:

| Score | Meaning |
|---:|---|
| 0 | Not central to the pathway |
| 1 | Useful supporting skill |
| 2 | Important skill |
| 3 | Core high-priority skill |

Source evidence and methodology notes are documented in:

- `data/skill_sources.csv`
- `docs/skill_map_methodology.md`
- `docs/evaluation_design.md`

## Security Notes

Do not commit local secrets or deployment keys. The repository ignores `.env*`, local dependency folders, and debug artifacts.

