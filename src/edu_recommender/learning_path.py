from __future__ import annotations

from edu_recommender.data import LearnerProfile, Resource, ResourceModule
from edu_recommender.models import Recommendation, RecommenderSuite
from edu_recommender.ui_helpers import display_skill, display_skill_list


def stage_skill_cap(stage: str | None) -> int | None:
    if not stage:
        return None
    if stage.startswith("1."):
        return 1
    if stage.startswith("2."):
        return 2
    if stage.startswith("3."):
        return 3
    if stage.startswith("Optional"):
        return 2
    return None


def skill_completion_cap(
    stage: str | None,
    current_level: int,
    skill: str,
    skill_targets: dict[str, int] | None = None,
) -> int:
    target_level = (skill_targets or {}).get(skill, 3)
    if target_level <= 0:
        return current_level
    stage_cap = stage_skill_cap(stage)
    if stage_cap is None:
        return target_level
    return min(target_level, max(stage_cap, current_level + 1))


def completion_readiness(stage: str, current_skills: dict[str, int], item_skills: set[str]) -> tuple[bool, str]:
    levels = [current_skills.get(skill, 0) for skill in item_skills]
    if stage.startswith("1."):
        return True, ""
    if stage.startswith("2."):
        if any(level >= 1 for level in levels):
            return True, ""
        return False, unlock_message(stage, current_skills, item_skills)
    if stage.startswith("3."):
        if any(level >= 2 for level in levels):
            return True, ""
        return False, unlock_message(stage, current_skills, item_skills)
    if stage.startswith("Optional"):
        if any(level >= 1 for level in levels):
            return True, ""
        return False, unlock_message(stage, current_skills, item_skills)
    return True, ""


def unlock_message(stage: str, current_skills: dict[str, int], item_skills: set[str]) -> str:
    if stage.startswith("3."):
        needed_level = 2
        course_type = "practice"
    else:
        needed_level = 1
        course_type = "foundation"
    needed_skills = [
        skill for skill in sorted(item_skills)
        if current_skills.get(skill, 0) < needed_level
    ]
    if not needed_skills:
        return "Unlock requirement: complete more foundation courses first."
    skill_text = unlock_skill_text(needed_skills[:2])
    if len(needed_skills) > 2:
        skill_text = f"{skill_text} or a related skill"
    return f"Unlock requirement: complete a {skill_text} {course_type} course first."


def unlock_skill_text(skills: list[str]) -> str:
    labels = [display_skill(skill) for skill in skills]
    if len(labels) == 1:
        return labels[0]
    return " or ".join(labels)


def can_improve_in_stage(stage: str, current_skills: dict[str, int], item_skills: set[str]) -> bool:
    max_level = stage_skill_cap(stage)
    if max_level is None:
        return True
    return any(current_skills.get(skill, 0) < max_level for skill in item_skills)


def can_gain_tracked_skill(
    stage: str,
    current_skills: dict[str, int],
    item_skills: set[str],
    skill_targets: dict[str, int],
) -> bool:
    return any(
        current_skills.get(skill, 0)
        < skill_completion_cap(stage, current_skills.get(skill, 0), skill, skill_targets)
        for skill in item_skills
    )


def modules_by_parent_resource(modules: list[ResourceModule]) -> dict[str, list[ResourceModule]]:
    grouped: dict[str, list[ResourceModule]] = {}
    for module in modules:
        grouped.setdefault(module.parent_resource_id, []).append(module)
    return grouped


def selected_module_for_resource(
    profile: LearnerProfile,
    resource: Resource,
    modules: list[ResourceModule],
    gaps: dict[str, float],
) -> ResourceModule | None:
    if resource.format == "project":
        return None
    candidates = []
    for module in modules:
        matched_gap_score = sum(gaps.get(skill, 0.0) for skill in module.skills)
        if matched_gap_score <= 0:
            continue
        difficulty_fit = max(0.0, 1 - abs(module.difficulty_level - profile.preferred_difficulty) / 2)
        score = matched_gap_score + difficulty_fit
        candidates.append((score, module))
    if not candidates:
        return None
    candidates.sort(key=lambda item: (-item[0], item[1].duration_hours, item[1].module_title))
    return candidates[0][1]


def resource_item_source(resource: Resource, module: ResourceModule | None) -> str:
    if module and module.source_url and module.date_checked:
        return f"From: {module.provider} - {resource.title}"
    if getattr(resource, "source_url", "") and getattr(resource, "date_checked", ""):
        return f"From: {resource.provider}"
    return ""


def learning_item_reason(stage: str, item_skills: set[str]) -> str:
    skills = display_skill_list(sorted(item_skills)[:3])
    if not skills:
        return ""
    if stage.startswith("2."):
        return f"Why: Practise {skills}."
    if stage.startswith("3."):
        return f"Why: Deepen {skills}."
    if stage.startswith("Optional"):
        return f"Why: Optional reinforcement for {skills}."
    return f"Why: Targets {skills}."


def module_style_resource_title(resource: Resource) -> str:
    if resource.format != "module":
        return resource.title
    prefix = f"{resource.provider} Module "
    if resource.title.startswith(prefix):
        return resource.title.removeprefix(prefix)
    return resource.title.replace(" Module ", " ", 1)


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
            explanation=f"Practise {display_skill_list(sorted(resource.skills)[:3])}.",
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
            explanation=f"Deepen {display_skill_list(sorted(resource.skills)[:3])}.",
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
            explanation=f"Optional reinforcement for {display_skill_list(sorted(resource.skills)[:3])}.",
        )
        for index, (score, resource) in enumerate(scored[:limit])
    ]


def is_broad_track(resource: Resource) -> bool:
    return resource.format == "career_track" or resource.duration_hours >= 20


def is_supporting_resource(resource: Resource) -> bool:
    return resource.format in {"article", "reading", "youtube", "video_essay", "explainer"}


