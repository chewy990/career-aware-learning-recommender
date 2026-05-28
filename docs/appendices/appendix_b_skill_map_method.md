# Appendix B: Skill-Map Method

This appendix summarises how the pathway skill map was created.

## B.1 Purpose

The skill map converts career pathway requirements into numeric values that the recommender can use. It supports the project aim of recommending resources based on a learner's target pathway and current skill gaps.

## B.2 Weight Scale

| Weight | Meaning |
|---|---|
| 0 | Not central to this pathway |
| 1 | Useful supporting skill |
| 2 | Important skill |
| 3 | Core high-priority skill |

The recommender compares these pathway requirements against the learner's current skill levels to calculate skill gaps.

## B.3 Evidence Sources

The current prototype skill map is based on three evidence groups:

| Evidence group | How it supports the skill map |
|---|---|
| Project documents | The proposal and project ideas define the three pathways and expected recommender scope |
| Learning platform pathways | Coursera, DataCamp, and freeCodeCamp examples show common skills in structured learning paths |
| Career and skill-framework sources | Sources such as SkillsFuture and job-skill references support career relevance |

The supporting evidence table is stored in `data/skill_sources.csv`.

## B.4 Pathway Rationale

### Data Analyst

High-priority skills include SQL, Excel, Python, statistics, data visualisation, dashboards, and data cleaning. These skills support data extraction, analysis, interpretation, and communication of insights.

### Machine Learning Engineer

High-priority skills include Python, machine learning, model evaluation, and deployment. APIs and version control are also included because deployed machine learning systems usually need software integration and maintenance.

### Software Developer

High-priority skills include programming, object-oriented programming, APIs, databases, testing, and version control. SQL is treated as important but not always as central as in the Data Analyst pathway.

## B.5 Treatment Of Broad Career Tracks

Broad career tracks are kept in the dataset as optional structured references, but they are not prioritised as first-step recommendations. This matches the project goal of recommending precise next steps rather than requiring the learner to complete a long fixed track before starting practical work.

## B.6 Limitation

The current weights are suitable for a prototype, but they should not be presented as final labour-market truth. A stronger final version could validate the weights with job-posting skill counts, supervisor review, or peer review.
