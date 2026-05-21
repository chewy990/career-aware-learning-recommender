# Career-Aware Educational Content Recommendation System

## Abstract

Computing learners can access large numbers of online courses, tutorials, projects, and career pathways, but abundant choice does not guarantee useful guidance. A learner who wants to become a Data Analyst, Machine Learning Engineer, or Software Developer may need a small next step that addresses a current skill gap rather than a broad fixed pathway. This project develops and evaluates an explainable educational content recommendation prototype that combines learner profiles, career pathway skill requirements, curated resource metadata, and ranking models.

The prototype uses a curated dataset of 96 computing learning resources, a career skill map for three target pathways, seven sample learner profiles, and curated relevance judgements. It compares a popularity baseline, a content-based recommender using TF-IDF and cosine similarity, and a hybrid recommender that combines pathway relevance, job-skill alignment, skill-gap match, difficulty match, prerequisite match, quality signals, and content similarity. At K=5, the hybrid model achieves `Precision@5=0.9714`, `Recall@5=0.2308`, and `NDCG@5=0.9758`, outperforming the popularity and content-based baselines on the current prototype evaluation. A Streamlit research demo presents explainable staged learning paths and simple progress updates without turning the project into a full learning management platform.

## 1. Introduction

Online learning platforms such as Coursera, DataCamp, edX, freeCodeCamp, YouTube, and open university resources provide many computing learning materials. This variety is useful for self-directed learners, career switchers, students, and working adults, but it creates a recommendation problem. Learners may struggle to decide what to study next, whether a resource matches their current ability, and how a resource supports a specific career goal.

Many public learning pathways are broad and platform-defined. They can provide structure, but they may also ask a learner to complete a long sequence before starting practical work. This is inefficient when the learner already knows some topics or needs a focused gap-filling resource. For example, an aspiring Data Analyst with basic Python and Excel knowledge but weak SQL and dashboard skills may benefit more from targeted SQL, data cleaning, and visualisation resources than from a generic all-purpose track.

This project addresses that problem through a career-aware educational content recommender for three computing pathways:

- Data Analyst
- Machine Learning Engineer
- Software Developer

The system ranks resources using both learner information and career pathway information. It considers the learner's target pathway, self-rated skill levels, completed topics, weak topics, preferred difficulty, and resource metadata. It also provides short explanation text so that recommendations are not presented as opaque scores.

The work remains within the original FYP data science scope. The main contribution is a recommendation pipeline, evaluation method, and research prototype rather than a complete commercial learning platform.

### 1.1 Aim

The aim is to design, implement, and evaluate an explainable career-aware educational content recommendation system for computing learners.

### 1.2 Objectives

The project objectives are:

1. Curate a dataset of computing learning resources from multiple providers.
2. Define a skill map for Data Analyst, Machine Learning Engineer, and Software Developer pathways.
3. Represent learner profiles using pathway goal, current skills, completed topics, weak topics, preferred difficulty, and resource preferences.
4. Implement a popularity baseline, a content-based recommender, and a hybrid recommender.
5. Generate ranked top-N recommendations with human-readable reasons.
6. Evaluate ranking quality using Precision@K, Recall@K, and NDCG@K.
7. Demonstrate the recommendations through a lightweight Streamlit prototype with progress updates.

## 2. Background And Related Work

Educational recommender systems aim to reduce information overload by matching learning materials with learner context (Manouselis et al., 2010). Unlike general product recommendation, educational recommendation also needs to consider suitability, learning sequence, learner knowledge, and the reasons a resource is useful. A highly popular resource may still be a poor next step if it is too advanced or does not address a target career skill.

Content-based recommendation is relevant where interaction logs are limited. Instead of relying on many historical ratings, a content-based method can compare resource metadata with a learner representation (Aggarwal, 2016; Google Developers, n.d.). In this project, resource titles, topics, skills, prerequisites, formats, and descriptions are useful text features because the dataset is curated and learner interaction data is not yet available.

