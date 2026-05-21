from __future__ import annotations

from pathlib import Path

from edu_recommender.data import (
    read_profiles,
    read_relevance_judgements,
    read_resources,
    read_skill_map,
    write_rows,
)
from edu_recommender.evaluation import evaluate_recommendations
from edu_recommender.models import Recommendation, RecommenderSuite

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "outputs"
MODELS = ["popularity", "content_based", "hybrid"]
TOP_K = 5


def main() -> None:
    resources = read_resources(DATA_DIR / "resources.csv")
    skill_map = read_skill_map(DATA_DIR / "skill_map.csv")
    profiles = read_profiles(DATA_DIR / "learner_profiles.csv")
    relevance = read_relevance_judgements(DATA_DIR / "relevance_judgements.csv")

    suite = RecommenderSuite(resources, skill_map)
    recommendations_by_model: dict[str, dict[str, list[Recommendation]]] = {}

    for model in MODELS:
        model_recommendations: dict[str, list[Recommendation]] = {}
        rows: list[dict[str, object]] = []
        for profile in profiles:
            recommendations = suite.recommend(profile, model=model, top_k=TOP_K)
            model_recommendations[profile.profile_id] = recommendations
            rows.extend(_recommendation_rows(recommendations))
        recommendations_by_model[model] = model_recommendations
        write_rows(
            OUTPUT_DIR / f"recommendations_{model}.csv",
            ["profile_id", "model", "rank", "resource_id", "title", "provider", "score", "explanation"],
            rows,
        )

    metric_rows = evaluate_recommendations(recommendations_by_model, relevance, k=TOP_K)
    write_rows(
        OUTPUT_DIR / "evaluation_metrics.csv",
        ["model", "k", "precision_at_k", "recall_at_k", "ndcg_at_k"],
        metric_rows,
    )
    _write_html_report(metric_rows, recommendations_by_model)

    print(f"Pipeline completed. Outputs written to: {OUTPUT_DIR}")
    for row in metric_rows:
        print(
            f"{row['model']}: "
            f"Precision@{row['k']}={row['precision_at_k']}, "
            f"Recall@{row['k']}={row['recall_at_k']}, "
            f"NDCG@{row['k']}={row['ndcg_at_k']}"
        )


def _recommendation_rows(recommendations: list[Recommendation]) -> list[dict[str, object]]:
    return [
        {
            "profile_id": recommendation.profile_id,
            "model": recommendation.model,
            "rank": recommendation.rank,
            "resource_id": recommendation.resource_id,
            "title": recommendation.title,
            "provider": recommendation.provider,
            "score": recommendation.score,
            "explanation": recommendation.explanation,
        }
        for recommendation in recommendations
    ]


def _write_html_report(
    metric_rows: list[dict[str, object]],
    recommendations_by_model: dict[str, dict[str, list[Recommendation]]],
) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Educational Recommender Evaluation Report</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 32px; line-height: 1.45; color: #17202a; }}
    h1, h2 {{ color: #12355b; }}
    table {{ border-collapse: collapse; margin: 16px 0 28px; width: 100%; }}
    th, td {{ border: 1px solid #d5dde5; padding: 8px; text-align: left; vertical-align: top; }}
    th {{ background: #edf3f8; }}
    .chart {{ margin: 16px 0 28px; }}
    .bar-label {{ font-size: 12px; fill: #17202a; }}
  </style>
</head>
<body>
  <h1>Career-Aware Educational Content Recommender</h1>
  <p>This report compares the popularity baseline, content-based recommender, and hybrid career-aware recommender using the sample learner profiles and prototype relevance judgements.</p>
  <h2>Evaluation Metrics</h2>
  {_metrics_table(metric_rows)}
  <h2>NDCG@{TOP_K} Comparison</h2>
  {_svg_bar_chart(metric_rows)}
  <h2>Hybrid Recommendation Examples</h2>
  {_hybrid_examples(recommendations_by_model["hybrid"])}
</body>
</html>
"""
    (OUTPUT_DIR / "report.html").write_text(html, encoding="utf-8")


def _metrics_table(metric_rows: list[dict[str, object]]) -> str:
    rows = "\n".join(
        "<tr>"
        f"<td>{row['model']}</td>"
        f"<td>{row['precision_at_k']}</td>"
        f"<td>{row['recall_at_k']}</td>"
        f"<td>{row['ndcg_at_k']}</td>"
        "</tr>"
        for row in metric_rows
    )
    return (
        "<table><thead><tr><th>Model</th><th>Precision@K</th><th>Recall@K</th><th>NDCG@K</th></tr></thead>"
        f"<tbody>{rows}</tbody></table>"
    )


def _svg_bar_chart(metric_rows: list[dict[str, object]]) -> str:
    width = 620
    height = 240
    baseline_y = 190
    bar_width = 110
    gap = 60
    max_bar_height = 150
    bars = []
    for index, row in enumerate(metric_rows):
        value = float(row["ndcg_at_k"])
        bar_height = value * max_bar_height
        x = 70 + index * (bar_width + gap)
        y = baseline_y - bar_height
        bars.append(
            f'<rect x="{x}" y="{y:.1f}" width="{bar_width}" height="{bar_height:.1f}" fill="#2f80ed" />'
            f'<text class="bar-label" x="{x}" y="{baseline_y + 18}">{row["model"]}</text>'
            f'<text class="bar-label" x="{x}" y="{y - 8:.1f}">{value:.3f}</text>'
        )
    return (
        f'<svg class="chart" width="{width}" height="{height}" role="img" '
        'aria-label="NDCG comparison chart">'
        f'<line x1="50" y1="{baseline_y}" x2="560" y2="{baseline_y}" stroke="#566573" />'
        + "".join(bars)
        + "</svg>"
    )


def _hybrid_examples(recommendations_by_profile: dict[str, list[Recommendation]]) -> str:
    blocks = []
    for profile_id, recommendations in recommendations_by_profile.items():
        rows = "\n".join(
            "<tr>"
            f"<td>{recommendation.rank}</td>"
            f"<td>{recommendation.title}</td>"
            f"<td>{recommendation.provider}</td>"
            f"<td>{recommendation.score}</td>"
            f"<td>{recommendation.explanation}</td>"
            "</tr>"
            for recommendation in recommendations
        )
        blocks.append(
            f"<h3>{profile_id}</h3>"
            "<table><thead><tr><th>Rank</th><th>Resource</th><th>Provider</th><th>Score</th><th>Explanation</th></tr></thead>"
            f"<tbody>{rows}</tbody></table>"
        )
    return "\n".join(blocks)


if __name__ == "__main__":
    main()
