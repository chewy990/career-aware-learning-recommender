from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Resource:
    resource_id: str
    title: str
    provider: str
    topic: str
    skills: set[str]
    difficulty_level: int
    duration_hours: float
    format: str
    prerequisites: set[str]
    cost: str
    popularity_score: float
    quality_score: float
    pathway_relevance: dict[str, int]
    description: str
    source_url: str = ""
    date_checked: str = ""


@dataclass(frozen=True)
class ResourceModule:
    module_id: str
    parent_resource_id: str
    module_title: str
    provider: str
    skills: set[str]
    difficulty_level: int
    duration_hours: float
    source_url: str
    date_checked: str


@dataclass(frozen=True)
class LearnerProfile:
    profile_id: str
    name: str
    target_pathway: str
    current_skills: dict[str, int]
    completed_topics: set[str]
    weak_skills: set[str]
    preferred_difficulty: int
    max_duration_hours: float
    preferred_format: str


def read_resources(path: Path) -> list[Resource]:
    rows = _read_csv(path)
    resources: list[Resource] = []
    for row in rows:
        resources.append(
            Resource(
                resource_id=row["resource_id"],
                title=row["title"],
                provider=row["provider"],
                topic=row["topic"],
                skills=_parse_set(row["skills"]),
                difficulty_level=int(row["difficulty_level"]),
                duration_hours=float(row["duration_hours"]),
                format=row["format"],
                prerequisites=_parse_set(row["prerequisites"]),
                cost=row["cost"],
                popularity_score=float(row["popularity_score"]),
                quality_score=float(row["quality_score"]),
                pathway_relevance={
                    "data_analyst": int(row["data_analyst_relevance"]),
                    "ml_engineer": int(row["ml_engineer_relevance"]),
                    "software_developer": int(row["software_developer_relevance"]),
                },
                description=row["description"],
                source_url=row.get("source_url", "").strip(),
                date_checked=row.get("date_checked", "").strip(),
            )
        )
    return resources


def read_resource_modules(path: Path) -> list[ResourceModule]:
    if not path.exists():
        return []
    rows = _read_csv(path)
    return [
        ResourceModule(
            module_id=row["module_id"],
            parent_resource_id=row["parent_resource_id"],
            module_title=row["module_title"],
            provider=row["provider"],
            skills=_parse_set(row["skills"]),
            difficulty_level=int(row["difficulty_level"]),
            duration_hours=float(row["duration_hours"]),
            source_url=row["source_url"],
            date_checked=row["date_checked"],
        )
        for row in rows
    ]


def read_skill_map(path: Path) -> dict[str, dict[str, int]]:
    rows = _read_csv(path)
    skill_map: dict[str, dict[str, int]] = {
        "data_analyst": {},
        "ml_engineer": {},
        "software_developer": {},
    }
    for row in rows:
        skill = row["skill"]
        for pathway in skill_map:
            skill_map[pathway][skill] = int(row[pathway])
    return skill_map


def read_profiles(path: Path) -> list[LearnerProfile]:
    rows = _read_csv(path)
    return [
        LearnerProfile(
            profile_id=row["profile_id"],
            name=row["name"],
            target_pathway=row["target_pathway"],
            current_skills=_parse_skill_levels(row["current_skills"]),
            completed_topics=_parse_set(row["completed_topics"]),
            weak_skills=_parse_set(row["weak_skills"]),
            preferred_difficulty=int(row["preferred_difficulty"]),
            max_duration_hours=float(row["max_duration_hours"]),
            preferred_format=row["preferred_format"],
        )
        for row in rows
    ]


def read_relevance_judgements(path: Path) -> dict[str, set[str]]:
    rows = _read_csv(path)
    return {row["profile_id"]: _parse_set(row["relevant_resource_ids"]) for row in rows}


def write_rows(path: Path, fieldnames: list[str], rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def _parse_set(value: str) -> set[str]:
    if not value.strip():
        return set()
    return {item.strip() for item in value.split(";") if item.strip()}


def _parse_skill_levels(value: str) -> dict[str, int]:
    if not value.strip():
        return {}
    levels: dict[str, int] = {}
    for item in value.split(";"):
        if not item.strip():
            continue
        skill, level = item.split(":", maxsplit=1)
        levels[skill.strip()] = int(level)
    return levels
