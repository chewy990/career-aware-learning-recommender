# Evaluation Design

## Goal

The evaluation checks whether a career-aware hybrid recommender gives more useful ranked recommendations than simpler models.

## Models Compared

1. Popularity baseline: ranks resources using quality and popularity only.
2. Content-based recommender: ranks by TF-IDF cosine similarity between learner profile text and resource metadata.
3. Hybrid recommender: combines career relevance skill-gap match job-skill alignment difficulty match prerequisite match resource quality and content similarity.

## Test Profiles

The current dataset includes seven learner profiles:

- beginner data analyst learner
- machine learning career switcher
- junior software developer
- reporting analyst
- ML deployment learner
- beginner developer
- analytics graduate

These profiles are stored in `data/learner_profiles.csv`.

## Relevance Judgements

Prototype relevance labels are stored in `data/relevance_judgements.csv`. A resource is marked relevant when it teaches skills that directly address the learner's target pathway and weak areas.

For the final FYP this should be improved with at least one of the following:

- supervisor review of relevance labels
- peer review from classmates
- small learner survey with usefulness ratings
- job-posting skill frequency used to validate pathway relevance

## Metrics

| Metric | What it measures |
|---|---|
| Precision@K | How many of the top K recommendations are relevant |
| Recall@K | How many relevant resources were retrieved in the top K |
| NDCG@K | Whether relevant resources appear near the top of the ranking |

NDCG@K is especially useful because this project produces ranked recommendation lists. A relevant resource at rank 1 should count more than a relevant resource at rank 5.

## Acceptance Criteria For Prototype

The prototype should be considered successful if:

- the hybrid recommender outperforms the popularity baseline on Precision@K and NDCG@K
- recommendation explanations correctly reference the learner's pathway and skill gaps
- the generated path prioritises targeted resources and introduces practical work before requiring complete pathway mastery
- the data pipeline can be rerun from the command line
- outputs are saved as report-ready CSV and HTML files

## Known Limitations

The current evaluation is based on curated prototype labels rather than large-scale learner interaction data. This is acceptable for a final-year prototype if the limitation is clearly discussed and supported by user feedback or manual relevance review.
