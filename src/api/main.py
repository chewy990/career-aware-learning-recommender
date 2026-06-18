from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from edu_recommender.data import (  # noqa: E402
    LearnerProfile,
    Resource,
    ResourceModule,
    read_profiles,
    read_resource_modules,
    read_resources,
    read_skill_map,
)
from edu_recommender.learning_path import (  # noqa: E402
    build_learning_path,
    can_improve_in_stage,
    completion_readiness,
    learning_item_reason,
    module_style_resource_title,
    modules_by_parent_resource,
    resource_item_source,
    selected_module_for_resource,
    skill_completion_cap,
)
from edu_recommender.models import RecommenderSuite  # noqa: E402

DATA_DIR = ROOT / "data"
TOP_K = 12


class LearningPathRequest(BaseModel):
    target_pathway: str
    current_skills: dict[str, int] = Field(default_factory=dict)
    completed_topics: list[str] = Field(default_factory=list)
    completed_item_ids: list[str] = Field(default_factory=list)
    preferred_difficulty: int = 1
    max_duration_hours: float = 10
    preferred_format: str = "course"
    profile_id: str = "custom"
    name: str = "Custom learner"


class CompleteItemRequest(BaseModel):
    stage: str | None = None
    current_skills: dict[str, int] = Field(default_factory=dict)
    completed_topics: list[str] = Field(default_factory=list)
    topic: str = ""
    skills: list[str] = Field(default_factory=list)
    skill_targets: dict[str, int] = Field(default_factory=dict)


class ResearchRequest(BaseModel):
    profile_id: str
    model: str = "hybrid"
    top_k: int = 5


app = FastAPI(title="Career-Aware Learning Recommender API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def project_data() -> tuple[
    list[Resource],
    list[ResourceModule],
    dict[str, dict[str, int]],
    list[LearnerProfile],
    RecommenderSuite,
]:
    resources = read_resources(DATA_DIR / "resources.csv")
    modules = read_resource_modules(DATA_DIR / "resource_modules.csv")
    skill_map = read_skill_map(DATA_DIR / "skill_map.csv")
    profiles = read_profiles(DATA_DIR / "learner_profiles.csv")
    suite = RecommenderSuite(resources, skill_map)
    return resources, modules, skill_map, profiles, suite


def display_pathway(pathway: str) -> str:
    return pathway.replace("_", " ").title().replace("Ml", "ML")


def display_skill(skill: str) -> str:
    special = {
        "sql": "SQL",
        "apis": "APIs",
        "oop": "OOP",
        "ml": "ML",
    }
    return special.get(skill, skill.replace("_", " ").replace("/", "/").title())


def difficulty_label(level: int) -> str:
    return {1: "Beginner", 2: "Intermediate", 3: "Advanced"}.get(level, "Mixed")


def skill_level_label(level: int) -> str:
    return {0: "Not started", 1: "Basic", 2: "Working knowledge", 3: "Confident"}.get(int(level), "Not started")


def provider_search_url(provider: str, title: str) -> str:
    query = quote_plus(title)
    provider_query = quote_plus(f"{provider} {title}")
    provider_key = provider.strip().lower()
    search_urls = {
        "datacamp": f"https://www.datacamp.com/search?q={query}",
        "coursera": f"https://www.coursera.org/search?query={query}",
        "youtube": f"https://www.youtube.com/results?search_query={provider_query}",
        "edx": f"https://www.edx.org/search?q={query}",
        "freecodecamp": f"https://www.freecodecamp.org/search?query={query}",
        "kaggle learn": "https://www.kaggle.com/learn",
        "udemy": f"https://www.udemy.com/courses/search/?q={query}",
        "ibm skillsbuild": f"https://skillsbuild.org/search?query={query}",
        "khan academy": f"https://www.khanacademy.org/search?page_search_query={query}",
        "udacity": f"https://www.udacity.com/catalog?search={query}",
        "atlassian": f"https://www.atlassian.com/search?query={query}",
        "storytelling with data": "https://www.storytellingwithdata.com/",
        "google cloud": f"https://cloud.google.com/s/results?q={query}",
    }
    return search_urls.get(provider_key, f"https://www.google.com/search?q={provider_query}")


def source_url_for_item(resource: Resource, module: ResourceModule | None) -> str:
    if module and module.source_url:
        return module.source_url
    if resource.source_url:
        return resource.source_url
    return provider_search_url(resource.provider, resource.title)


def make_profile(payload: LearningPathRequest, skill_map: dict[str, dict[str, int]]) -> LearnerProfile:
    if payload.target_pathway not in skill_map:
        raise HTTPException(status_code=404, detail="Unknown pathway")
    targets = skill_map[payload.target_pathway]
    skills = {skill: int(payload.current_skills.get(skill, 0)) for skill in targets}
    for skill, level in payload.current_skills.items():
        skills.setdefault(skill, int(level))
    completed_topics = set(payload.completed_topics)
    weak_skills = {
        skill
        for skill, target in targets.items()
        if target > 0 and skills.get(skill, 0) < target
    }
    return LearnerProfile(
        profile_id=payload.profile_id,
        name=payload.name,
        target_pathway=payload.target_pathway,
        current_skills=skills,
        completed_topics=completed_topics,
        weak_skills=weak_skills,
        preferred_difficulty=payload.preferred_difficulty,
        max_duration_hours=payload.max_duration_hours,
        preferred_format=payload.preferred_format,
    )


