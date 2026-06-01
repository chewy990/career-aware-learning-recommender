# AGENTS.md

## Project

Career-aware educational content recommender for computing learners.

Project folder: `C:\Users\Admin\Documents\mods\FYP`

Scope: FYP data science recommender prototype, not a full LMS. The app recommends staged learning paths from career pathway, current skills, skill gaps, completed topics, preferred difficulty, and resource metadata.

Target pathways: Data Analyst, Machine Learning Engineer, Software Developer.

Core idea: recommend "learn just enough", start practical work early, then deepen later.

## Key Files

- `src/app.py` - Streamlit prototype
- `src/run_pipeline.py` - evaluation runner
- `src/edu_recommender/models.py` - popularity, content-based, and hybrid recommenders
- `src/edu_recommender/evaluation.py` - Precision@K, Recall@K, NDCG@K
- `data/*.csv` - curated prototype datasets
- `assets/desktop-background.jpg` - app banner
- `docs/report_draft.md` - preliminary report source
- `docs/CM3070_Preliminary_Project_Report_Jaslyn_Chan.*` - exported PDF/DOCX/RTF
- `docs/appendices/` - appendices A-D and screenshots
- `README.txt`, `docs/appendices/README.txt` - plain-text folder notes

## Current Submission State

- Preliminary report and MP4 demo have been submitted.
- Report has exactly four chapters: Introduction, Literature Review, Project Design, Feature Prototype.
- Appendices and References are not numbered as chapters.
- Appendices A-D are cross-referenced; Appendix E was removed.
- Dataset provenance is documented in Chapter 3 and Appendix A.
- Broken SkillsFuture ICT reference was replaced with official IMDA Skills Framework link.

## App Notes

- Learning path stages: `1. Learn just enough`, `2. Start a practical project`, `3. Deepen later`, `Optional structured tracks`.
- Checking `Completed` should not reorder recommendations.
- Keep `Reset progress`; do not show a progress table.
- Show skill increases as `SQL 1 > 2`.
- Broad tracks only appear as optional structured references.
- Research View explanations use wrapped HTML rows.
- Research View metrics table, NDCG chart, and raw hybrid output use a white theme.
- Research View selector/slider labels are black; slider is narrow and grey.

## Metrics

- popularity: `Precision@5=0.2571`, `Recall@5=0.0574`, `NDCG@5=0.2524`
- content_based: `Precision@5=0.8571`, `Recall@5=0.2044`, `NDCG@5=0.8668`
- hybrid: `Precision@5=0.9714`, `Recall@5=0.2308`, `NDCG@5=0.9758`

## Commands

Bundled Python:

`C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`

Run app:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m streamlit run src\app.py
```

Run pipeline:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" src\run_pipeline.py
```

## Before Finalizing

Check app load, both tabs, sample/custom profiles, staged path content, completion/reset behavior, Research View readability, pipeline run, four-chapter report structure, and appendix links.
