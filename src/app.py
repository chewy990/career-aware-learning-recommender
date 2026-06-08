from __future__ import annotations

import csv
import base64
import html
import sys
from dataclasses import replace
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from edu_recommender.data import (  # noqa: E402
    LearnerProfile,
    Resource,
    ResourceModule,
    read_profiles,
    read_relevance_judgements,
    read_resource_modules,
    read_resources,
    read_skill_map,
)
from edu_recommender.evaluation import evaluate_recommendations  # noqa: E402
from edu_recommender.learning_path import (  # noqa: E402
    build_learning_path,
    can_gain_tracked_skill,
    can_improve_in_stage,
    completion_readiness,
    learning_item_reason,
    module_style_resource_title,
    modules_by_parent_resource,
    resource_item_source,
    selected_module_for_resource,
    skill_completion_cap,
)
from edu_recommender.models import Recommendation, RecommenderSuite  # noqa: E402
from edu_recommender.ui_helpers import (  # noqa: E402
    difficulty_label,
    display_skill,
    display_skill_list,
    show_ndcg_chart,
    show_recommendations,
    show_white_table,
    skill_level_badge,
)

DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "outputs"
ASSET_DIR = ROOT / "assets"
HERO_IMAGE = ASSET_DIR / "desktop-background.jpg"
MODELS = ["popularity", "content_based", "hybrid"]
TOP_K = 5


st.set_page_config(
    page_title="Career-Aware Learning Recommender",
    layout="wide",
)


def load_project_data():
    resources = read_resources(DATA_DIR / "resources.csv")
    modules = read_resource_modules(DATA_DIR / "resource_modules.csv")
    skill_map = read_skill_map(DATA_DIR / "skill_map.csv")
    profiles = read_profiles(DATA_DIR / "learner_profiles.csv")
    relevance = read_relevance_judgements(DATA_DIR / "relevance_judgements.csv")
    return resources, modules, skill_map, profiles, relevance


