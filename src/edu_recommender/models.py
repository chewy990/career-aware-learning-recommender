from __future__ import annotations

from dataclasses import dataclass

from edu_recommender.data import LearnerProfile, Resource
from edu_recommender.text import TfidfVectorizer, cosine_similarity


@dataclass(frozen=True)
class Recommendation:
    profile_id: str
    model: str
    rank: int
    resource_id: str
    title: str
    provider: str
    score: float
    explanation: str


class RecommenderSuite:
    def __init__(self, resources: list[Resource], skill_map: dict[str, dict[str, int]]) -> None:
        self.resources = resources
        self.skill_map = skill_map
        self.vectorizer = TfidfVectorizer()
        self.resource_documents = {resource.resource_id: _resource_document(resource) for resource in resources}
        self.vectorizer.fit(list(self.resource_documents.values()))
        self.resource_vectors = {
            resource_id: self.vectorizer.transform(document)
            for resource_id, document in self.resource_documents.items()
        }

    def recommend(
        self,
        profile: LearnerProfile,
        model: str,
        top_k: int = 5,
        include_broad_tracks: bool = False,
    ) -> list[Recommendation]:
        scored = []
        learner_document = _profile_document(profile, self.skill_gaps(profile))
        learner_vector = self.vectorizer.transform(learner_document)

        for resource in self.resources:
            if not include_broad_tracks and _is_broad_track(resource):
                continue
            if _is_supporting_resource(resource):
                continue
            content_similarity = cosine_similarity(learner_vector, self.resource_vectors[resource.resource_id])
            if model == "popularity":
                score = self._popularity_score(resource)
                explanation = "Recommended because this resource has strong general quality and popularity signals."
            elif model == "content_based":
                score = content_similarity
                explanation = self._content_explanation(profile, resource)
            elif model == "hybrid":
                components = self._hybrid_components(profile, resource, content_similarity)
                score = sum(components.values())
                explanation = self._hybrid_explanation(profile, resource, components)
            else:
                raise ValueError(f"Unknown recommender model: {model}")
            scored.append((score, resource, explanation))

        scored.sort(key=lambda item: (-item[0], item[1].title))
        return [
            Recommendation(
                profile_id=profile.profile_id,
                model=model,
                rank=index + 1,
                resource_id=resource.resource_id,
                title=resource.title,
                provider=resource.provider,
                score=round(score, 4),
                explanation=explanation,
            )
            for index, (score, resource, explanation) in enumerate(scored[:top_k])
        ]

    def skill_gaps(self, profile: LearnerProfile) -> dict[str, float]:
        pathway_requirements = self.skill_map[profile.target_pathway]
        gaps: dict[str, float] = {}
        for skill, required_level in pathway_requirements.items():
            current_level = profile.current_skills.get(skill, 0)
            gap = max(required_level - current_level, 0)
            if skill in profile.weak_skills:
                gap += 0.5
            if gap > 0:
                gaps[skill] = min(gap / 3.5, 1.0)
        return gaps

    def _popularity_score(self, resource: Resource) -> float:
        return 0.65 * resource.quality_score + 0.35 * resource.popularity_score

    def _hybrid_components(
        self,
        profile: LearnerProfile,
        resource: Resource,
        content_similarity: float,
    ) -> dict[str, float]:
        gaps = self.skill_gaps(profile)
        career_relevance = resource.pathway_relevance[profile.target_pathway] / 3
        skill_gap_match = _weighted_overlap(resource.skills, gaps)
        job_skill_alignment = _job_skill_alignment(resource.skills, self.skill_map[profile.target_pathway])
        difficulty_match = max(0.0, 1 - abs(resource.difficulty_level - profile.preferred_difficulty) / 2)
        prerequisite_match = _prerequisite_match(profile, resource)
        resource_quality = self._popularity_score(resource)
        scope_fit = _scope_fit(resource)

        return {
            "career_relevance": 0.25 * career_relevance,
            "skill_gap_match": 0.25 * skill_gap_match,
            "job_skill_alignment": 0.15 * job_skill_alignment,
            "difficulty_match": 0.10 * difficulty_match,
            "prerequisite_match": 0.10 * prerequisite_match,
            "resource_quality": 0.10 * resource_quality,
            "content_similarity": 0.05 * content_similarity,
            "scope_fit": -0.12 * (1 - scope_fit),
        }

    def _content_explanation(self, profile: LearnerProfile, resource: Resource) -> str:
        matching_skills = sorted(resource.skills & (profile.weak_skills | set(profile.current_skills)))
        if matching_skills:
            return f"Recommended because its metadata matches learner needs around {', '.join(matching_skills)}."
        return "Recommended because its title, topic, skills, and description are similar to the learner profile."

    def _hybrid_explanation(
        self,
        profile: LearnerProfile,
        resource: Resource,
        components: dict[str, float],
    ) -> str:
        gaps = self.skill_gaps(profile)
        matched_gaps = sorted(resource.skills & set(gaps), key=lambda skill: gaps[skill], reverse=True)
        reasons: list[str] = []

        if resource.pathway_relevance[profile.target_pathway] >= 2:
            reasons.append(f"it is relevant to the {profile.target_pathway.replace('_', ' ')} pathway")
        if matched_gaps:
            reasons.append(f"it targets skill gaps in {', '.join(matched_gaps[:3])}")
        if resource.format == "career_track" or resource.duration_hours >= 20:
            reasons.append("it is broad and should be treated as an optional structured track rather than a first step")
        if components["difficulty_match"] >= 0.075:
            reasons.append("its difficulty matches the learner's current level")
        if components["prerequisite_match"] >= 0.075:
            reasons.append("the learner appears to meet the prerequisites")

        if not reasons:
            reasons.append("it has useful resource metadata and quality signals")
        return "Recommended because " + "; ".join(reasons) + "."


