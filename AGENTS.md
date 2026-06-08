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
- `data/resource_modules.csv` - verified selected-module metadata with source URL and date checked
- `assets/desktop-background.jpg` - app banner
- `docs/report_draft.md` - preliminary report source
- `docs/prelim_report_draft2_jaslyn.pdf` - current exported report draft
- `docs/appendices/` - appendices A-D and screenshots
- `README.txt`, `docs/appendices/README.txt` - plain-text folder notes

## Current Submission State

- Current report source is `docs/report_draft.md`; keep Markdown as the source of truth.
- Current polished draft PDF is `docs/prelim_report_draft2_jaslyn.pdf`.
- Report has exactly four chapters: Introduction, Literature Review, Project Design, Feature Prototype.
- Appendices and References are not numbered as chapters.
- Appendices A-D are cross-referenced; Appendix E was removed.
- Dataset provenance is documented in Chapter 3 and Appendix A.
- Report draft includes a page-numbered TOC, expanded objectives, platform screenshots, architecture diagram, prototype screenshots, and bottom page numbers.

## App Notes

- Next codebase maintenance step: split `src/app.py` into smaller modules for UI helpers, learning path/progress logic, and Research View before adding new career tracks.
- Learning path stages: `1. Learn just enough`, `2. Start a practical project`, `3. Deepen later`, `Optional structured tracks`.
- Learner View is module-first where verified module data exists: show the selected module title as the main item and a small source line such as `From: DataCamp - SQL for Data Analysis`.
- Existing `format=module` resources should show cleaner module titles and `From: Provider`.
- Completion updates skills from the selected module when available; otherwise it falls back to the full resource skills.
- Only show `From:` source lines for verified module/resource provenance with `source_url` and `date_checked`; never show vague provider-only lines such as `From: YouTube`.
- Checking `Completed` should not reorder recommendations, swap the displayed module, leak state between profiles, or collapse the completed stage.
- Locked items should show a lock row plus a direct unlock hint, e.g. `Complete Data cleaning or SQL practice courses to unlock.`
- Keep `Reset progress`; do not show a progress table.
- Keep a compact Progress summary above the learning path; keep the full Completed resources expander below the path.
- If a completed item gives no level increase, show `Reinforced: ...` rather than a negative/no-progress message.
- When the current path is fully cleared and relevant skills are Confident, show the purple mastery message: `Congratulations on completing your course - your tech skills just leveled up, and we can't wait to see what you build next!`
- Show profile starting topics as `Completed topics: ...`.
- Skill labels shown to learners must be human-readable, e.g. `Data visualisation`, `Data cleaning`, `Dashboarding`, `SQL`, not raw IDs like `data_visualisation`.
- Skill increases should use level labels, not numeric arrows: `Not started`, `Basic`, `Working knowledge`, `Confident`.
- Level labels are inline colored text: Not started orange `#FF6B00`, Basic readable yellow, Working knowledge readable green, Confident purple `#AA00FF` with `*`.
- Broad tracks only appear as optional structured references.
- Learner-facing `Why:` statements should be brief and skill-specific, e.g. `Targets SQL`, `Practise Data cleaning`, `Deepen Python`, or `Optional reinforcement for Dashboarding`; avoid obvious pathway boilerplate.
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

## Notifications

Do not run Telegram completion notifications. The Telegram notifier has been removed from this machine.

## Before Finalizing

Check app load, both tabs, sample/custom profiles, staged path content, completion/reset behavior, Research View readability, pipeline run, four-chapter report structure, and appendix links.
