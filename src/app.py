from __future__ import annotations

import csv
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
    read_profiles,
    read_relevance_judgements,
    read_resources,
    read_skill_map,
)
from edu_recommender.evaluation import evaluate_recommendations  # noqa: E402
from edu_recommender.models import Recommendation, RecommenderSuite  # noqa: E402

DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "outputs"
MODELS = ["popularity", "content_based", "hybrid"]
TOP_K = 5


st.set_page_config(
    page_title="Career-Aware Learning Recommender",
    layout="wide",
)


def load_project_data():
    resources = read_resources(DATA_DIR / "resources.csv")
    skill_map = read_skill_map(DATA_DIR / "skill_map.csv")
    profiles = read_profiles(DATA_DIR / "learner_profiles.csv")
    relevance = read_relevance_judgements(DATA_DIR / "relevance_judgements.csv")
    return resources, skill_map, profiles, relevance


def main() -> None:
    resources, skill_map, profiles, relevance = load_project_data()
    suite = RecommenderSuite(resources, skill_map)
    resources_by_id = {resource.resource_id: resource for resource in resources}

    st.title("Career-Aware Learning Path")
    st.caption("A dynamic recommender that helps learners practise sooner, not complete fixed tracks")

    profile = build_active_profile(profiles, skill_map)
    gaps = suite.skill_gaps(profile)
    path = get_stable_learning_path(suite, profile, resources_by_id, total_k=12)

    learner_tab, research_tab = st.tabs(["Learner View", "Research View"])

    with learner_tab:
        show_learner_view(profile, gaps, path, skill_map, resources_by_id)

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
        "Preferred difficulty",
        options=[1, 2, 3],
        value=1,
        format_func=lambda value: {1: "Beginner", 2: "Intermediate", 3: "Advanced"}[value],
    )
    preferred_format = st.sidebar.selectbox(
        "Preferred format",
        ["course", "tutorial", "project", "career_track", "video"],
    )

    signature = f"custom:{target_pathway}"
    pathway_skills = {
        skill: weight for skill, weight in skill_map[target_pathway].items() if weight > 0
    }
    if st.session_state.get("active_signature") != signature:
        clear_learning_path_snapshot()
        st.session_state["active_signature"] = signature
        st.session_state["active_skills"] = {skill: 0 for skill in pathway_skills}
        st.session_state["active_completed_topics"] = set()
        st.session_state["completed_resources"] = []
        st.session_state["last_progress_update"] = None
        for skill in pathway_skills:
            st.session_state[skill_slider_key(signature, skill)] = 0

    st.sidebar.markdown("### Current skill levels")
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
        preferred_format=preferred_format,
    )


def infer_weak_skills(
    current_skills: dict[str, int],
    target_pathway: str,
    completed_topics: set[str],
) -> set[str]:
    _, skill_map, _, _ = load_project_data()
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
    completed = ", ".join(sorted(profile.completed_topics)) or "None yet"
    st.caption(f"Completed: {completed}")
    completed_resources = st.session_state.get("completed_resources", [])
    if completed_resources:
        st.caption(f"Completed resources: {len(completed_resources)}")


def show_skill_gaps(
    profile: LearnerProfile,
    gaps: dict[str, float],
    skill_map: dict[str, dict[str, int]],
) -> None:
    st.markdown("#### Priority Skill Gaps")
    gap_rows = [
        {
            "Skill": skill.replace("_", " ").title(),
            "Gap score": round(score, 3),
            "Current": profile.current_skills.get(skill, 0),
            "Target": skill_map[profile.target_pathway].get(skill, 0),
        }
        for skill, score in sorted(gaps.items(), key=lambda item: item[1], reverse=True)
    ]
    if gap_rows:
        st.dataframe(gap_rows[:5], hide_index=True, width="stretch")
    else:
        st.success("No major pathway gaps detected for the current profile.")


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
        "path_locked_by_completion",
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
    st.session_state.pop("path_locked_by_completion", None)


