# AGENTS.md

## FYP Project Brief

Project: career-aware educational content recommendation system for computing learners. Keep all files in `C:\Users\Admin\Documents\mods\FYP`; move/copy anything created elsewhere back here.

Follow `project briefs/Project_Ideas(1.1).md`, `FYP Project Proposal.md`, and `Project_Work_Schedule.md`. This is a data science recommender prototype/research demo, not a full LMS.

Core thesis: avoid rigid broad tracks by recommending precise, career-aware, skill-gap-based paths where learners learn just enough, start practical work early, then deepen later.

Target pathways: Data Analyst, Machine Learning Engineer, Software Developer.

Use: career goal, current skill levels, skill gaps, completed topics, weak topics, preferred difficulty, and resource metadata.

## Product/UX Rules

App must show personalised recommendations, staged learning path, explanation reasons, simple progress updates, and model comparison metrics.

Stages:

1. `1. Learn just enough`
2. `2. Start a practical project`
3. `3. Deepen later`
4. `Optional structured tracks`

Keep UI clear and light. Broad career tracks are optional references only; never make them the main answer. Do not re-add optional readings/videos unless asked, because reliable titles/creators/thumbnails/links were out of scope.

Interaction rules:

- Show all recommendations inside each expander/dropdown.
- Checking a resource must not reorder, replace, or reshuffle visible recommendations.
- Mark completed resources visually.
- Reset must clear completed resources and checkboxes.
- No progress table.
- Show skill changes simply, e.g. `SQL 1 > 2`.
- Keep only `Reset progress`; do not add an `Update progress` header.
- Use checkboxes beside resources, not a completion dropdown.

Important Streamlit state:

- `progress_reset_version` prevents stale checked boxes after reset.
- `display_learning_path` keeps recommendations stable.
- `path_locked_by_completion` prevents completion-triggered reshuffle.
- Expanders stay open; checkbox completion uses callbacks to avoid jump-to-top behavior.
- Custom skill sliders should not set both `session_state` and `value`.

## Key Files

- `src/app.py` - Streamlit UI, stages, progress behavior
- `src/run_pipeline.py` - pipeline/evaluation outputs
- `src/edu_recommender/models.py` - popularity, content-based, hybrid scoring
- `src/edu_recommender/evaluation.py` - Precision/Recall/NDCG
- `src/edu_recommender/data.py`, `text.py` - loading/text helpers
- `data/resources.csv`, `skill_map.csv`, `skill_sources.csv`, `learner_profiles.csv`, `relevance_judgements.csv`
- `outputs/` - generated recommendations/metrics/report
- `docs/` - report, methodology, evaluation, demo docs

## Models/Metrics

Models: popularity baseline, content-based recommender, hybrid recommender.

Hybrid combines career/pathway relevance, job-skill alignment, skill-gap match, difficulty match, prerequisite match, quality/popularity, and content similarity.

Main path should exclude broad career tracks, very long resources, and optional article/reading/video-style support resources. Stage helpers in `src/app.py`: `project_recommendations_for_profile(...)`, `deepen_recommendations_for_profile(...)`, `structured_tracks_for_profile(...)`.

Latest metrics:

- popularity: `Precision@5=0.2571`, `Recall@5=0.0574`, `NDCG@5=0.2524`
- content_based: `Precision@5=0.8571`, `Recall@5=0.2044`, `NDCG@5=0.8668`
- hybrid: `Precision@5=0.9714`, `Recall@5=0.2308`, `NDCG@5=0.9758`

Use these to support the report claim that hybrid ranking beats popularity and content-only baselines.

## Commands

Bundled Python:

`C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`

```powershell
# run pipeline
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" src\run_pipeline.py

# run app at http://localhost:8501/
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m streamlit run src\app.py

# compile app without __pycache__
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -c "import py_compile; py_compile.compile(r'C:\Users\Admin\Documents\mods\FYP\src\app.py', cfile=r'C:\Users\Admin\Documents\mods\FYP\outputs\app_compile_check.pyc', doraise=True); print('compile ok')"
```

## Test Before Claiming Done

Verify: app loads, sample profiles switch, custom sliders work, each stage has content, checkbox marks completed without reordering, reset clears completed state, Research View shows model comparison, pipeline outputs metrics. `streamlit.testing.v1.AppTest` has worked for automated checks.

## Report Notes

Story: fixed tracks are too broad; learners differ by goal/skills; recommender finds gaps and suggests a shorter practical path; hybrid improves ranking; prototype updates progress without becoming a full platform.

Limitations: small curated dataset, self-reported skills, limited real learner interaction data, variable metadata consistency, partly simulated/curated relevance labels.

User likes: precise education, early practical projects, clear explanations, simple progress, stable recommendations, low information overload.

User dislikes: fixed tracks as main recommendations, unreliable optional reading/video metadata, dropdown progress updates, progress tables, stale checked boxes after reset, recommendation changes immediately after checkbox clicks.