def item_payload(
    profile: LearnerProfile,
    stage: str,
    resource: Resource,
    module: ResourceModule | None,
    gaps: dict[str, float],
    completed_item_ids: set[str],
    skill_targets: dict[str, int],
) -> dict[str, object]:
    item_id = f"module:{module.module_id}" if module else f"resource:{resource.resource_id}"
    item_title = module.module_title if module else module_style_resource_title(resource)
    item_skills = module.skills if module else resource.skills
    item_difficulty = module.difficulty_level if module else resource.difficulty_level
    item_duration = module.duration_hours if module else resource.duration_hours
    completed = item_id in completed_item_ids
    ready, locked_reason = completion_readiness(stage, profile.current_skills, item_skills)
    skill_changes = []
    for skill in sorted(item_skills):
        before = profile.current_skills.get(skill, 0)
        after_cap = skill_completion_cap(stage, before, skill, skill_targets)
        after = min(before + 1, after_cap) if before < after_cap else before
        if after != before:
            skill_changes.append({
                "skill": skill,
                "label": display_skill(skill),
                "before": before,
                "after": after,
                "before_label": skill_level_label(before),
                "after_label": skill_level_label(after),
            })
    return {
        "item_id": item_id,
        "resource_id": resource.resource_id,
        "title": item_title,
        "provider": resource.provider,
        "topic": resource.topic,
        "skills": sorted(item_skills),
        "skill_labels": [display_skill(skill) for skill in sorted(item_skills)],
        "difficulty_level": item_difficulty,
        "difficulty_label": difficulty_label(item_difficulty),
        "duration_hours": item_duration,
        "format": resource.format,
        "source": resource_item_source(resource, module),
        "source_url": source_url_for_item(resource, module),
        "reason": learning_item_reason(stage, item_skills),
        "completed": completed,
        "ready": ready or completed,
        "locked_reason": "" if ready or completed else locked_reason,
        "skill_changes": skill_changes,
        "can_improve": can_improve_in_stage(stage, profile.current_skills, item_skills),
    }


def visible_stage_items(
    profile: LearnerProfile,
    path: dict[str, list],
    resources_by_id: dict[str, Resource],
    modules_by_parent: dict[str, list[ResourceModule]],
    gaps: dict[str, float],
    completed_item_ids: set[str],
    skill_targets: dict[str, int],
) -> list[dict[str, object]]:
    items = []
    for stage, recommendations in path.items():
        for recommendation in recommendations:
            resource = resources_by_id[recommendation.resource_id]
            module = selected_module_for_resource(
                profile,
                resource,
                modules_by_parent.get(resource.resource_id, []),
                gaps,
            )
            payload = item_payload(profile, stage, resource, module, gaps, completed_item_ids, skill_targets)
            if payload["completed"] or payload["can_improve"]:
                items.append(payload)
    return items


def mastery_complete(
    visible_items: list[dict[str, object]],
    gaps: dict[str, float],
) -> bool:
    actionable = [item for item in visible_items if item["can_improve"]]
    return bool(actionable) and all(item["completed"] for item in actionable) and not gaps


def data_scientist_suggestion(
    profile: LearnerProfile,
    path: dict[str, list],
    resources_by_id: dict[str, Resource],
    modules_by_parent: dict[str, list[ResourceModule]],
    gaps: dict[str, float],
    completed_item_ids: set[str],
    skill_targets: dict[str, int],
) -> bool:
    if profile.target_pathway != "data_analyst":
        return False
    required = {"sql": 2, "statistics": 2, "data_cleaning": 2, "data_visualisation": 2, "python": 1}
    if any(profile.current_skills.get(skill, 0) < level for skill, level in required.items()):
        return False
    stage = "2. Start a practical project"
    visible_ids = set()
    for recommendation in path.get(stage, []):
        resource = resources_by_id[recommendation.resource_id]
        module = selected_module_for_resource(
            profile,
            resource,
            modules_by_parent.get(resource.resource_id, []),
            gaps,
        )
        payload = item_payload(profile, stage, resource, module, gaps, completed_item_ids, skill_targets)
        if payload["can_improve"]:
            visible_ids.add(str(payload["item_id"]))
    return bool(visible_ids) and visible_ids.issubset(completed_item_ids)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/pathways")
def pathways() -> dict[str, object]:
    _, _, skill_map, _, _ = project_data()
    all_skills = sorted({skill for targets in skill_map.values() for skill, level in targets.items() if level > 0})
    return {
        "pathways": [
            {
                "id": pathway,
                "label": display_pathway(pathway),
                "skills": [
                    {"id": skill, "label": display_skill(skill), "target": level}
                    for skill, level in targets.items()
                    if level > 0
                ],
            }
            for pathway, targets in skill_map.items()
        ],
        "skills": [{"id": skill, "label": display_skill(skill)} for skill in all_skills],
    }


