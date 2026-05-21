# Draft Report Sections

This document provides report-ready draft material for the FYP. It should be edited into the final report rather than submitted unchanged.

## 1. Introduction

Online learners can access large numbers of computing resources from platforms such as Coursera DataCamp edX freeCodeCamp YouTube and university open courses. Although this gives learners flexibility it also creates a selection problem: learners may not know which resource is most relevant to their current skill level career goal or next learning step.

This project develops a data-driven personalised educational content recommendation system for computing learners. The system focuses on three career pathways: Data Analyst Machine Learning Engineer and Software Developer. Instead of recommending resources only by popularity or topic category the system combines learner skill gaps career pathway requirements resource metadata and simple quality signals to produce ranked learning recommendations with explanations.

The project follows the original data science brief by implementing a complete recommendation pipeline: data collection preprocessing learner profiling model development recommendation generation and evaluation. The implementation is a prototype rather than a full commercial platform.

## 2. Aims And Objectives

The aim of the project is to design implement and evaluate an explainable career-aware educational content recommender for computing learners.

The project objectives are:

1. Curate a dataset of computing learning resources from multiple learning platforms.
2. Define a career pathway skill map for Data Analyst Machine Learning Engineer and Software Developer roles.
3. Represent learner profiles using target pathway current skills completed topics weak skills preferred difficulty and preferred format.
4. Implement and compare three recommendation approaches: popularity baseline content-based recommender and hybrid recommender.
5. Generate ranked top-N recommendations with explanation text.
6. Evaluate the recommenders using ranking metrics including Precision@K Recall@K and NDCG@K.
7. Discuss limitations of the prototype including dataset size manual relevance judgements and self-rated learner skills.

## 3. System Design

The system is organised as a data science pipeline. The input datasets are learning resources career pathway skill weights learner profiles and relevance judgements. The pipeline loads and preprocesses these files then generates recommendations for each learner profile using three models.

The learning resource dataset contains metadata such as title provider topic skills difficulty duration format prerequisites cost popularity score quality score pathway relevance and description. The learner profile dataset contains the target career pathway current skill levels completed topics weak skills preferred difficulty maximum preferred duration and preferred learning format.

The career skill map uses a 0-3 scale. A value of 0 means the skill is not central to the pathway. A value of 3 means it is a core high-priority skill. This numeric representation allows the system to estimate skill gaps by comparing the pathway requirement with the learner's current self-rated skill level.

## 4. Recommendation Methods

### Popularity Baseline

The popularity baseline ranks resources using only general quality and popularity signals. It provides a simple comparison model that does not use the learner's pathway or skill gaps. This is important because the project needs to show whether personalisation improves the recommendation ranking.

The baseline score is calculated as:

```text
baseline_score = 0.65 * quality_score + 0.35 * popularity_score
```

### Content-Based Recommender

The content-based recommender compares learner profile text with resource metadata. It uses a TF-IDF representation and cosine similarity. The learner document is constructed from the target pathway current skills completed topics weak skills and calculated skill gaps. The resource document is constructed from the resource title provider topic skills prerequisites format and description.

This model is closer to the original project brief because it uses text similarity and content metadata to recommend relevant learning materials.

### Hybrid Recommender

The hybrid recommender is the main proposed model. It combines multiple signals:

| Component | Weight |
|---|---:|
| Career pathway relevance | 25% |
| Skill gap match | 25% |
| Job-skill alignment | 15% |
| Difficulty match | 10% |
| Prerequisite match | 10% |
| Resource quality and popularity | 10% |
| Content similarity | 5% |

This weighting was selected because the project is primarily about career-aware personalised learning. Career relevance and skill gap match therefore receive the highest weights. Difficulty prerequisites and quality signals are included to avoid recommending resources that are unsuitable or too advanced.

Broad fixed career tracks are not treated as ideal first-step recommendations. They are useful as source material and optional structured references, but recommending an entire 40-60 hour track would reproduce the fixed-pathway problem this project is trying to address. The implementation therefore penalises very long resources and prioritises shorter targeted modules when constructing the learner's dynamic pathway.