def apply_visual_theme() -> None:
    st.markdown(
        """
        <style>
        :root {
            --fyp-ink: #171717;
            --fyp-muted: #5f6368;
            --fyp-bg: #f6f7f4;
            --fyp-surface: #ffffff;
            --fyp-line: #d9ddd6;
            --fyp-maroon: #7a003c;
            --fyp-gold: #f1b434;
            --fyp-teal: #0f766e;
            --fyp-blue: #2f5f98;
        }

        .stApp {
            background:
                linear-gradient(180deg, rgba(122, 0, 60, 0.08), rgba(122, 0, 60, 0) 280px),
                var(--fyp-bg);
            color: var(--fyp-ink);
        }

        .block-container {
            max-width: 1180px;
            padding-top: 2rem;
            padding-bottom: 3rem;
        }

        section[data-testid="stSidebar"] {
            background: #101314;
            border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        section[data-testid="stSidebar"] * {
            color: #f7f3e8;
        }

        section[data-testid="stSidebar"] div[data-baseweb="select"] > div,
        section[data-testid="stSidebar"] div[data-baseweb="radio"],
        section[data-testid="stSidebar"] div[data-baseweb="slider"] {
            color: #f7f3e8;
        }

        .fyp-header {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(290px, 410px);
            gap: 1.5rem;
            align-items: center;
            margin: 0 0 1.4rem;
            padding: 1.35rem 1.45rem;
            background:
                linear-gradient(135deg, rgba(122, 0, 60, 0.96), rgba(34, 36, 38, 0.96)),
                linear-gradient(90deg, var(--fyp-gold), var(--fyp-teal));
            border: 1px solid rgba(23, 23, 23, 0.12);
            border-radius: 8px;
            box-shadow: 0 18px 45px rgba(30, 24, 18, 0.16);
            overflow: hidden;
        }

        .fyp-header:before {
            content: "";
            position: absolute;
            inset: auto 0 0 0;
            height: 5px;
            background: linear-gradient(90deg, var(--fyp-gold), var(--fyp-teal), var(--fyp-blue));
        }

        .fyp-kicker {
            color: #f6d36b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0;
            text-transform: uppercase;
            margin-bottom: 0.35rem;
        }

        .fyp-header h1 {
            color: #ffffff;
            font-size: 2.15rem;
            line-height: 1.08;
            margin: 0;
            letter-spacing: 0;
        }

        .fyp-header p {
            max-width: 680px;
            color: rgba(255, 255, 255, 0.9);
            margin: 0.55rem 0 0;
            font-size: 1rem;
        }

        .fyp-hero-visual {
            position: relative;
            min-height: 220px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 18px 38px rgba(0, 0, 0, 0.22);
            background: rgba(255, 255, 255, 0.08);
        }

        .fyp-hero-visual img {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 220px;
            object-fit: cover;
        }

        .fyp-header-meta {
            position: absolute;
            left: 0.8rem;
            right: 0.8rem;
            bottom: 0.8rem;
            display: flex;
            gap: 0.55rem;
            flex-wrap: wrap;
            justify-content: flex-start;
        }

        .fyp-pill {
            display: inline-flex;
            align-items: center;
            min-height: 2rem;
            padding: 0.35rem 0.65rem;
            border-radius: 8px;
            background: rgba(10, 10, 10, 0.42);
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: #ffffff;
            font-size: 0.82rem;
            font-weight: 700;
            white-space: nowrap;
        }

        div[data-testid="stTabs"] button {
            border-radius: 8px 8px 0 0;
            font-weight: 700;
        }

        div[data-testid="stTabs"] button p {
            color: var(--fyp-maroon);
            font-weight: 800;
        }

        div[data-testid="stTabs"] button[aria-selected="true"] p {
            color: #e3204f;
        }

        div[data-testid="stExpander"] {
            border: 1px solid var(--fyp-line);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.72);
            box-shadow: 0 12px 28px rgba(28, 31, 32, 0.06);
            overflow: hidden;
        }

        div[data-testid="stExpander"] details summary {
            background: linear-gradient(90deg, #ffffff, #f5f2ea);
            border-bottom: 1px solid rgba(217, 221, 214, 0.76);
            min-height: 3rem;
        }

        div[data-testid="stExpander"] details summary p {
            font-weight: 800;
            color: var(--fyp-ink);
        }

        div[data-testid="stVerticalBlockBorderWrapper"] {
            border-color: rgba(122, 0, 60, 0.14);
            border-radius: 8px;
            background: var(--fyp-surface);
            box-shadow: 0 8px 22px rgba(20, 20, 20, 0.05);
        }

        div[data-testid="stVerticalBlockBorderWrapper"]:hover {
            border-color: rgba(122, 0, 60, 0.34);
        }

        .stMarkdown h3,
        .stMarkdown h4 {
            letter-spacing: 0;
        }

        .stMarkdown p {
            color: inherit;
        }

        div[data-testid="stDataFrame"] {
            border: 1px solid var(--fyp-line);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 10px 26px rgba(20, 20, 20, 0.05);
            background: #ffffff;
        }

        .fyp-research-panel {
            padding: 1rem;
            border: 1px solid var(--fyp-line);
            border-radius: 8px;
            background: #fffdf7;
            box-shadow: 0 10px 26px rgba(20, 20, 20, 0.05);
        }

        .fyp-research-table {
            display: grid;
            gap: 0.7rem;
        }

        .fyp-research-row {
            display: grid;
            grid-template-columns: 56px minmax(170px, 1.1fr) minmax(90px, 0.55fr) 78px minmax(260px, 1.8fr);
            gap: 0.8rem;
            align-items: start;
            padding: 0.9rem;
            border: 1px solid rgba(122, 0, 60, 0.14);
            border-radius: 8px;
            background: #ffffff;
        }

        .fyp-research-head {
            background: #171717;
            color: #ffffff;
            font-size: 0.78rem;
            font-weight: 800;
            text-transform: uppercase;
        }

        .fyp-research-cell {
            color: var(--fyp-ink);
            font-size: 0.92rem;
            line-height: 1.45;
            overflow-wrap: anywhere;
        }

        .fyp-research-muted {
            color: var(--fyp-muted);
            font-weight: 700;
        }

        .fyp-white-table-wrap {
            overflow-x: auto;
            border: 1px solid var(--fyp-line);
            border-radius: 8px;
            background: #ffffff;
            box-shadow: 0 10px 26px rgba(20, 20, 20, 0.05);
            margin: 0.9rem 0 1.4rem;
        }

        .fyp-white-table {
            width: 100%;
            border-collapse: collapse;
            color: var(--fyp-ink);
            background: #ffffff;
            font-size: 0.92rem;
        }

        .fyp-white-table th {
            background: #f7f7f3;
            color: #2a2d2f;
            font-weight: 800;
            text-align: left;
            border-bottom: 1px solid var(--fyp-line);
            border-right: 1px solid var(--fyp-line);
            padding: 0.75rem 0.85rem;
            white-space: nowrap;
        }

        .fyp-white-table td {
            background: #ffffff;
            color: var(--fyp-ink);
            border-bottom: 1px solid #ecefeb;
            border-right: 1px solid #ecefeb;
            padding: 0.75rem 0.85rem;
            vertical-align: top;
        }

        .fyp-white-table tr:last-child td {
            border-bottom: 0;
        }

        .fyp-white-table th:last-child,
        .fyp-white-table td:last-child {
            border-right: 0;
        }

        .fyp-white-table td.numeric {
            text-align: right;
            font-variant-numeric: tabular-nums;
            font-weight: 700;
        }

        .fyp-level-badge {
            display: inline;
            font-weight: 800;
            white-space: nowrap;
        }

        .fyp-level-not-started {
            color: #ff6b00;
        }

        .fyp-level-basic {
            color: #b89a00;
        }

        .fyp-level-working {
            color: #00a846;
        }

        .fyp-level-confident {
            color: #aa00ff;
        }

        .fyp-mastery-celebration {
            color: #aa00ff;
            font-weight: 900;
            font-size: 1.02rem;
            margin: 0.15rem 0 0.65rem;
        }

        .fyp-mastery-celebration .fyp-star {
            font-size: 1rem;
        }

        .fyp-skill-progress {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin: 0.2rem 0 0.45rem;
        }

        .fyp-skill-progress-item {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.15rem 0;
            font-size: 0.86rem;
            color: var(--fyp-ink);
        }

        .fyp-skill-progress-name {
            font-weight: 800;
        }

        .fyp-level-arrow {
            color: var(--fyp-muted);
            font-weight: 800;
        }

        .fyp-completed-title {
            color: #157347;
            font-weight: 800;
        }

        .fyp-locked-row {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            color: #31363f;
            font-weight: 800;
            margin: 0.15rem 0 0.12rem;
        }

        .fyp-lock-icon {
            font-size: 0.98rem;
            line-height: 1;
        }

        .fyp-lock-hint {
            color: #31363f;
            font-size: 0.9rem;
            font-weight: 650;
            margin: 0 0 0.55rem 1.45rem;
        }

        .fyp-chart-panel {
            padding: 1rem;
            border: 1px solid var(--fyp-line);
            border-radius: 8px;
            background: #ffffff;
            box-shadow: 0 10px 26px rgba(20, 20, 20, 0.05);
            margin-bottom: 1.2rem;
        }

        .fyp-chart-panel svg {
            display: block;
            width: 100%;
            height: auto;
        }

        .block-container div[data-testid="stSelectbox"] label p,
        .block-container div[data-testid="stSlider"] label p,
        .block-container div[data-testid="stWidgetLabel"] p,
        .fyp-research-controls label p,
        .fyp-research-controls div[data-testid="stWidgetLabel"] p {
            color: var(--fyp-ink) !important;
            font-weight: 800;
        }

        .block-container div[data-testid="stSlider"] [role="slider"],
        .fyp-research-controls div[data-testid="stSlider"] [role="slider"] {
            background-color: var(--fyp-muted) !important;
            border-color: var(--fyp-muted) !important;
            box-shadow: 0 0 0 0.15rem rgba(95, 99, 104, 0.14) !important;
        }

        .block-container div[data-testid="stSlider"] [data-baseweb="slider"] div,
        .fyp-research-controls div[data-testid="stSlider"] [data-baseweb="slider"] div {
            border-color: var(--fyp-muted) !important;
        }

        .stButton button {
            border-radius: 8px;
            border: 1px solid rgba(122, 0, 60, 0.28);
            background: #ffffff;
            color: var(--fyp-maroon);
            font-weight: 800;
        }

        .stButton button:hover {
            border-color: var(--fyp-maroon);
            color: var(--fyp-maroon);
            background: #fff8e7;
        }

        .stCheckbox label p {
            color: var(--fyp-ink);
            font-weight: 800;
        }

        .stCheckbox label {
            gap: 0.55rem;
        }

        .stCheckbox label > div:first-child {
            width: 1.15rem;
            height: 1.15rem;
            border-radius: 4px;
            border: 2px solid var(--fyp-maroon);
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(122, 0, 60, 0.08);
        }

        .stCheckbox label > div:first-child:hover {
            border-color: #e3204f;
            box-shadow: 0 0 0 3px rgba(227, 32, 79, 0.14);
        }

        .stCheckbox label:has(input:checked) > div:first-child {
            border-color: var(--fyp-gold);
            background: var(--fyp-maroon);
            box-shadow: 0 0 0 3px rgba(241, 180, 52, 0.18);
        }

        .stCheckbox label > div:first-child svg {
            color: #ffffff;
        }

        div[data-testid="stCaptionContainer"] {
            color: var(--fyp-muted);
        }

        hr {
            border-color: rgba(217, 221, 214, 0.85);
        }

        @media (max-width: 760px) {
            .block-container {
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .fyp-header {
                grid-template-columns: 1fr;
                padding: 1.15rem;
            }

            .fyp-header h1 {
                font-size: 1.65rem;
            }

            .fyp-hero-visual,
            .fyp-hero-visual img {
                min-height: 170px;
            }

            .fyp-research-row {
                grid-template-columns: 1fr;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def show_app_header() -> None:
    hero_uri = image_data_uri(HERO_IMAGE)
    hero_markup = (
        f'<div class="fyp-hero-visual">'
        f'<img src="{hero_uri}" alt="Abstract learning path with connected data nodes and resource cards">'
        f'<div class="fyp-header-meta">'
        f'<span class="fyp-pill">3 pathways</span>'
        f'<span class="fyp-pill">Hybrid model</span>'
        f'<span class="fyp-pill">Explainable</span>'
        f'</div></div>'
        if hero_uri
        else (
            '<div class="fyp-header-meta">'
            '<span class="fyp-pill">3 pathways</span>'
            '<span class="fyp-pill">Hybrid model</span>'
            '<span class="fyp-pill">Explainable</span>'
            '</div>'
        )
    )
    st.markdown(
        (
            '<section class="fyp-header">'
            '<div>'
            '<div class="fyp-kicker">FYP Recommender Prototype</div>'
            '<h1>Career-Aware Learning Path</h1>'
            '<p>Precise learning steps for computing learners, tuned by career goal, skill gaps, and progress.</p>'
            '</div>'
            f'{hero_markup}'
            '</section>'
        ),
        unsafe_allow_html=True,
    )


def image_data_uri(path: Path) -> str:
    if not path.exists():
        return ""
    mime_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(path.suffix.lower(), "application/octet-stream")
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def main() -> None:
    resources, modules, skill_map, profiles, relevance = load_project_data()
    suite = RecommenderSuite(resources, skill_map)
    resources_by_id = {resource.resource_id: resource for resource in resources}
    modules_by_parent = modules_by_parent_resource(modules)

    apply_visual_theme()
    show_app_header()

    profile = build_active_profile(profiles, skill_map)
    gaps = suite.skill_gaps(profile)
    path = get_stable_learning_path(suite, profile, resources_by_id, total_k=12)

    learner_tab, research_tab = st.tabs(["Learner View", "Research View"])

    with learner_tab:
        show_learner_view(profile, gaps, path, skill_map, resources_by_id, modules_by_parent)

    with research_tab:
        show_research_view(suite, profile, profiles, relevance, resources, skill_map)


def build_active_profile(
    profiles: list[LearnerProfile],
    skill_map: dict[str, dict[str, int]],
) -> LearnerProfile:
    mode = st.sidebar.radio(
        "Profile mode",
        ["Sample learner", "Build custom learner"],
    )

    if mode == "Sample learner":
        return sample_profile_sidebar(profiles)
    return custom_profile_sidebar(skill_map)


def sample_profile_sidebar(profiles: list[LearnerProfile]) -> LearnerProfile:
    selected_profile_name = st.sidebar.selectbox(
        "Learner profile",
        [f"{profile.profile_id} - {profile.name}" for profile in profiles],
    )
    selected_profile_id = selected_profile_name.split(" - ", maxsplit=1)[0]
    profile = next(item for item in profiles if item.profile_id == selected_profile_id)

    signature = f"sample:{profile.profile_id}"
    if st.session_state.get("active_signature") != signature:
        clear_learning_path_snapshot()
        st.session_state.pop("pending_skill_slider_sync", None)
        st.session_state["active_signature"] = signature
        st.session_state["active_skills"] = dict(profile.current_skills)
        st.session_state["active_completed_topics"] = set(profile.completed_topics)
        st.session_state["completed_resources"] = []
        st.session_state["last_progress_update"] = None

    return replace(
        profile,
        current_skills=dict(st.session_state["active_skills"]),
        completed_topics=set(st.session_state["active_completed_topics"]),
        weak_skills=infer_weak_skills(
            st.session_state["active_skills"],
            profile.target_pathway,
            st.session_state["active_completed_topics"],
        ),
    )


def custom_profile_sidebar(skill_map: dict[str, dict[str, int]]) -> LearnerProfile:
    target_pathway = st.sidebar.selectbox(
        "Target pathway",
        ["data_analyst", "ml_engineer", "software_developer"],
        format_func=lambda value: value.replace("_", " ").title(),
    )
    preferred_difficulty = st.sidebar.select_slider(
        "Preferred starting difficulty",
        options=[1, 2, 3],
        value=1,
        format_func=lambda value: {1: "Beginner", 2: "Intermediate", 3: "Advanced"}[value],
        help="Controls how difficult the first recommended materials should feel. This is not your current skill level.",
    )

    signature = f"custom:{target_pathway}"
    pathway_skills = {
        skill: weight for skill, weight in skill_map[target_pathway].items() if weight > 0
    }
    if st.session_state.get("active_signature") != signature:
        clear_learning_path_snapshot()
        st.session_state.pop("pending_skill_slider_sync", None)
        st.session_state["active_signature"] = signature
        st.session_state["active_skills"] = {skill: 0 for skill in pathway_skills}
        st.session_state["active_completed_topics"] = set()
        st.session_state["completed_resources"] = []
        st.session_state["last_progress_update"] = None
        for skill in pathway_skills:
            st.session_state[skill_slider_key(signature, skill)] = 0
    apply_pending_skill_slider_sync(signature)

    st.sidebar.markdown("### What you already know")
    st.sidebar.caption(
        "Higher skill levels reduce the gap for that topic, so fewer beginner resources for that skill are prioritised."
    )
    for skill, pathway_weight in sorted(pathway_skills.items(), key=lambda item: (-item[1], item[0])):
        current_value = int(st.session_state["active_skills"].get(skill, 0))
        slider_key = skill_slider_key(signature, skill)
        if slider_key not in st.session_state:
            st.session_state[slider_key] = current_value
        st.session_state["active_skills"][skill] = st.sidebar.slider(
            skill.replace("_", " ").title(),
            min_value=0,
            max_value=3,
            key=slider_key,
            help=f"Pathway importance: {pathway_weight}/3",
        )

    completed_topics = {
        skill for skill, level in st.session_state["active_skills"].items() if level >= 1
    } | set(st.session_state["active_completed_topics"])
    weak_skills = infer_weak_skills(st.session_state["active_skills"], target_pathway, completed_topics)

    return LearnerProfile(
        profile_id="CUSTOM",
        name="Custom Learner",
        target_pathway=target_pathway,
        current_skills=dict(st.session_state["active_skills"]),
        completed_topics=completed_topics,
        weak_skills=weak_skills,
        preferred_difficulty=preferred_difficulty,
        max_duration_hours=10,
        preferred_format="course",
    )


def infer_weak_skills(
    current_skills: dict[str, int],
    target_pathway: str,
    completed_topics: set[str],
) -> set[str]:
    _, _, skill_map, _, _ = load_project_data()
    requirements = skill_map[target_pathway]
    weak_skills = {
        skill
        for skill, required_level in requirements.items()
        if required_level > 0 and current_skills.get(skill, 0) < min(required_level, 2)
    }
    return weak_skills - completed_topics


def show_profile(profile: LearnerProfile) -> None:
    st.markdown(
        f"**{profile.name}**  \n"
        f"Pathway: **{profile.target_pathway.replace('_', ' ').title()}**  \n"
        f"Preferred level: **{difficulty_label(profile.preferred_difficulty)}**"
    )
    completed = display_skill_list(profile.completed_topics)
    st.caption(f"Completed topics: {completed}")
    completed_resources = st.session_state.get("completed_resources", [])
    if completed_resources:
        st.caption(f"Resources completed in this session: {len(completed_resources)}")


def show_skill_gaps(
    profile: LearnerProfile,
    gaps: dict[str, float],
    skill_map: dict[str, dict[str, int]],
    path: dict[str, list[Recommendation]],
    resources_by_id: dict[str, Resource],
    modules_by_parent: dict[str, list[ResourceModule]],
) -> None:
    st.markdown("#### Priority Skill Gaps")
    actionable_skills = remaining_actionable_gap_skills(
        profile,
        gaps,
        path,
        resources_by_id,
        modules_by_parent,
    )
    gap_rows = [
        {
            "Skill": display_skill(skill),
            "Gap score": round(score, 3),
            "Current": profile.current_skills.get(skill, 0),
            "Target": skill_map[profile.target_pathway].get(skill, 0),
        }
        for skill, score in sorted(gaps.items(), key=lambda item: item[1], reverse=True)
        if skill in actionable_skills
    ]
    if gap_rows:
        show_skill_gap_table(gap_rows[:5])
    else:
        st.success("No remaining priority gaps in the current learning path.")


def remaining_actionable_gap_skills(
    profile: LearnerProfile,
    gaps: dict[str, float],
    path: dict[str, list[Recommendation]],
    resources_by_id: dict[str, Resource],
    modules_by_parent: dict[str, list[ResourceModule]],
) -> set[str]:
    completed_item_ids = {
        item.get("item_id", f"resource:{item.get('resource_id')}")
        for item in st.session_state.get("completed_resources", [])
    }
    actionable: set[str] = set()
    for stage, recommendations in path.items():
        for recommendation in recommendations:
            resource = resources_by_id[recommendation.resource_id]
            module = stable_selected_module_for_resource(
                profile,
                stage,
                resource,
                modules_by_parent.get(resource.resource_id, []),
                gaps,
            )
            item_id = f"module:{module.module_id}" if module else f"resource:{resource.resource_id}"
            if item_id in completed_item_ids:
                continue
            item_skills = module.skills if module else resource.skills
            if not can_improve_in_stage(stage, profile.current_skills, item_skills):
                continue
            actionable.update(item_skills & set(gaps))
    return actionable


def show_skill_gap_table(rows: list[dict[str, object]]) -> None:
    body_rows = []
    for row in rows:
        current_level = int(row["Current"])
        target_level = int(row["Target"])
        body_rows.append(
            "<tr>"
            f"<td>{html.escape(str(row['Skill']))}</td>"
            f"<td>{html.escape(skill_gap_priority(float(row['Gap score'])))}</td>"
            f"<td>{skill_level_badge(current_level)}</td>"
            f"<td>{skill_level_badge(target_level)}</td>"
            "</tr>"
        )
    st.markdown(
        (
            '<div class="fyp-white-table-wrap">'
            '<table class="fyp-white-table">'
            "<thead><tr><th>Skill</th><th>Priority</th><th>Your level</th><th>Target level</th></tr></thead>"
            f"<tbody>{''.join(body_rows)}</tbody>"
            "</table>"
            "</div>"
        ),
        unsafe_allow_html=True,
    )


def skill_gap_priority(score: float) -> str:
    if score >= 0.75:
        return "High"
    if score >= 0.4:
        return "Medium"
    return "Low"


def show_completion_control(
    profile: LearnerProfile,
    path: dict[str, list[Recommendation]],
    resources_by_id: dict[str, Resource],
) -> None:
    if st.button("Reset progress"):
        reset_progress_state()
        st.rerun()


def reset_progress_state() -> None:
    state_keys = [
        "active_signature",
        "active_skills",
        "active_completed_topics",
        "completed_resources",
        "last_progress_update",
        "display_learning_path",
        "display_learning_path_signature",
        "display_learning_path_start_skills",
        "display_learning_items",
        "path_locked_by_completion",
        "last_completed_stage",
    ]
    widget_prefixes = ("complete_", "done_")
    st.session_state["progress_reset_version"] = (
        st.session_state.get("progress_reset_version", 0) + 1
    )
    for key in state_keys:
        st.session_state.pop(key, None)
    for key in list(st.session_state.keys()):
        key_name = str(key)
        if any(prefix in key_name for prefix in widget_prefixes):
            st.session_state.pop(key, None)


def clear_learning_path_snapshot() -> None:
    st.session_state.pop("display_learning_path", None)
    st.session_state.pop("display_learning_path_signature", None)
    st.session_state.pop("display_learning_path_start_skills", None)
    st.session_state.pop("display_learning_items", None)
    st.session_state.pop("path_locked_by_completion", None)


def complete_resource(profile: LearnerProfile, resource: Resource) -> None:
    complete_learning_item(
        profile=profile,
        item_id=f"resource:{resource.resource_id}",
        title=resource.title,
        skills=resource.skills,
        topic=resource.topic,
        resource_id=resource.resource_id,
    )


def complete_learning_item(
    profile: LearnerProfile,
    item_id: str,
    title: str,
    skills: set[str],
    topic: str,
    resource_id: str,
    stage: str | None = None,
    source: str = "",
    difficulty: str = "",
    duration_hours: float | None = None,
    explanation: str = "",
    skill_targets: dict[str, int] | None = None,
) -> None:
    active_skills = dict(st.session_state.get("active_skills", profile.current_skills))
    completed_topics = set(st.session_state.get("active_completed_topics", profile.completed_topics))
    before_skills = dict(active_skills)
    for skill in skills:
        current_level = active_skills.get(skill, 0)
        max_level = skill_completion_cap(stage, current_level, skill, skill_targets)
        if current_level < max_level:
            active_skills[skill] = min(current_level + 1, max_level)
        completed_topics.add(skill)
    completed_topics.add(topic)

    completed_resources = list(st.session_state.get("completed_resources", []))
    completed_item_ids = {
        item.get("item_id", f"resource:{item.get('resource_id')}")
        for item in completed_resources
    }
    if item_id not in completed_item_ids:
        completed_resources.append(
            {
                "item_id": item_id,
                "resource_id": resource_id,
                "title": title,
                "skills": ", ".join(sorted(skills)),
                "source": source,
                "difficulty": difficulty,
                "duration_hours": duration_hours,
                "explanation": explanation,
            }
        )

    skill_changes = {
        skill: (before_skills.get(skill, 0), active_skills.get(skill, 0))
        for skill in sorted(skills)
        if active_skills.get(skill, 0) != before_skills.get(skill, 0)
    }
    reinforced_skills = sorted(skills) if not skill_changes else []
    st.session_state["active_skills"] = active_skills
    active_signature = st.session_state.get("active_signature", profile.profile_id)
    if active_signature.startswith("custom:"):
        st.session_state["pending_skill_slider_sync"] = {
            "signature": active_signature,
            "skills": active_skills,
        }
    st.session_state["active_completed_topics"] = completed_topics
    st.session_state["completed_resources"] = completed_resources
    st.session_state["last_progress_update"] = {
        "title": title,
        "skill_changes": skill_changes,
        "reinforced_skills": reinforced_skills,
    }
    if stage:
        st.session_state["last_completed_stage"] = stage
    st.session_state["path_locked_by_completion"] = True


def stable_selected_module_for_resource(
    profile: LearnerProfile,
    stage: str,
    resource: Resource,
    modules: list[ResourceModule],
    gaps: dict[str, float],
) -> ResourceModule | None:
    active_signature = st.session_state.get("active_signature", profile.profile_id)
    selection_key = f"{active_signature}|{stage}|{resource.resource_id}"
    selections = st.session_state.setdefault("display_learning_items", {})
    module_by_id = {module.module_id: module for module in modules}

    if selection_key in selections:
        module_id = selections[selection_key]
        return module_by_id.get(module_id) if module_id else None

    module = selected_module_for_resource(profile, resource, modules, gaps)
    selections[selection_key] = module.module_id if module else ""
    return module


def get_stable_learning_path(
    suite: RecommenderSuite,
    profile: LearnerProfile,
    resources_by_id: dict[str, Resource],
    total_k: int,
) -> dict[str, list[Recommendation]]:
    signature = learning_path_signature(profile)
    should_rebuild = (
        "display_learning_path" not in st.session_state
        or (
            st.session_state.get("display_learning_path_signature") != signature
            and not st.session_state.get("path_locked_by_completion", False)
        )
    )
    if should_rebuild:
        st.session_state["display_learning_path"] = build_learning_path(
            suite, profile, resources_by_id, total_k=total_k
        )
        st.session_state["display_learning_path_signature"] = signature
        st.session_state["display_learning_path_start_skills"] = dict(profile.current_skills)
        st.session_state["path_locked_by_completion"] = False
    return st.session_state["display_learning_path"]


def learning_path_signature(profile: LearnerProfile) -> str:
    skill_signature = "|".join(
        f"{skill}:{level}" for skill, level in sorted(profile.current_skills.items())
    )
    completed_signature = "|".join(sorted(profile.completed_topics))
    active_signature = st.session_state.get("active_signature", profile.profile_id)
    return (
        f"{active_signature}|difficulty:{profile.preferred_difficulty}|"
        f"skills:{skill_signature}|completed:{completed_signature}"
    )


def skill_slider_key(signature: str, skill: str) -> str:
    return f"skill_level_{signature}_{skill}"


def apply_pending_skill_slider_sync(signature: str) -> None:
    pending = st.session_state.get("pending_skill_slider_sync")
    if not pending or pending.get("signature") != signature:
        return
    for skill, level in pending["skills"].items():
        st.session_state[skill_slider_key(signature, skill)] = level
    st.session_state.pop("pending_skill_slider_sync", None)


def show_learning_path(
    path: dict[str, list[Recommendation]],
    resources_by_id: dict[str, Resource],
    profile: LearnerProfile,
    gaps: dict[str, float],
    skill_map: dict[str, dict[str, int]],
    modules_by_parent: dict[str, list[ResourceModule]],
) -> None:
    path_start_skills = st.session_state.get(
        "display_learning_path_start_skills",
        profile.current_skills,
    )
    skill_targets = skill_map.get(profile.target_pathway, {})
    for stage, recommendations in path.items():
        expanded = stage.startswith("1.") or stage.startswith("2.") or (
            st.session_state.get("last_completed_stage") == stage
        )
        with st.expander(stage, expanded=expanded):
            if not recommendations:
                st.info("No resources assigned to this stage.")
                continue
            shown_count = 0
            for recommendation in recommendations:
                resource = resources_by_id[recommendation.resource_id]
                module = stable_selected_module_for_resource(
                    profile,
                    stage,
                    resource,
                    modules_by_parent.get(resource.resource_id, []),
                    gaps,
                )
                item_id = (
                    f"module:{module.module_id}"
                    if module
                    else f"resource:{resource.resource_id}"
                )
                item_title = module.module_title if module else module_style_resource_title(resource)
                item_skills = module.skills if module else resource.skills
                item_difficulty = module.difficulty_level if module else resource.difficulty_level
                item_duration = module.duration_hours if module else resource.duration_hours
                item_reason = learning_item_reason(stage, item_skills)
                if not can_improve_in_stage(stage, path_start_skills, item_skills):
                    continue
                shown_count += 1
                with st.container(border=True):
                    completed_resource_ids = {
                        item.get("item_id", f"resource:{item.get('resource_id')}")
                        for item in st.session_state.get("completed_resources", [])
                    }
                    reset_version = st.session_state.get("progress_reset_version", 0)
                    active_signature = st.session_state.get("active_signature", profile.profile_id)
                    checkbox_key = (
                        f"complete_{reset_version}_{active_signature}_{stage}_{item_id}"
                    )
                    completed = item_id in completed_resource_ids
                    ready, not_ready_reason = completion_readiness(
                        stage,
                        profile.current_skills,
                        item_skills,
                    )
                    still_improves = can_gain_tracked_skill(
                        stage,
                        profile.current_skills,
                        item_skills,
                        skill_targets,
                    )
                    if ready or completed:
                        st.checkbox(
                            "Completed",
                            value=completed,
                            key=checkbox_key,
                            disabled=completed,
                            on_change=complete_learning_item,
                            args=(
                                profile,
                                item_id,
                                item_title,
                                item_skills,
                                resource.topic,
                                resource.resource_id,
                                stage,
                                resource_item_source(resource, module),
                                difficulty_label(item_difficulty),
                                item_duration,
                                item_reason,
                                skill_targets,
                            ),
                        )
                    else:
                        st.markdown(
                            '<div class="fyp-locked-row">'
                            '<span class="fyp-lock-icon">&#128274;</span>'
                            '<span>Locked</span>'
                            '</div>',
                            unsafe_allow_html=True,
                        )
                        st.markdown(
                            f'<div class="fyp-lock-hint">{html.escape(not_ready_reason)}</div>',
                            unsafe_allow_html=True,
                        )
                    if completed:
                        st.markdown(
                            f'<span class="fyp-completed-title">{html.escape(item_title)}</span>',
                            unsafe_allow_html=True,
                        )
                    else:
                        st.markdown(f"**{item_title}**")
                    item_source = resource_item_source(resource, module)
                    if item_source:
                        st.caption(item_source)
                    st.caption(
                        f"{difficulty_label(item_difficulty)} | {item_duration:g} hours"
                    )
                    if ready and not completed and not still_improves:
                        st.caption("Additional doable practice; useful reinforcement, but it will not raise a tracked skill level.")
                    if item_reason:
                        st.write(item_reason)
            if shown_count == 0:
                st.info("No useful next steps for this stage right now.")


def show_learner_view(
    profile: LearnerProfile,
    gaps: dict[str, float],
    path: dict[str, list[Recommendation]],
    skill_map: dict[str, dict[str, int]],
    resources_by_id: dict[str, Resource],
    modules_by_parent: dict[str, list[ResourceModule]],
) -> None:
    summary_col, action_col = st.columns([1, 1])
    with summary_col:
        show_profile(profile)
    with action_col:
        show_completion_control(profile, path, resources_by_id)

    show_progress_summary(
        profile,
        skill_map,
        gaps,
        path,
        resources_by_id,
        modules_by_parent,
        include_completed_resources=False,
    )

    st.subheader("Your Learning Path")
    st.caption("Learn only the critical basics, then practise early. Deepen later only after useful practice.")
    show_learning_path(path, resources_by_id, profile, gaps, skill_map, modules_by_parent)

    show_completed_resources(profile)

    with st.expander("View skill gaps"):
        show_skill_gaps(profile, gaps, skill_map, path, resources_by_id, modules_by_parent)


def should_show_mastery_celebration(
    profile: LearnerProfile,
    gaps: dict[str, float],
    path: dict[str, list[Recommendation]],
    skill_map: dict[str, dict[str, int]],
    resources_by_id: dict[str, Resource],
    modules_by_parent: dict[str, list[ResourceModule]],
) -> bool:
    if remaining_actionable_gap_skills(profile, gaps, path, resources_by_id, modules_by_parent):
        return False

    completed_item_ids = {
        item.get("item_id", f"resource:{item.get('resource_id')}")
        for item in st.session_state.get("completed_resources", [])
    }
    path_start_skills = st.session_state.get(
        "display_learning_path_start_skills",
        profile.current_skills,
    )
    target_skills = {
        skill for skill, target in skill_map[profile.target_pathway].items() if target > 0
    }
    visible_item_ids: set[str] = set()
    visible_target_skills: set[str] = set()

    for stage, recommendations in path.items():
        for recommendation in recommendations:
            resource = resources_by_id[recommendation.resource_id]
            module = stable_selected_module_for_resource(
                profile,
                stage,
                resource,
                modules_by_parent.get(resource.resource_id, []),
                gaps,
            )
            item_id = f"module:{module.module_id}" if module else f"resource:{resource.resource_id}"
            item_skills = module.skills if module else resource.skills
            if not can_improve_in_stage(stage, path_start_skills, item_skills):
                continue
            visible_item_ids.add(item_id)
            visible_target_skills.update(item_skills & target_skills)

    if not visible_item_ids or not visible_item_ids.issubset(completed_item_ids):
        return False
    if not visible_target_skills:
        return False
    return all(profile.current_skills.get(skill, 0) >= 3 for skill in visible_target_skills)


def show_progress_summary(
    profile: LearnerProfile,
    skill_map: dict[str, dict[str, int]],
    gaps: dict[str, float] | None = None,
    path: dict[str, list[Recommendation]] | None = None,
    resources_by_id: dict[str, Resource] | None = None,
    modules_by_parent: dict[str, list[ResourceModule]] | None = None,
    include_completed_resources: bool = True,
) -> None:
    st.subheader("Progress")
    if (
        gaps is not None
        and path is not None
        and resources_by_id is not None
        and modules_by_parent is not None
        and should_show_mastery_celebration(
            profile,
            gaps,
            path,
            skill_map,
            resources_by_id,
            modules_by_parent,
        )
    ):
        st.markdown(
            '<div class="fyp-mastery-celebration">'
            "<span class=\"fyp-star\">*</span> Congratulations on completing your course - your tech skills just leveled up, and we can't wait to see what you build next!"
            '</div>',
            unsafe_allow_html=True,
        )
    last_update = st.session_state.get("last_progress_update")
    if last_update:
        st.success(f"Last completed: {last_update['title']}")
        changes = last_update.get("skill_changes", {})
        if changes:
            change_items = "".join(
                (
                    '<span class="fyp-skill-progress-item">'
                    f'<span class="fyp-skill-progress-name">{html.escape(display_skill(skill))}</span>'
                    f"{skill_level_badge(before)}"
                    '<span class="fyp-level-arrow">to</span>'
                    f"{skill_level_badge(after)}"
                    "</span>"
                )
                for skill, (before, after) in changes.items()
            )
            st.markdown(
                f'<div class="fyp-skill-progress">{change_items}</div>',
                unsafe_allow_html=True,
            )
        else:
            reinforced = last_update.get("reinforced_skills", [])
            if reinforced:
                st.markdown(
                    f"**Reinforced:** {display_skill_list(reinforced)}"
                )

    if include_completed_resources:
        show_completed_resources(profile)


def show_completed_resources(profile: LearnerProfile) -> None:
    completed_resources = st.session_state.get("completed_resources", [])
    if completed_resources:
        with st.expander("Completed resources"):
            for item in completed_resources:
                reset_version = st.session_state.get("progress_reset_version", 0)
                active_signature = st.session_state.get("active_signature", profile.profile_id)
                item_id = item.get("item_id", f"resource:{item['resource_id']}")
                with st.container(border=True):
                    st.checkbox(
                        "Completed",
                        value=True,
                        disabled=True,
                        key=f"done_{reset_version}_{active_signature}_{item_id}",
                    )
                    st.markdown(
                        f'<span class="fyp-completed-title">{html.escape(item["title"])}</span>',
                        unsafe_allow_html=True,
                    )
                    if item.get("source"):
                        st.caption(item["source"])
                    difficulty = item.get("difficulty")
                    duration_hours = item.get("duration_hours")
                    if difficulty and duration_hours is not None:
                        st.caption(f"{difficulty} | {duration_hours:g} hours")
                    elif difficulty:
                        st.caption(difficulty)
                    if item.get("explanation"):
                        st.write(item["explanation"])


def show_research_view(
    suite: RecommenderSuite,
    profile: LearnerProfile,
    profiles: list[LearnerProfile],
    relevance: dict[str, set[str]],
    resources: list[Resource],
    skill_map: dict[str, dict[str, int]],
) -> None:
    st.subheader("Recommendation Model Comparison")
    st.markdown('<div class="fyp-research-controls">', unsafe_allow_html=True)
    controls_col, _ = st.columns([1, 2])
    with controls_col:
        selected_model = st.selectbox(
            "Recommendation model",
            ["hybrid", "content_based", "popularity"],
            help="Compare how different models rank the same learner profile.",
        )
        top_k = st.slider("Number of recommendations", min_value=3, max_value=10, value=TOP_K)
    st.markdown("</div>", unsafe_allow_html=True)
    show_recommendations(suite.recommend(profile, model=selected_model, top_k=top_k))

    metrics = calculate_metrics(suite, profiles, relevance)
    show_white_table(
        metrics,
        ["model", "k", "precision_at_k", "recall_at_k", "ndcg_at_k"],
    )
    show_ndcg_chart(metrics)

    with st.expander("Dataset Summary"):
        st.write(f"Learning resources: {len(resources)}")
        st.write(f"Learner profiles: {len(profiles)}")
        st.write(f"Skill map entries: {len(next(iter(skill_map.values())))}")
        st.write(f"Output folder: `{OUTPUT_DIR}`")

    with st.expander("View raw hybrid output"):
        hybrid_output = OUTPUT_DIR / "recommendations_hybrid.csv"
        if hybrid_output.exists():
            show_white_table(
                read_csv_rows(hybrid_output),
                ["profile_id", "model", "rank", "resource_id", "title", "provider", "score", "explanation"],
            )
        else:
            st.info("Run `src/run_pipeline.py` to generate output CSV files.")


def calculate_metrics(suite: RecommenderSuite, profiles, relevance):
    recommendations_by_model = {}
    for model in MODELS:
        recommendations_by_model[model] = {
            profile.profile_id: suite.recommend(profile, model=model, top_k=TOP_K)
            for profile in profiles
        }
    return evaluate_recommendations(recommendations_by_model, relevance, k=TOP_K)


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


if __name__ == "__main__":
    main()
