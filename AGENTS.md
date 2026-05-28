# AGENTS.md

## Project

Career-aware educational content recommendation system for computing learners.

Project folder: `C:\Users\Admin\Documents\mods\FYP`

Build an FYP data science recommender prototype, not a full LMS. The system recommends precise learning paths from career pathway, current skills, skill gaps, completed topics, preferred difficulty, and resource metadata.

Target pathways:

- Data Analyst
- Machine Learning Engineer
- Software Developer

Core idea: avoid rigid full career tracks. Recommend "learn just enough", start practical work early, then deepen later.

## Key Files

- `src/app.py` - Streamlit app
- `src/run_pipeline.py` - pipeline/evaluation runner
- `src/edu_recommender/models.py` - recommender logic
- `src/edu_recommender/evaluation.py` - Precision@K, Recall@K, NDCG@K
- `data/*.csv` - resources, skill map, learner profiles, relevance labels, skill sources
- `assets/desktop-background.jpg` - current app banner image
- `docs/report_draft.md` - preliminary report draft
- `docs/appendices/` - organised appendices
- `docs/appendices/screenshots/` - Appendix D screenshots
- `outputs/` - generated pipeline results

## Current Report Notes

- Preliminary report must have exactly four chapters: Introduction, Literature Review, Project Design, Feature Prototype.
- Appendices and References are present but not numbered as chapters.
- Contents are simple bullets, not linked anchors.
- Appendices A-D are cross-referenced in the main text.
- Current references use open sources where possible.
- Word count is safely below the strict limits.
- Remaining required submission item: 3-5 minute MP4 prototype video.

## Current App Rules

Learning path stages:

1. `1. Learn just enough`
2. `2. Start a practical project`
3. `3. Deepen later`
4. `Optional structured tracks`

UX rules:

- Checking `Completed` must not reorder recommendations.
- Keep `Reset progress`.
- Do not show a progress table.
- Show skill increases as `SQL 1 > 2`.
- Broad tracks only appear as optional structured references.
- Research View explanations use wrapped HTML rows.
- Research View metrics table, NDCG chart, and raw hybrid output use a white theme.
- Research View selector/slider labels should be black; slider is narrow and grey.

## Models And Metrics

Implemented models:

- popularity baseline
- content-based recommender
- hybrid recommender

Latest metrics:

- popularity: `Precision@5=0.2571`, `Recall@5=0.0574`, `NDCG@5=0.2524`
- content_based: `Precision@5=0.8571`, `Recall@5=0.2044`, `NDCG@5=0.8668`
- hybrid: `Precision@5=0.9714`, `Recall@5=0.2308`, `NDCG@5=0.9758`

## Run

Bundled Python:

`C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`

Install requirements if needed:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m pip install -r requirements.txt
```

Run app:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m streamlit run src\app.py
```

App URL: `http://localhost:8501/`

Run pipeline:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" src\run_pipeline.py
```

## Check Before Finalizing

- app loads
- both tabs work
- sample/custom profiles work
- each path stage has content
- completing a resource does not reorder recommendations
- reset clears progress
- Research View remains readable and white themed
- pipeline runs
- report still has exactly four chapters and remains under word limits
- appendices remain cross-referenced

## Git Note

Before committing:

```powershell
git config user.name "Jaslyn Chan"
git config user.email "chewy990@users.noreply.github.com"
```