def complete_resource(profile: LearnerProfile, resource: Resource) -> None:
    active_skills = dict(st.session_state.get("active_skills", profile.current_skills))
    completed_topics = set(st.session_state.get("active_completed_topics", profile.completed_topics))
    before_skills = dict(active_skills)
    for skill in resource.skills:
        active_skills[skill] = min(active_skills.get(skill, 0) + 1, 3)
        completed_topics.add(skill)
    completed_topics.add(resource.topic)

    completed_resources = list(st.session_state.get("completed_resources", []))
    if resource.resource_id not in [item["resource_id"] for item in completed_resources]:
        completed_resources.append(
            {
                "resource_id": resource.resource_id,
                "title": resource.title,
                "skills": ", ".join(sorted(resource.skills)),
            }
        )

    skill_changes = {
        skill: (before_skills.get(skill, 0), active_skills.get(skill, 0))
        for skill in sorted(resource.skills)
        if active_skills.get(skill, 0) != before_skills.get(skill, 0)
    }
    st.session_state["active_skills"] = active_skills
    sync_skill_sliders(profile.target_pathway, active_skills)
    st.session_state["active_completed_topics"] = completed_topics
    st.session_state["completed_resources"] = completed_resources
    st.session_state["last_progress_update"] = {
        "title": resource.title,
        "skill_changes": skill_changes,
    }
    st.session_state["path_locked_by_completion"] = True


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
        f"format:{profile.preferred_format}|skills:{skill_signature}|completed:{completed_signature}"
    )


def skill_slider_key(signature: str, skill: str) -> str:
    return f"skill_level_{signature}_{skill}"


def sync_skill_sliders(target_pathway: str, active_skills: dict[str, int]) -> None:
    signature = f"custom:{target_pathway}"
    for skill, level in active_skills.items():
        key = skill_slider_key(signature, skill)
        if key in st.session_state:
            st.session_state[key] = level


def build_learning_path(
    suite: RecommenderSuite,
    profile: LearnerProfile,
    resources_by_id: dict[str, Resource],
    total_k: int,
) -> dict[str, list[Recommendation]]:
    recommendations = suite.recommend(profile, model="hybrid", top_k=total_k, include_broad_tracks=False)
    gaps = suite.skill_gaps(profile)
    stages: dict[str, list[Recommendation]] = {
        "1. Learn just enough": [],
        "2. Start a practical project": project_recommendations_for_profile(
            profile, resources_by_id, gaps, limit=3
        ),
        "3. Deepen later": deepen_recommendations_for_profile(
            profile, resources_by_id, gaps, limit=3
        ),
        "Optional structured tracks": structured_tracks_for_profile(profile, resources_by_id, gaps, limit=3),
    }
    project_ids = {recommendation.resource_id for recommendation in stages["2. Start a practical project"]}
    deepen_ids = {recommendation.resource_id for recommendation in stages["3. Deepen later"]}

    for recommendation in recommendations:
        resource = resources_by_id[recommendation.resource_id]
        if (
            is_broad_track(resource)
            or recommendation.resource_id in project_ids
            or recommendation.resource_id in deepen_ids
        ):
            continue
        matched_gap_strength = max((gaps.get(skill, 0.0) for skill in resource.skills), default=0.0)
        if resource.format == "project":
            stages["2. Start a practical project"].append(recommendation)
        elif matched_gap_strength >= 0.7 or resource.difficulty_level <= profile.preferred_difficulty:
            stages["1. Learn just enough"].append(recommendation)

    return balance_path_stages(stages)


def balance_path_stages(stages: dict[str, list[Recommendation]]) -> dict[str, list[Recommendation]]:
    return {stage: list(recommendations[:4]) for stage, recommendations in stages.items()}


def project_recommendations_for_profile(
    profile: LearnerProfile,
    resources_by_id: dict[str, Resource],
    gaps: dict[str, float],
    limit: int,
) -> list[Recommendation]:
    scored = []
    for resource in resources_by_id.values():
        if resource.format != "project":
            continue
        if is_broad_track(resource) or is_supporting_resource(resource):
            continue
        skill_gap_match = sum(gaps.get(skill, 0.0) for skill in resource.skills)
        pathway_relevance = resource.pathway_relevance.get(profile.target_pathway, 0)
        if pathway_relevance == 0:
            continue
        difficulty_fit = max(0.0, 1 - abs(resource.difficulty_level - profile.preferred_difficulty) / 2)
        prerequisite_fit = project_prerequisite_fit(profile, resource)
        score = skill_gap_match + pathway_relevance + difficulty_fit + prerequisite_fit
        if score > 0:
            scored.append((score, resource))

    scored.sort(key=lambda item: (-item[0], item[1].duration_hours, item[1].title))
    return [
        Recommendation(
            profile_id=profile.profile_id,
            model="project_selector",
            rank=index + 1,
            resource_id=resource.resource_id,
            title=resource.title,
            provider=resource.provider,
            score=round(score, 4),
            explanation="Recommended as an early practical project to reveal gaps and apply current skills.",
        )
        for index, (score, resource) in enumerate(scored[:limit])
    ]


