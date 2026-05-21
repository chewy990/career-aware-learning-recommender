from __future__ import annotations

import math

from edu_recommender.models import Recommendation


def evaluate_recommendations(
    recommendations_by_model: dict[str, dict[str, list[Recommendation]]],
    relevance_judgements: dict[str, set[str]],
    k: int,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for model, recommendations_by_profile in recommendations_by_model.items():
        precision_values: list[float] = []
        recall_values: list[float] = []
        ndcg_values: list[float] = []

        for profile_id, recommendations in recommendations_by_profile.items():
            relevant_ids = relevance_judgements[profile_id]
            ranked_ids = [recommendation.resource_id for recommendation in recommendations[:k]]
            precision_values.append(precision_at_k(ranked_ids, relevant_ids, k))
            recall_values.append(recall_at_k(ranked_ids, relevant_ids, k))
            ndcg_values.append(ndcg_at_k(ranked_ids, relevant_ids, k))

        rows.append(
            {
                "model": model,
                "k": k,
                "precision_at_k": round(_mean(precision_values), 4),
                "recall_at_k": round(_mean(recall_values), 4),
                "ndcg_at_k": round(_mean(ndcg_values), 4),
            }
        )
    return rows


def precision_at_k(ranked_ids: list[str], relevant_ids: set[str], k: int) -> float:
    if k == 0:
        return 0.0
    hits = sum(1 for resource_id in ranked_ids[:k] if resource_id in relevant_ids)
    return hits / k


def recall_at_k(ranked_ids: list[str], relevant_ids: set[str], k: int) -> float:
    if not relevant_ids:
        return 0.0
    hits = sum(1 for resource_id in ranked_ids[:k] if resource_id in relevant_ids)
    return hits / len(relevant_ids)


def ndcg_at_k(ranked_ids: list[str], relevant_ids: set[str], k: int) -> float:
    dcg = 0.0
    for index, resource_id in enumerate(ranked_ids[:k], start=1):
        relevance = 1 if resource_id in relevant_ids else 0
        dcg += relevance / math.log2(index + 1)
    ideal_hits = min(len(relevant_ids), k)
    ideal_dcg = sum(1 / math.log2(index + 1) for index in range(1, ideal_hits + 1))
    if ideal_dcg == 0:
        return 0.0
    return dcg / ideal_dcg


def _mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)
