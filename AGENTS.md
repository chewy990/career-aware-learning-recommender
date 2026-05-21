# AGENTS.md

## Project

Career-aware educational content recommendation system for computing learners.

Project folder:

`C:\Users\Admin\Documents\mods\FYP`

Keep all project files in this folder.

## Goal

Build an FYP data science recommender prototype, not a full LMS.

It should recommend precise learning paths based on:

- career pathway
- current skill levels
- skill gaps
- completed topics
- preferred difficulty
- learning resource metadata

Target pathways:

- Data Analyst
- Machine Learning Engineer
- Software Developer

Main idea: avoid rigid full career tracks. Recommend “learn just enough”, start practical work early, then deepen later.

## Key Files

- `src/app.py` - Streamlit app
- `src/run_pipeline.py` - pipeline/evaluation runner
- `src/edu_recommender/models.py` - recommender logic
- `src/edu_recommender/evaluation.py` - Precision@K, Recall@K, NDCG@K
- `data/resources.csv` - learning resources
- `data/skill_map.csv` - pathway skill map
- `data/learner_profiles.csv` - sample learners
- `data/relevance_judgements.csv` - evaluation labels
- `assets/learning-path-hero.png` - local header image
- `docs/` - report and methodology docs
- `outputs/` - generated results

## Current App Behavior

Learning path stages:

1. `1. Learn just enough`
2. `2. Start a practical project`
3. `3. Deepen later`
4. `Optional structured tracks`

Important UX rules:

- Show all recommendations in each expander.
- Checking a resource must not reorder recommendations.
- Use checkboxes beside each resource with label `Completed`.
- Keep `Reset progress`.
- Do not show a progress table.
- Show skill increases as `SQL 1 > 2`.
- Optional readings/videos were removed.
- Broad tracks should only appear as optional structured references.

## Current UI Notes

- Custom visual theme is in `apply_visual_theme()` in `src/app.py`.
- Header uses `assets/learning-path-hero.png`.
- Tabs use red/maroon text for visibility.
- Research View recommendation explanations use wrapped HTML rows, not a cramped dataframe.
- Checkbox style was reverted to the previous accent style after the black-border-only experiment.

## Current Models

Implemented models:

- popularity baseline
- content-based recommender
- hybrid recommender

Hybrid model considers:

- career/pathway relevance
- skill gap match
- difficulty match
- prerequisite match
- resource quality

Latest known metrics:

- popularity: `Precision@5=0.2571`, `Recall@5=0.0574`, `NDCG@5=0.2524`
- content_based: `Precision@5=0.8571`, `Recall@5=0.2044`, `NDCG@5=0.8668`
- hybrid: `Precision@5=0.9714`, `Recall@5=0.2308`, `NDCG@5=0.9758`

## Run

Use bundled Python if normal `python` is unavailable:

`C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`

Run app:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m streamlit run src\app.py
```

App URL:

`http://localhost:8501/`

Run pipeline:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" src\run_pipeline.py
```

## Test Before Finalizing

Check:

- app loads
- both tabs work
- sample/custom profiles work
- each path stage has content
- checking a resource does not reorder recommendations
- reset clears progress
- Research View remains readable
- pipeline still runs

## Git Note

Previous push was blocked because Git author identity was not configured.

Needed before commit:

```powershell
git config user.name "Jaslyn Chan"
git config user.email "chewy990@users.noreply.github.com"
```

