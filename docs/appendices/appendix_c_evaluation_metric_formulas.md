# Appendix C: Evaluation Metric Formulas

This appendix defines the ranking metrics used to evaluate the recommendation models.

The prototype evaluates recommendations at `K = 5`, because the learner-facing use case focuses on a short list of next-step resources rather than a long catalogue.

## C.1 Precision@K

Precision@K measures how many of the top K recommended resources are relevant.

```text
Precision@K = relevant recommendations in top K / K
```

For example, if 4 of the top 5 recommendations are relevant:

```text
Precision@5 = 4 / 5 = 0.80
```

## C.2 Recall@K

Recall@K measures how many of all relevant resources were retrieved in the top K recommendations.

```text
Recall@K = relevant recommendations in top K / total relevant resources
```

For example, if 4 resources in the top 5 are relevant and there are 10 relevant resources in the judgement set:

```text
Recall@5 = 4 / 10 = 0.40
```

Recall can be lower than precision in this project because the app deliberately shows a short top-five recommendation list.

## C.3 DCG@K

Discounted Cumulative Gain gives more credit when relevant resources appear near the top of the ranked list.

```text
DCG@K = sum(relevance_i / log2(i + 1)) for ranks i = 1 to K
```

In this prototype, relevance is binary:

| Value | Meaning |
|---|---|
| 1 | The resource is relevant for the learner profile |
| 0 | The resource is not marked relevant |

## C.4 NDCG@K

Normalised Discounted Cumulative Gain compares the actual ranking with the ideal ranking.

```text
NDCG@K = DCG@K / ideal DCG@K
```

NDCG@K is useful because the recommender is ranked. A relevant resource at rank 1 should be rewarded more than the same resource at rank 5.

## C.5 Models Compared

The evaluation compares:

| Model | Description |
|---|---|
| Popularity baseline | Ranks resources using quality and popularity only |
| Content-based recommender | Uses TF-IDF and cosine similarity between learner profile text and resource metadata |
| Hybrid recommender | Combines pathway relevance, skill-gap match, job-skill alignment, difficulty match, prerequisite match, quality, and content similarity |

The metric implementation is in `src/edu_recommender/evaluation.py`.
