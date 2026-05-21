# Career-Aware Educational Content Recommendation System

This project implements the data science pipeline described in the FYP proposal and the original project ideas brief:

- expanded curated computing learning-resource dataset
- career pathway skill taxonomy
- evidence notes for the skill taxonomy
- learner profiling
- popularity baseline recommender
- content-based recommender
- hybrid career-aware recommender
- dynamic learning pathway demo with simulated skill updates
- ranking evaluation using Precision@K Recall@K and NDCG@K
- report-ready CSV and HTML outputs

The implementation intentionally stays close to the original project brief: it is a recommendation-engine prototype and evaluation pipeline, not a full commercial learning platform.

## Project Structure

```text
data/
  learner_profiles.csv
  relevance_judgements.csv
  resources.csv
  skill_map.csv
  skill_sources.csv
docs/
  demo_guide.md
  evaluation_design.md
  progress_log_template.md
  report_draft.md
  report_outline.md
  skill_map_methodology.md
  user_feedback_survey.md
project briefs/
  FYP Project Proposal.md
  Project_Ideas(1.1).md
  Project_Work_Schedule.md
src/
  edu_recommender/
    data.py
    evaluation.py
    models.py
    text.py
  app.py
  run_pipeline.py
outputs/
  generated when the pipeline is run
```

## How To Run

Use the bundled Python available in this Codex workspace:

```powershell
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' src\run_pipeline.py
```

If you install Python separately, this also works:

```powershell
python src\run_pipeline.py
```

The pipeline writes:

- `outputs/recommendations_popularity.csv`
- `outputs/recommendations_content_based.csv`
- `outputs/recommendations_hybrid.csv`
- `outputs/evaluation_metrics.csv`
- `outputs/report.html`

## How To Run The Streamlit Demo

Install Streamlit if needed:

```powershell
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pip install streamlit
```

Start the demo:

```powershell
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m streamlit run src\app.py
```

Then open the local URL shown by Streamlit, usually `http://localhost:8501`.

The demo supports two modes:

- sample learner profiles from the evaluation dataset
- a custom learner form where skill levels can be changed from 0-3

When a recommended resource is marked as completed, the app updates the learner's skill levels and marks the item visually while keeping the visible staged learning path stable. This avoids reshuffling recommendations during interaction.

The staged learning path is organised as:

- learn just enough
- start a practical project
- deepen later
- optional structured tracks

## Methodology Summary

The skill map uses a 0-3 scale:

- 0 = not central to the pathway
- 1 = useful supporting skill
- 2 = important skill
- 3 = core high-priority skill

The source evidence for these weights is documented in `data/skill_sources.csv` and `docs/skill_map_methodology.md`.

## Model Summary

The baseline model recommends generally popular/high-quality resources.

The content-based model uses TF-IDF and cosine similarity between learner needs and resource metadata.

The hybrid model combines:

- career pathway relevance
- job-skill alignment
- learner skill-gap match
- difficulty match
- prerequisite match
- resource quality/popularity
- content similarity

Each hybrid recommendation includes an explanation so the system is more transparent to learners.

## Evaluation

The included relevance judgements are prototype ground truth labels for the sample learner profiles. They allow comparison between the baseline, content-based, and hybrid models using:

- Precision@K
- Recall@K
- NDCG@K

For the final FYP, these relevance judgements can be expanded using supervisor feedback, peer review, or a small user study.