Hybrid recommendation is also suitable for the project because the desired ranking depends on more than text similarity. Career relevance, skill gaps, difficulty, prerequisites, and quality signals each express a different requirement. Combining them makes the scoring logic transparent and easier to discuss in an FYP evaluation against simpler baselines (Ricci et al., 2010).

The project is also influenced by explainable recommendation. Learners should understand whether a resource was suggested because it teaches a high-priority career skill, addresses a weak area, matches their current difficulty, or fits a practical next step. The explanation text in the prototype supports this transparency.

Existing learning platforms and career tracks motivate the project but also show its gap. Platform pathways can be useful optional references, yet they are usually fixed sequences (Coursera, n.d.; DataCamp, 2022). This project instead focuses on precise recommendations that let learners learn critical basics, start practical work early, and deepen selected skills later.

## 3. Requirements And Design

### 3.1 Functional Requirements

The system should:

- load structured datasets for resources, learner profiles, skill maps, and relevance labels
- calculate skill gaps for a learner and a target pathway
- rank resources with multiple recommendation models
- produce recommendation explanations
- construct a staged learning path for the learner view
- compare model performance for research evaluation
- export report-ready recommendation and metric outputs

### 3.2 Non-Functional Requirements

The implementation should be reproducible, understandable, and lightweight. It should be runnable from the command line, use transparent scoring logic, and keep the prototype focused on recommendation quality rather than full platform features such as authentication, classrooms, payments, or long-term course management.

### 3.3 Data Design

The current datasets are stored as CSV files.

| Dataset | Purpose |
|---|---|
| `data/resources.csv` | Curated metadata for 96 learning resources |
| `data/skill_map.csv` | Skill importance requirements for the three pathways |
| `data/skill_sources.csv` | Source rationale for pathway skill choices |
| `data/learner_profiles.csv` | Seven sample learner profiles |
| `data/relevance_judgements.csv` | Curated relevance labels for evaluation |

Resource metadata includes title, provider, topic, covered skills, difficulty level, duration, format, prerequisites, cost, popularity score, quality score, pathway relevance, and description. Learner profiles include target pathway, current skill levels, completed topics, weak skills, preferred difficulty, maximum duration, and preferred format.

### 3.4 Career Skill Map

The pathway skill map uses a 0-3 scale:

| Value | Meaning |
|---|---|
| 0 | Not central to the pathway |
| 1 | Useful supporting skill |
| 2 | Important pathway skill |
| 3 | Core high-priority skill |

Skill gaps are calculated by comparing the learner's current skill level with the pathway requirement. This supports pathway-aware ranking. A Data Analyst and a Software Developer may both benefit from SQL, for example, but the skill importance and recommended next resources can differ.

## 4. Implementation

### 4.1 Project Structure

The implementation is written in Python. The main modules are:

- `src/edu_recommender/data.py` for loading structured project data
- `src/edu_recommender/text.py` for text processing helpers
- `src/edu_recommender/models.py` for scoring and recommendation models
- `src/edu_recommender/evaluation.py` for ranking metrics
- `src/run_pipeline.py` for producing CSV and HTML evaluation outputs
- `src/app.py` for the Streamlit learner and research views

The pipeline writes recommendation outputs for each model, evaluation metrics, and an HTML report into `outputs/`.

### 4.2 Prototype Interface

The Streamlit prototype has two views. The Learner View allows a sample learner profile or a custom learner to be selected. It shows a staged path, recommendation reasons, resource metadata, completed-resource checkboxes, and simple skill increases such as `SQL 1 > 2`. The Research View shows ranked model outputs and model comparison metrics for the FYP evaluation.

The staged path is intentionally more precise than a fixed track:

1. `Learn just enough`
2. `Start a practical project`
3. `Deepen later`
4. `Optional structured tracks`

The visible recommendation path is kept stable while a learner checks completed resources. This avoids reordering or replacing recommendations immediately after a checkbox interaction, which would make the demo harder to follow and the learner interface less predictable. Completed resources are marked visually, while progress reset clears completion state.