def deepen_recommendations_for_profile(
    profile: LearnerProfile,
    resources_by_id: dict[str, Resource],
    gaps: dict[str, float],
    limit: int,
) -> list[Recommendation]:
    scored = []
    for resource in resources_by_id.values():
        if resource.format in {"project", "career_track"} or is_broad_track(resource) or is_supporting_resource(resource):
            continue
        pathway_relevance = resource.pathway_relevance.get(profile.target_pathway, 0)
        if pathway_relevance == 0:
            continue
        skill_gap_match = sum(gaps.get(skill, 0.0) for skill in resource.skills)
        depth_bonus = 1.0 if resource.difficulty_level > profile.preferred_difficulty else 0.35
        prerequisite_fit = project_prerequisite_fit(profile, resource)
        score = skill_gap_match + pathway_relevance + depth_bonus + prerequisite_fit
        if score > 0:
            scored.append((score, resource))

    scored.sort(key=lambda item: (-item[0], item[1].duration_hours, item[1].title))
    return [
        Recommendation(
            profile_id=profile.profile_id,
            model="deepen_selector",
            rank=index + 1,
            resource_id=resource.resource_id,
            title=resource.title,
            provider=resource.provider,
            score=round(score, 4),
            explanation="Recommended as a later step after initial practice to deepen an important pathway skill.",
        )
        for index, (score, resource) in enumerate(scored[:limit])
    ]


def project_prerequisite_fit(profile: LearnerProfile, resource: Resource) -> float:
    if not resource.prerequisites:
        return 1.0
    met = {
        prerequisite
        for prerequisite in resource.prerequisites
        if prerequisite in profile.completed_topics or profile.current_skills.get(prerequisite, 0) >= 1
    }
    return len(met) / len(resource.prerequisites)


def structured_tracks_for_profile(
    profile: LearnerProfile,
    resources_by_id: dict[str, Resource],
    gaps: dict[str, float],
    limit: int,
) -> list[Recommendation]:
    scored = []
    for resource in resources_by_id.values():
        if not is_broad_track(resource):
            continue
        if is_supporting_resource(resource):
            continue
        if resource.pathway_relevance.get(profile.target_pathway, 0) == 0:
            continue
        skill_gap_match = sum(gaps.get(skill, 0.0) for skill in resource.skills)
        score = resource.pathway_relevance.get(profile.target_pathway, 0) + skill_gap_match
        if score > 0:
            scored.append((score, resource))
    scored.sort(key=lambda item: (-item[0], item[1].duration_hours, item[1].title))
    return [
        Recommendation(
            profile_id=profile.profile_id,
            model="optional_track",
            rank=index + 1,
            resource_id=resource.resource_id,
            title=resource.title,
            provider=resource.provider,
            score=round(score, 4),
            explanation="Optional structured reference; pick useful modules from it rather than completing the whole track.",
        )
        for index, (score, resource) in enumerate(scored[:limit])
    ]


def show_learning_path(
    path: dict[str, list[Recommendation]],
    resources_by_id: dict[str, Resource],
    profile: LearnerProfile,
) -> None:
    for stage, recommendations in path.items():
        with st.expander(stage, expanded=True):
            if not recommendations:
                st.info("No resources assigned to this stage.")
                continue
            for recommendation in recommendations:
                resource = resources_by_id[recommendation.resource_id]
                completed_resource_ids = {
                    item["resource_id"] for item in st.session_state.get("completed_resources", [])
                }
                reset_version = st.session_state.get("progress_reset_version", 0)
                checkbox_key = f"complete_{reset_version}_{stage}_{resource.resource_id}"
                completed = resource.resource_id in completed_resource_ids
                checked = st.checkbox(
                    "Completed",
                    value=completed,
                    key=checkbox_key,
                    disabled=completed,
                    on_change=complete_resource if not completed else None,
                    args=(profile, resource) if not completed else None,
                )
                completed = completed or checked
                title = f"~~{recommendation.title}~~" if completed else recommendation.title
                st.markdown(f"**{title}**")
                st.caption(
                    f"{resource.provider} | {resource.format} | "
                    f"{difficulty_label(resource.difficulty_level)} | {resource.duration_hours:g} hours"
                )
                st.write(shorten_explanation(recommendation.explanation))
                st.divider()


