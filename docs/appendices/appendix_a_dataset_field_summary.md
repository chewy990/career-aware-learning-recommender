# Appendix A: Dataset Field Summary

This appendix summarises the structured datasets used by the recommender prototype.

## A.1 Resource Dataset

Source file: `data/resources.csv`

Purpose: stores the learning resources that can be recommended to learners.

| Field | Meaning |
|---|---|
| `resource_id` | Unique identifier for each learning resource |
| `title` | Resource title shown in recommendations |
| `provider` | Resource provider or platform |
| `topic` | Main topic covered by the resource |
| `skills` | Skills taught by the resource |
| `difficulty_level` | Difficulty level, where 1 is beginner, 2 is intermediate, and 3 is advanced |
| `duration_hours` | Approximate resource length in hours |
| `format` | Resource type, such as course, tutorial, project, module, video, or career track |
| `prerequisites` | Skills or topics expected before taking the resource |
| `cost` | Cost category or price information |
| `popularity_score` | Prototype popularity score used by the baseline model |
| `quality_score` | Prototype quality score used by the baseline and hybrid models |
| `data_analyst_relevance` | Relevance score for the Data Analyst pathway |
| `ml_engineer_relevance` | Relevance score for the Machine Learning Engineer pathway |
| `software_developer_relevance` | Relevance score for the Software Developer pathway |
| `description` | Short text description used for content-based matching |

## A.2 Skill Map Dataset

Source file: `data/skill_map.csv`

Purpose: stores how important each skill is for each target career pathway.

| Field | Meaning |
|---|---|
| `skill` | Skill name used by learner profiles and resources |
| `data_analyst` | Importance of the skill for the Data Analyst pathway |
| `ml_engineer` | Importance of the skill for the Machine Learning Engineer pathway |
| `software_developer` | Importance of the skill for the Software Developer pathway |

Importance values use a 0-3 scale:

| Value | Meaning |
|---|---|
| 0 | Not central to this pathway |
| 1 | Useful supporting skill |
| 2 | Important skill |
| 3 | Core high-priority skill |

## A.3 Skill Sources Dataset

Source file: `data/skill_sources.csv`

Purpose: records the sources used to justify the pathway skills and skill-map weights.

| Field | Meaning |
|---|---|
| `source_id` | Unique source identifier |
| `source_name` | Name of the project document, platform page, or external source |
| `source_type` | Type of source, such as project document, learning platform, or career framework |
| `url` | Web address or local document path |
| `pathways_supported` | Pathways supported by the source |
| `skills_supported` | Skills mentioned or supported by the source |
| `evidence_summary` | Short explanation of how the source supports the skill map |

## A.4 Learner Profiles Dataset

Source file: `data/learner_profiles.csv`

Purpose: stores sample learner profiles for testing and demonstrating the recommender.

| Field | Meaning |
|---|---|
| `profile_id` | Unique learner profile identifier |
| `name` | Display name for the sample learner |
| `target_pathway` | Target career pathway |
| `current_skills` | Current self-rated skill levels |
| `completed_topics` | Topics or skills already completed |
| `weak_skills` | Skills the learner needs to improve |
| `preferred_difficulty` | Preferred resource difficulty level |
| `max_duration_hours` | Maximum preferred resource duration |
| `preferred_format` | Preferred resource type |

## A.5 Relevance Judgements Dataset

Source file: `data/relevance_judgements.csv`

Purpose: stores prototype relevance labels used for evaluation.

| Field | Meaning |
|---|---|
| `profile_id` | Learner profile being evaluated |
| `relevant_resource_ids` | Resource IDs judged relevant for that learner |

These labels are suitable for prototype model comparison, but they should be described as curated relevance judgements rather than large-scale learner behaviour data.