> **Figure placeholder 1:** Learner View showing profile summary, staged learning path, and recommendation explanations.
>
> **Figure placeholder 2:** Progress update after marking a resource complete, including the simple skill increase display.
>
> **Figure placeholder 3:** Research View showing model comparison metrics and NDCG chart.

## 5. Recommendation Methods

### 5.1 Popularity Baseline

The popularity baseline ranks resources using general quality and popularity signals only. It provides a simple comparison model that does not use pathway goals or learner skill gaps.

```text
baseline_score = 0.65 * quality_score + 0.35 * popularity_score
```

This model helps test whether personalised models add value over generally attractive resources.

### 5.2 Content-Based Recommender

The content-based model builds text representations for learners and resources, then compares them using TF-IDF vectors and cosine similarity. The learner document is formed from pathway and profile features such as current skills, weak skills, completed topics, and calculated skill gaps. The resource document uses metadata such as title, provider, topic, skills, prerequisites, format, and description.

This method is appropriate for a prototype without large-scale historical click or rating data. It uses the curated metadata to rank resources whose content resembles the learner's needs.

### 5.3 Hybrid Recommender

The hybrid model is the main proposed method. It combines several signals:

| Component | Weight |
|---|---:|
| Career pathway relevance | 25% |
| Skill gap match | 25% |
| Job-skill alignment | 15% |
| Difficulty match | 10% |
| Prerequisite match | 10% |
| Resource quality and popularity | 10% |
| Content similarity | 5% |

Career relevance and skill-gap match receive the largest weights because the project is designed to recommend career-aware, personalised next steps. Difficulty and prerequisite signals reduce the chance of recommending unsuitable resources. Quality and popularity provide a weak general usefulness signal without dominating the learner-specific ranking.

The implementation separates broad tracks from the main path. Long career tracks can be shown as optional structured references, but the main learning path prioritises targeted resources and practical projects. Supporting optional readings and external videos were removed from the main demo because reliable creator metadata, titles, thumbnails, and links were outside the core scope.

## 6. Evaluation

### 6.1 Evaluation Design

The evaluation compares the popularity, content-based, and hybrid models on seven sample learner profiles. Prototype relevance judgements mark resources that directly address a learner's target pathway and weak areas. The comparison is performed at K=5 because the learner-facing use case emphasizes a short ranked list rather than a long catalogue.

The current relevance judgements are curated prototype labels. They are suitable for model comparison in the research demo, but they should not be presented as large-scale real learner behaviour.

### 6.2 Metrics

| Metric | Meaning |
|---|---|
| Precision@K | Proportion of top-K recommendations that are relevant |
| Recall@K | Proportion of relevant resources retrieved in the top K |
| NDCG@K | Ranking quality with higher reward for relevant resources near the top |

NDCG@K is especially important because the system returns ranked recommendations. A relevant resource at rank 1 is more useful than the same resource buried lower in the list.

### 6.3 Results

Current evaluation results at K=5 are:

| Model | Precision@5 | Recall@5 | NDCG@5 |
|---|---:|---:|---:|
| Popularity baseline | 0.2571 | 0.0574 | 0.2524 |
| Content-based | 0.8571 | 0.2044 | 0.8668 |
| Hybrid | 0.9714 | 0.2308 | 0.9758 |

The popularity baseline performs poorly because generally popular resources do not necessarily match a specific pathway or weak skill. The content-based recommender improves substantially because the resource metadata overlaps with learner skill and topic needs. The hybrid model produces the strongest current ranking by adding structured pathway, skill-gap, difficulty, prerequisite, and quality signals to the content match.

The recall values are lower than precision because a top-five recommendation list cannot retrieve every resource that may be relevant in the curated label set. This is acceptable for the prototype use case, where concise high-quality next steps are preferred over a long exhaustive list.

## 7. Discussion

The evaluation supports the project thesis that precise learner-aware recommendations are more suitable than a popularity-only approach for the current curated setting. The hybrid model improves both top-five relevance and ranking quality while preserving explainable scoring components that can be discussed in the report and shown in the prototype.