def is_broad_track(resource: Resource) -> bool:
    return resource.format == "career_track" or resource.duration_hours >= 20


def is_supporting_resource(resource: Resource) -> bool:
    return resource.format in {"article", "reading", "youtube", "video_essay", "explainer"}


def show_learner_view(
    profile: LearnerProfile,
    gaps: dict[str, float],
    path: dict[str, list[Recommendation]],
    skill_map: dict[str, dict[str, int]],
    resources_by_id: dict[str, Resource],
) -> None:
    summary_col, action_col = st.columns([1, 1])
    with summary_col:
        show_profile(profile)
    with action_col:
        show_completion_control(profile, path, resources_by_id)

    show_progress_summary(profile, skill_map)

    st.subheader("Your Learning Path")
    st.caption("Learn only the critical basics, then practise early. Deepen later only after useful practice.")
    show_learning_path(path, resources_by_id, profile)

    with st.expander("View skill gaps"):
        show_skill_gaps(profile, gaps, skill_map)


def show_progress_summary(
    profile: LearnerProfile,
    skill_map: dict[str, dict[str, int]],
) -> None:
    st.subheader("Progress")
    last_update = st.session_state.get("last_progress_update")
    if last_update:
        st.success(f"Last completed: {last_update['title']}")
        changes = last_update.get("skill_changes", {})
        if changes:
            change_text = ", ".join(
                f"{skill.replace('_', ' ').title()} {before} > {after}"
                for skill, (before, after) in changes.items()
            )
            st.caption(f"Skill increases: {change_text}")

    completed_resources = st.session_state.get("completed_resources", [])
    if completed_resources:
        with st.expander("Completed resources"):
            for item in completed_resources:
                reset_version = st.session_state.get("progress_reset_version", 0)
                st.checkbox(
                    item["title"],
                    value=True,
                    disabled=True,
                    key=f"done_{reset_version}_{item['resource_id']}",
                )


def show_research_view(
    suite: RecommenderSuite,
    profile: LearnerProfile,
    profiles: list[LearnerProfile],
    relevance: dict[str, set[str]],
    resources: list[Resource],
    skill_map: dict[str, dict[str, int]],
) -> None:
    st.subheader("Recommendation Model Comparison")
    selected_model = st.selectbox(
        "Recommendation model",
        ["hybrid", "content_based", "popularity"],
        help="Compare how different models rank the same learner profile.",
    )
    top_k = st.slider("Number of recommendations", min_value=3, max_value=10, value=TOP_K)
    show_recommendations(suite.recommend(profile, model=selected_model, top_k=top_k))

    metrics = calculate_metrics(suite, profiles, relevance)
    st.dataframe(metrics, hide_index=True, width="stretch")
    st.bar_chart(
        {row["model"]: row["ndcg_at_k"] for row in metrics},
        y_label="NDCG@5",
    )

    with st.expander("Dataset Summary"):
        st.write(f"Learning resources: {len(resources)}")
        st.write(f"Learner profiles: {len(profiles)}")
        st.write(f"Skill map entries: {len(next(iter(skill_map.values())))}")
        st.write(f"Output folder: `{OUTPUT_DIR}`")

    with st.expander("View raw hybrid output"):
        hybrid_output = OUTPUT_DIR / "recommendations_hybrid.csv"
        if hybrid_output.exists():
            st.dataframe(read_csv_rows(hybrid_output), hide_index=True, width="stretch")
        else:
            st.info("Run `src/run_pipeline.py` to generate output CSV files.")


def difficulty_label(level: int) -> str:
    return {1: "Beginner", 2: "Intermediate", 3: "Advanced"}.get(level, str(level))


def shorten_explanation(explanation: str) -> str:
    explanation = explanation.replace("Recommended because ", "")
    explanation = explanation.rstrip(".")
    parts = [part.strip() for part in explanation.split(";") if part.strip()]
    if not parts:
        return explanation
    return "Why: " + "; ".join(parts[:2]) + "."


def show_recommendations(recommendations: list[Recommendation]) -> None:
    recommendation_rows = [
        {
            "Rank": recommendation.rank,
            "Resource": recommendation.title,
            "Provider": recommendation.provider,
            "Score": recommendation.score,
            "Explanation": recommendation.explanation,
        }
        for recommendation in recommendations
    ]
    st.dataframe(recommendation_rows, hide_index=True, width="stretch")


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
