from __future__ import annotations

import html

import streamlit as st

from edu_recommender.models import Recommendation


def display_skill(skill: str) -> str:
    labels = {
        "apis": "APIs",
        "oop": "Object-oriented programming",
        "sql": "SQL",
        "data_visualisation": "Data visualisation",
        "data_cleaning": "Data cleaning",
        "machine_learning": "Machine learning",
        "model_evaluation": "Model evaluation",
        "version_control": "Version control",
        "dashboards": "Dashboarding",
    }
    return labels.get(skill, skill.replace("_", " ").title())


def display_skill_list(skills: set[str]) -> str:
    if not skills:
        return "None yet"
    return ", ".join(display_skill(skill) for skill in sorted(skills))


def skill_level_label(level: int) -> str:
    return {
        0: "Not started",
        1: "Basic",
        2: "Working knowledge",
        3: "Confident",
    }.get(level, str(level))


def skill_level_badge(level: int) -> str:
    label = skill_level_label(level)
    css_class = {
        0: "fyp-level-not-started",
        1: "fyp-level-basic",
        2: "fyp-level-working",
        3: "fyp-level-confident",
    }.get(level, "fyp-level-working")
    star = " *" if level == 3 else ""
    return f'<span class="fyp-level-badge {css_class}">{html.escape(label)}{star}</span>'


def difficulty_label(level: int) -> str:
    return {1: "Beginner", 2: "Intermediate", 3: "Advanced"}.get(level, str(level))


def shorten_explanation(explanation: str) -> str:
    explanation = explanation.replace("Recommended because ", "")
    explanation = explanation.rstrip(".")
    explanation = humanise_explanation_text(explanation)
    parts = [part.strip() for part in explanation.split(";") if part.strip()]
    if not parts:
        return explanation
    return "Why: " + "; ".join(parts[:2]) + "."


def humanise_explanation_text(explanation: str) -> str:
    replacements = {
        "data_visualisation": "data visualisation",
        "data_cleaning": "data cleaning",
        "machine_learning": "machine learning",
        "model_evaluation": "model evaluation",
        "version_control": "version control",
        "dashboards": "dashboarding",
        "apis": "APIs",
        "oop": "object-oriented programming",
        "sql": "SQL",
    }
    for raw, label in replacements.items():
        explanation = explanation.replace(raw, label)
    return explanation


def show_recommendations(recommendations: list[Recommendation]) -> None:
    rows = [
        (
            '<div class="fyp-research-row fyp-research-head">'
            "<div>Rank</div>"
            "<div>Resource</div>"
            "<div>Provider</div>"
            "<div>Score</div>"
            "<div>Explanation</div>"
            "</div>"
        )
    ]
    for recommendation in recommendations:
        rows.append(
            (
                '<div class="fyp-research-row">'
                f'<div class="fyp-research-cell fyp-research-muted">#{recommendation.rank}</div>'
                f'<div class="fyp-research-cell"><strong>{html.escape(recommendation.title)}</strong></div>'
                f'<div class="fyp-research-cell">{html.escape(recommendation.provider)}</div>'
                f'<div class="fyp-research-cell fyp-research-muted">{recommendation.score:.3f}</div>'
                f'<div class="fyp-research-cell">{html.escape(recommendation.explanation)}</div>'
                "</div>"
            )
        )
    st.markdown(
        (
            '<div class="fyp-research-panel">'
            '<div class="fyp-research-table">'
            f"{''.join(rows)}"
            "</div>"
            "</div>"
        ),
        unsafe_allow_html=True,
    )


def show_white_table(rows: list[dict[str, object]], columns: list[str]) -> None:
    if not rows:
        st.info("No rows to display.")
        return
    header_html = "".join(f"<th>{html.escape(column)}</th>" for column in columns)
    body_rows = []
    numeric_columns = {"k", "rank", "score", "precision_at_k", "recall_at_k", "ndcg_at_k"}
    for row in rows:
        cells = []
        for column in columns:
            value = row.get(column, "")
            cell_class = ' class="numeric"' if column in numeric_columns else ""
            cells.append(f"<td{cell_class}>{html.escape(format_table_value(value))}</td>")
        body_rows.append(f"<tr>{''.join(cells)}</tr>")
    st.markdown(
        (
            '<div class="fyp-white-table-wrap">'
            '<table class="fyp-white-table">'
            f"<thead><tr>{header_html}</tr></thead>"
            f"<tbody>{''.join(body_rows)}</tbody>"
            "</table>"
            "</div>"
        ),
        unsafe_allow_html=True,
    )


def format_table_value(value: object) -> str:
    if isinstance(value, float):
        return f"{value:.4f}"
    return str(value)


def show_ndcg_chart(metrics: list[dict[str, object]]) -> None:
    chart_width = 840
    chart_height = 320
    plot_left = 78
    plot_top = 32
    plot_width = 700
    plot_height = 220
    baseline = plot_top + plot_height
    max_value = 1.0
    bar_width = 120
    gap = (plot_width - (bar_width * len(metrics))) / max(len(metrics) - 1, 1)

    grid_lines = []
    for index in range(6):
        value = index / 5
        y = baseline - (value / max_value) * plot_height
        grid_lines.append(
            f'<line x1="{plot_left}" y1="{y:.1f}" x2="{plot_left + plot_width}" y2="{y:.1f}" stroke="#e2e6df" />'
            f'<text x="42" y="{y + 4:.1f}" fill="#42474b" font-size="12">{value:.1f}</text>'
        )

    bars = []
    for index, row in enumerate(metrics):
        value = float(row["ndcg_at_k"])
        x = plot_left + index * (bar_width + gap)
        bar_height = min(value / max_value, 1.0) * plot_height
        y = baseline - bar_height
        label = html.escape(str(row["model"]))
        bars.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{bar_width}" height="{bar_height:.1f}" rx="3" fill="#2f80ed" />'
            f'<text x="{x + bar_width / 2:.1f}" y="{y - 8:.1f}" fill="#171717" font-size="13" text-anchor="middle" font-weight="700">{value:.4f}</text>'
            f'<text x="{x + bar_width / 2:.1f}" y="{baseline + 28}" fill="#171717" font-size="12" text-anchor="middle">{label}</text>'
        )

    chart = (
        '<div class="fyp-chart-panel">'
        f'<svg viewBox="0 0 {chart_width} {chart_height}" role="img" aria-label="NDCG at 5 comparison chart">'
        '<rect x="0" y="0" width="840" height="320" fill="#ffffff" />'
        '<text x="78" y="20" fill="#171717" font-size="15" font-weight="800">NDCG@5 comparison</text>'
        '<text x="18" y="155" fill="#171717" font-size="13" font-weight="700" transform="rotate(-90 18 155)">NDCG@5</text>'
        f"{''.join(grid_lines)}"
        f'<line x1="{plot_left}" y1="{baseline}" x2="{plot_left + plot_width}" y2="{baseline}" stroke="#aeb7ae" />'
        f"{''.join(bars)}"
        "</svg>"
        "</div>"
    )
    st.markdown(chart, unsafe_allow_html=True)