The Streamlit demo strengthens this finding by making the recommendation logic visible. A learner can see the staged path, resource reasons, and progress updates. The demo also shows an important design choice: practical work is introduced early instead of forcing complete pathway mastery first. This reflects the project's goal of helping learners learn enough to begin useful work, then deepen skills based on the pathway.

However, the results should be interpreted as prototype evidence. The resource dataset is manually curated, learner profiles are simulated examples, and relevance labels are not yet validated by a large learner study. The current model comparison demonstrates technical feasibility and measurable improvement over baselines, but it does not prove long-term learning outcomes.

## 8. Ethics, Limitations And Risk

Learner profiling can influence what content a user sees. A recommender should avoid presenting a narrow path as the only valid path, especially when self-rated skills may be inaccurate. This prototype mitigates that risk by showing explanation reasons, preserving optional structured references, and keeping the system transparent enough for manual inspection.

Main limitations are:

- the resource dataset is curated and relatively small
- learner skill levels are self-reported or simulated
- relevance judgements are partly curated rather than behavioural ground truth
- provider metadata and quality signals are simplified
- the skill map is evidence-informed but could be refined with stronger job-posting analysis
- the prototype does not measure retention, completion, or employment outcomes

## 9. Conclusion And Future Work

This project builds an explainable career-aware educational content recommendation prototype for computing learners. It contributes a curated multi-provider resource dataset, a pathway skill map, learner profile representations, three ranking models, evaluation outputs, and a lightweight demo interface. The current evaluation shows that the hybrid recommender outperforms the popularity and content-based comparison models on the prototype labels at K=5.

The project objectives are met at prototype level: the system calculates skill gaps, generates ranked recommendations with explanations, compares recommendation models, and demonstrates a staged learner path with progress updates. It remains deliberately narrower than a full learning platform so that the data science recommendation problem stays central.

Future work should collect more resources, validate pathway skill weights with broader job-market evidence, add supervisor or peer review for relevance judgements, run a small learner feedback study on recommendation usefulness and explanation clarity, and test whether staged recommendations improve practical learning decisions over fixed pathways.

## References

- Aggarwal, C. C. (2016). *Recommender Systems: The Textbook*. Available at: `https://pzs.dstu.dp.ua/DataMining/recom/bibl/1aggarwal_c_c_recommender_systems_the_textbook.pdf` (Accessed: 12 May 2026).
- Coursera. (n.d.). *Online Professional Certificate Programs*. Available at: `https://www.coursera.org/professional-certificates` (Accessed: 12 May 2026).
- DataCamp. (2022). *Career-building data science learning paths*. Available at: `https://www.datacamp.com/tracks/career` (Accessed: 12 May 2026).
- freeCodeCamp. (2014). *Learn to code*. Available at: `https://www.freecodecamp.org/` (Accessed: 12 May 2026).
- Google Developers. (n.d.). *Recommendation Systems Overview*. Available at: `https://developers.google.com/machine-learning/recommendation/overview/types` (Accessed: 12 May 2026).
- Manouselis, N., Drachsler, H., Vuorikari, R., Hummel, H. and Koper, R. (2010). "Recommender Systems in Technology Enhanced Learning", in *Recommender Systems Handbook*, pp. 387-415. Available at: `https://doi.org/10.1007/978-0-387-85820-3_12` (Accessed: 12 May 2026).
- Ricci, F., Rokach, L. and Shapira, B. (2010). "Introduction to Recommender Systems Handbook", in *Recommender Systems Handbook*, pp. 1-35. Available at: `https://doi.org/10.1007/978-0-387-85820-3_1` (Accessed: 12 May 2026).
- Scikit-learn. (2019). *User guide*. Available at: `https://scikit-learn.org/stable/user_guide.html` (Accessed: 12 May 2026).
- SkillsFuture Singapore. (2025). *Jobs-Skills Portal*. Available at: `https://jobsandskills.skillsfuture.gov.sg/frameworks/sector-information` (Accessed: 12 May 2026).

> **Formatting check before submission:** adapt the final references to the citation style and word-count rules required by the programme.