@app.get("/api/profiles")
def profiles() -> dict[str, object]:
    _, _, _, profile_rows, _ = project_data()
    return {
        "profiles": [
            {
                "profile_id": profile.profile_id,
                "name": profile.name,
                "target_pathway": profile.target_pathway,
                "target_pathway_label": display_pathway(profile.target_pathway),
                "current_skills": profile.current_skills,
                "completed_topics": sorted(profile.completed_topics),
                "weak_skills": sorted(profile.weak_skills),
                "preferred_difficulty": profile.preferred_difficulty,
                "max_duration_hours": profile.max_duration_hours,
                "preferred_format": profile.preferred_format,
            }
            for profile in profile_rows
        ]
    }


@app.post("/api/learning-path")
def learning_path(payload: LearningPathRequest) -> dict[str, object]:
    resources, modules, skill_map, _, suite = project_data()
    resources_by_id = {resource.resource_id: resource for resource in resources}
    modules_by_parent = modules_by_parent_resource(modules)
    profile = make_profile(payload, skill_map)
    gaps = suite.skill_gaps(profile)
    path = build_learning_path(suite, profile, resources_by_id, total_k=TOP_K)
    completed_item_ids = set(payload.completed_item_ids)
    skill_targets = skill_map[profile.target_pathway]

    stages = []
    for stage, recommendations in path.items():
        stage_items = []
        for recommendation in recommendations:
            resource = resources_by_id[recommendation.resource_id]
            module = selected_module_for_resource(
                profile,
                resource,
                modules_by_parent.get(resource.resource_id, []),
                gaps,
            )
            item = item_payload(profile, stage, resource, module, gaps, completed_item_ids, skill_targets)
            if item["completed"] or item["can_improve"]:
                stage_items.append(item)
        stages.append({"name": stage, "items": stage_items})

    visible_items = [item for stage in stages for item in stage["items"]]
    return {
        "profile": {
            "profile_id": profile.profile_id,
            "name": profile.name,
            "target_pathway": profile.target_pathway,
            "target_pathway_label": display_pathway(profile.target_pathway),
            "current_skills": profile.current_skills,
            "completed_topics": sorted(profile.completed_topics),
            "preferred_difficulty": profile.preferred_difficulty,
            "preferred_format": profile.preferred_format,
        },
        "skill_gaps": [
            {
                "skill": skill,
                "label": display_skill(skill),
                "current": profile.current_skills.get(skill, 0),
                "target": skill_targets.get(skill, 0),
                "current_label": skill_level_label(profile.current_skills.get(skill, 0)),
                "target_label": skill_level_label(skill_targets.get(skill, 0)),
                "priority": "High" if score >= 0.75 else "Medium" if score >= 0.4 else "Low",
            }
            for skill, score in sorted(gaps.items(), key=lambda item: (-item[1], item[0]))
        ],
        "stages": stages,
        "mastery": mastery_complete(visible_items, gaps),
        "data_scientist_suggestion": data_scientist_suggestion(
            profile, path, resources_by_id, modules_by_parent, gaps, completed_item_ids, skill_targets
        ),
    }


@app.post("/api/complete-item")
def complete_item(payload: CompleteItemRequest) -> dict[str, object]:
    active_skills = dict(payload.current_skills)
    completed_topics = set(payload.completed_topics)
    before = dict(active_skills)
    for skill in payload.skills:
        current = active_skills.get(skill, 0)
        cap = skill_completion_cap(payload.stage, current, skill, payload.skill_targets)
        if current < cap:
            active_skills[skill] = min(current + 1, cap)
        completed_topics.add(skill)
    if payload.topic:
        completed_topics.add(payload.topic)
    changes = [
        {
            "skill": skill,
            "label": display_skill(skill),
            "before": before.get(skill, 0),
            "after": active_skills.get(skill, 0),
            "before_label": skill_level_label(before.get(skill, 0)),
            "after_label": skill_level_label(active_skills.get(skill, 0)),
        }
        for skill in sorted(payload.skills)
        if before.get(skill, 0) != active_skills.get(skill, 0)
    ]
    return {"current_skills": active_skills, "completed_topics": sorted(completed_topics), "skill_changes": changes}


@app.post("/api/research/recommendations")
def research_recommendations(payload: ResearchRequest) -> dict[str, object]:
    _, _, _, profiles_rows, suite = project_data()
    profile = next((row for row in profiles_rows if row.profile_id == payload.profile_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail="Unknown profile")
    recommendations = suite.recommend(profile, payload.model, top_k=payload.top_k, include_broad_tracks=True)
    return {
        "recommendations": [
            {
                "rank": item.rank,
                "resource_id": item.resource_id,
                "title": item.title,
                "provider": item.provider,
                "score": item.score,
                "explanation": item.explanation,
            }
            for item in recommendations
        ]
    }
