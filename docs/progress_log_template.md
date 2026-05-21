# Progress Log Template

Use this weekly. Keep entries short but specific. The goal is to show steady progress decisions problems and reflection.

## Week 1

### Work Completed

- Reviewed original project brief and FYP proposal.
- Confirmed project scope as a data-driven educational content recommender.
- Defined three target pathways: Data Analyst Machine Learning Engineer and Software Developer.

### Decisions Made

- The project will focus on the recommendation pipeline rather than a full commercial learning platform.
- The prototype will compare popularity content-based and hybrid recommendation models.

### Problems Or Risks

- The project scope could become too broad if too many pathways or features are added.

### Next Steps

- Create initial dataset and pathway skill map.

## Week 2

### Work Completed

- Created initial learning-resource dataset.
- Created skill map using a 0-3 pathway importance scale.
- Implemented learner profile structure.

### Decisions Made

- Skill gaps will be calculated by comparing pathway required skill level against learner current skill level.

### Problems Or Risks

- Skill weights need evidence from learning platforms and career sources.

### Next Steps

- Implement baseline content-based and hybrid recommenders.

## Week 3

### Work Completed

- Implemented popularity baseline.
- Implemented TF-IDF content-based recommender.
- Implemented hybrid recommender with explanation text.

### Decisions Made

- Hybrid model gives highest weight to career relevance and skill-gap match.

### Problems Or Risks

- TF-IDF is simple and may not capture deeper semantic meaning.

### Next Steps

- Add evaluation metrics and compare models.

## Week 4

### Work Completed

- Added Precision@K Recall@K and NDCG@K evaluation.
- Generated recommendation output CSV files and HTML report.
- Compared popularity content-based and hybrid models.

### Decisions Made

- NDCG@K will be treated as the most important ranking-quality metric.

### Problems Or Risks

- Relevance judgements are currently prototype labels.

### Next Steps

- Expand dataset and create evidence file for skill map.

## Week 5

### Work Completed

- Expanded dataset to 60 resources.
- Expanded learner profiles to seven test cases.
- Added skill source evidence table.
- Added methodology and evaluation design documentation.

### Decisions Made

- Keep Streamlit or Flask as optional later work. The current priority is data science evaluation.

### Problems Or Risks

- Need user feedback or supervisor review to strengthen evaluation validity.

### Next Steps

- Run small feedback survey and integrate results into evaluation chapter.