def _profile_document(profile: LearnerProfile, gaps: dict[str, float]) -> str:
    gap_text = " ".join(skill for skill, score in gaps.items() for _ in range(max(1, round(score * 3))))
    return " ".join(
        [
            profile.target_pathway.replace("_", " "),
            " ".join(profile.current_skills),
            " ".join(profile.completed_topics),
            " ".join(profile.weak_skills),
            gap_text,
            profile.preferred_format,
        ]
    )


def _resource_document(resource: Resource) -> str:
    return " ".join(
        [
            resource.title,
            resource.provider,
            resource.topic,
            " ".join(resource.skills),
            " ".join(resource.prerequisites),
            resource.format,
            resource.description,
        ]
    )


def _weighted_overlap(resource_skills: set[str], gaps: dict[str, float]) -> float:
    if not gaps:
        return 0.0
    matched_gap_weight = sum(gaps[skill] for skill in resource_skills if skill in gaps)
    total_gap_weight = sum(gaps.values())
    return min(matched_gap_weight / total_gap_weight, 1.0)


def _job_skill_alignment(resource_skills: set[str], pathway_requirements: dict[str, int]) -> float:
    important_skills = {skill for skill, weight in pathway_requirements.items() if weight >= 2}
    if not important_skills:
        return 0.0
    return len(resource_skills & important_skills) / len(important_skills)


def _prerequisite_match(profile: LearnerProfile, resource: Resource) -> float:
    if not resource.prerequisites:
        return 1.0
    met_prerequisites = {
        skill
        for skill in resource.prerequisites
        if skill in profile.completed_topics or profile.current_skills.get(skill, 0) >= 1
    }
    return len(met_prerequisites) / len(resource.prerequisites)


def _scope_fit(resource: Resource) -> float:
    if resource.format == "career_track":
        return 0.25
    if resource.duration_hours >= 30:
        return 0.30
    if resource.duration_hours >= 20:
        return 0.45
    if resource.duration_hours >= 12:
        return 0.70
    return 1.0


def _is_broad_track(resource: Resource) -> bool:
    return resource.format == "career_track" or resource.duration_hours >= 20


def _is_supporting_resource(resource: Resource) -> bool:
    return resource.format in {"article", "reading", "youtube", "video_essay", "explainer"}
