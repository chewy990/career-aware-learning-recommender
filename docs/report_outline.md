# Final Report Outline

## 1. Introduction

- Problem: too many online learning resources and weak personalised guidance.
- Aim: build an explainable career-aware educational recommender.
- Scope: Data Analyst Machine Learning Engineer and Software Developer.
- Contributions: dataset skill map learner profiles hybrid recommender evaluation.

## 2. Background And Related Work

- Educational recommender systems.
- Content-based filtering.
- Hybrid recommender systems.
- Explainable recommendation.
- Learning analytics and skill-gap analysis.
- Existing learning platforms and limitations.

## 3. Requirements And Design

- Functional requirements:
  - load curated resources
  - represent learner profiles
  - calculate skill gaps
  - generate top-N recommendations
  - explain recommendations
  - compare models
- Non-functional requirements:
  - reproducible pipeline
  - transparent scoring
  - report-ready outputs
- Data design:
  - resources dataset
  - skill map
  - learner profiles
  - relevance judgements

## 4. Implementation

- Python project structure.
- Data loading and preprocessing.
- TF-IDF and cosine similarity.
- Popularity baseline.
- Content-based recommender.
- Hybrid recommender.
- Explanation generation.
- Output generation.

## 5. Evaluation

- Evaluation dataset and learner profiles.
- Relevance judgement method.
- Metrics: Precision@K Recall@K NDCG@K.
- Results table.
- Interpretation of baseline vs content-based vs hybrid.
- Optional user feedback results.

## 6. Discussion

- Whether hybrid recommendation improves ranking quality.
- Why content-based performs strongly.
- Strengths of explainability.
- Limitations of manual dataset and self-rated skills.
- Ethical considerations around learner profiling and recommendation bias.

## 7. Conclusion

- Summary of what was built.
- Key findings from evaluation.
- Whether project objectives were met.
- Future work.
