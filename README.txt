Career-Aware Educational Content Recommendation System

This project implements the data science pipeline described in the FYP proposal and original project ideas brief.

It includes:

  - expanded curated computing learning-resource dataset
  - career pathway skill taxonomy
  - evidence notes for the skill taxonomy
  - learner profiling
  - popularity baseline recommender
  - content-based recommender
  - hybrid career-aware recommender
  - dynamic learning pathway demo with simulated skill updates
  - ranking evaluation using Precision@K, Recall@K, and NDCG@K
  - report-ready CSV and HTML outputs

The implementation is a recommendation-engine prototype and evaluation pipeline. It is not a full commercial learning platform.


PROJECT STRUCTURE

data
  learner_profiles.csv
  relevance_judgements.csv
  resources.csv
  skill_map.csv
  skill_sources.csv

docs
  appendices
  demo_guide.md
  evaluation_design.md
  progress_log_template.md
  report_draft.md
  report_outline.md
  skill_map_methodology.md
  user_feedback_survey.md

project briefs
  FYP Project Proposal.md
  Project_Ideas(1.1).md
  Project_Work_Schedule.md

src
  app.py
  run_pipeline.py
  edu_recommender
    data.py
    evaluation.py
    models.py
    text.py

outputs
  Generated when the pipeline is run.


HOW TO RUN THE PIPELINE

Use the bundled Python available in this Codex workspace:

  C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe src\run_pipeline.py

If Python is installed separately, this may also work:

  python src\run_pipeline.py

The pipeline writes:

  outputs/recommendations_popularity.csv
  outputs/recommendations_content_based.csv
  outputs/recommendations_hybrid.csv
  outputs/evaluation_metrics.csv
  outputs/report.html


HOW TO RUN THE STREAMLIT DEMO

Install Streamlit if needed:

  C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m pip install streamlit

Start the demo:

  C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m streamlit run src\app.py

Then open the local URL shown by Streamlit. It is usually:

  http://localhost:8501

The demo supports:

  - sample learner profiles from the evaluation dataset
  - a custom learner form where skill levels can be changed from 0 to 3

When a recommended resource is marked as completed, the app updates the learner's skill levels and marks the item visually while keeping the visible staged learning path stable. This avoids reshuffling recommendations during interaction.

The staged learning path is organised as:

  - learn just enough
  - start a practical project
  - deepen later
  - optional structured tracks


METHODOLOGY SUMMARY

The skill map uses a 0 to 3 scale:

  0 = not central to the pathway
  1 = useful supporting skill
  2 = important skill
  3 = core high-priority skill

The source evidence for these weights is documented in:

  data/skill_sources.csv
  docs/skill_map_methodology.md


MODEL SUMMARY

The baseline model recommends generally popular or high-quality resources.

The content-based model uses TF-IDF and cosine similarity between learner needs and resource metadata.

The hybrid model combines:

  - career pathway relevance
  - job-skill alignment
  - learner skill-gap match
  - difficulty match
  - prerequisite match
  - resource quality and popularity
  - content similarity

Each hybrid recommendation includes an explanation so the system is more transparent to learners.


EVALUATION

The included relevance judgements are prototype ground truth labels for the sample learner profiles.

They allow comparison between the baseline, content-based, and hybrid models using:

  - Precision@K
  - Recall@K
  - NDCG@K