The pathway design follows a "learn just enough then practise" approach. The system does not assume that a learner must master every prerequisite before starting practical work. Instead it recommends targeted resources for critical gaps, introduces practical projects early, and provides optional explainers when the learner needs conceptual support. This reflects the idea that practical work can reveal gaps and accelerate learning.

Optional readings and external videos were considered during prototyping but removed from the main demo because reliable creator metadata and stable links were outside the core scope of the recommender. The final prototype therefore focuses on structured learning resources, targeted modules and practical projects.

## 5. Evaluation Method

The evaluation compares the three recommendation models using seven sample learner profiles and prototype relevance judgements. A resource is considered relevant if it teaches skills that match the learner's target pathway and weak areas.

The metrics are:

| Metric | Purpose |
|---|---|
| Precision@K | Measures how many of the top K recommendations are relevant. |
| Recall@K | Measures how many relevant resources are retrieved in the top K. |
| NDCG@K | Measures whether relevant resources appear near the top of the ranked list. |

NDCG@K is particularly important because the system produces ranked recommendations. A relevant resource at rank 1 is more useful than a relevant resource at rank 5.

Current evaluation results at K=5:

| Model | Precision@5 | Recall@5 | NDCG@5 |
|---|---:|---:|---:|
| Popularity baseline | 0.2571 | 0.0574 | 0.2524 |
| Content-based | 0.8571 | 0.2044 | 0.8668 |
| Hybrid | 0.9714 | 0.2308 | 0.9758 |

The hybrid model has the highest Precision@5 and NDCG@5. This means it retrieves more relevant resources in the top five and ranks relevant resources better near the top of the list. Both personalised models substantially outperform the popularity baseline.

## 6. Discussion

The results suggest that learner-specific and pathway-specific information improves educational resource recommendation compared with a popularity-only baseline. The content-based recommender performs strongly because resource metadata contains skill and topic information that overlaps with learner needs. The hybrid recommender improves ranked quality by adding career relevance skill-gap matching and suitability checks.

The results should be interpreted carefully because the dataset and relevance judgements are curated for a prototype. The evaluation does not yet use large-scale real learner interaction data. However this is acceptable for a final-year prototype if the limitation is clearly acknowledged and supported with manual review or a small user feedback study.

## 7. Limitations

The main limitations are:

- The resource dataset is curated manually and may not fully represent all available learning resources.
- Learner skill levels are self-rated and may be subjective.
- Relevance judgements are prototype labels rather than large-scale user behaviour data.
- Popularity and quality scores are simplified metadata fields.
- The skill map is evidence-informed but should be refined with more job-posting analysis.
- The system recommends resources but does not yet model long-term learning outcomes or knowledge retention.

## 8. Future Work

Future improvements could include collecting more resources, adding real learner feedback, using job posting skill frequencies to refine pathway weights, and testing the Streamlit prototype with actual learners.

## 9. Draft References

- Aggarwal C. C. 2016. Recommender Systems: The Textbook.
- Coursera. IBM Data Analyst Professional Certificate. https://www.coursera.org/professional-certificates/ibm-data-analyst
- Coursera. Deploying Machine Learning Models. https://www.coursera.org/learn/deploying-machine-learning-models
- DataCamp. Career Tracks. https://www.datacamp.com/tracks/career
- DataCamp. Machine Learning Engineer Track. https://www.datacamp.com/tracks/machine-learning-engineer/
- freeCodeCamp. Curriculum API. https://curriculum-db.freecodecamp.org/
- Manouselis N. Drachsler H. Vuorikari R. Hummel H. and Koper R. 2010. Recommender Systems in Technology Enhanced Learning.
- Ricci F. Rokach L. and Shapira B. 2010. Introduction to Recommender Systems Handbook.
- SkillsFuture Singapore. Skills Demand for the Future Economy Report. https://www.skillsfuture.gov.sg/docs/default-source/skills-report-2023/sdfe-2023.pdf
