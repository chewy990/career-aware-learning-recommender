const STORAGE_KEY = "career-aware-recommender-session-v1";
const AUTH_STORAGE_KEY = "career-aware-recommender-auth-v1";

export const SKILL_LEVELS = [
  { value: 0, label: "Not started" },
  { value: 1, label: "Basic" },
  { value: 2, label: "Working knowledge" },
  { value: 3, label: "Confident" },
];

const CORE_SKILL_IDS_BY_PATHWAY = {
  data_analyst: ["python", "sql", "statistics", "data_cleaning", "data_visualisation"],
  data_scientist: ["python", "statistics", "data_cleaning", "machine_learning", "model_evaluation"],
  data_engineer: ["python", "sql", "data_cleaning", "databases", "deployment"],
  ml_engineer: ["python", "machine_learning", "model_evaluation", "deployment", "programming"],
  software_developer: ["programming", "apis", "databases", "testing", "version_control"],
};

export function skillLevelLabel(level) {
  return SKILL_LEVELS.find((item) => item.value === Number(level))?.label || "Not started";
}

function knownSkillLevel(skills, skillId) {
  return Number(skills?.[skillId] || 0);
}

export function isKnownSkill(skills, skillId) {
  return knownSkillLevel(skills, skillId) > 0;
}

export function coreSkillsForPathway(pathway) {
  if (!pathway) return [];
  const coreIds = CORE_SKILL_IDS_BY_PATHWAY[pathway.id] || pathway.skills.slice(0, 5).map((skill) => skill.id);
  const pathwaySkills = new Map(pathway.skills.map((skill) => [skill.id, skill]));
  return coreIds.map((skillId) => pathwaySkills.get(skillId)).filter(Boolean);
}

function stageRequirement(stageName) {
  if (stageName.startsWith("3.")) return 2;
  if (stageName.startsWith("2.") || stageName.startsWith("Optional")) return 1;
  return 0;
}

function stageCourseType(stageName) {
  return stageName.startsWith("3.") ? "practice" : "foundation";
}

export function itemReadiness(stageName, skills, itemSkills = []) {
  const requiredLevel = stageRequirement(stageName);
  if (requiredLevel === 0) return { ready: true, lockedReason: "" };
  if (itemSkills.some((skill) => Number(skills[skill] || 0) >= requiredLevel)) {
    return { ready: true, lockedReason: "" };
  }
  const needed = itemSkills.filter((skill) => Number(skills[skill] || 0) < requiredLevel);
  const labels = needed.slice(0, 2).map((skill) => skill.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()));
  const skillText = labels.length > 1 ? labels.join(" or ") : labels[0] || "related skill";
  const suffix = needed.length > 2 ? " or a related skill" : "";
  return {
    ready: false,
    lockedReason: `Unlock requirement: complete a ${skillText}${suffix} ${stageCourseType(stageName)} course first.`,
  };
}

export const emptySession = {
  skills: {},
  completedTopics: [],
  completedItemIds: [],
  completedItems: [],
  pathSnapshots: {},
  selectedPathways: [],
  activePathway: "",
  selectedPathway: "",
  preferredDifficulty: 1,
  preferredFormat: "course",
};

export function snapshotKeyFor(session, pathwayId) {
  return `${pathwayId}|${session.preferredDifficulty}|${session.preferredFormat}`;
}

function normaliseSession(savedSession) {
  const merged = { ...emptySession, ...(savedSession || {}) };
  const legacyPathway = merged.activePathway || merged.selectedPathway || "";
  const selectedPathways = Array.isArray(merged.selectedPathways) && merged.selectedPathways.length > 0
    ? merged.selectedPathways
    : legacyPathway
      ? [legacyPathway]
      : [];
  return {
    ...merged,
    selectedPathways,
    activePathway: merged.activePathway || legacyPathway,
  };
}

export function syncCompletedFlags(pathData, completedItemIds) {
  if (!pathData) return pathData;
  const completed = new Set(completedItemIds || []);
  return {
    ...pathData,
    stages: (pathData.stages || []).map((stage) => ({
      ...stage,
      items: (stage.items || []).map((item) => ({
        ...item,
        completed: completed.has(item.item_id),
      })),
    })),
  };
}

export function refreshPathState(pathData, nextSession) {
  if (!pathData?.profile) return pathData;
  return {
    ...pathData,
    profile: {
      ...pathData.profile,
      current_skills: nextSession.skills,
      completed_topics: nextSession.completedTopics,
    },
    stages: (pathData.stages || []).map((stage) => ({
      ...stage,
      items: (stage.items || []).map((item) => {
        const completed = (nextSession.completedItemIds || []).includes(item.item_id);
        const readiness = itemReadiness(stage.name, nextSession.skills, item.skills);
        return {
          ...item,
          completed,
          ready: completed || readiness.ready,
          locked_reason: completed || readiness.ready ? "" : readiness.lockedReason,
        };
      }),
    })),
  };
}

export function markPathItemCompleted(pathData, itemId, nextSession) {
  return refreshPathState(syncCompletedFlags(pathData, nextSession.completedItemIds), nextSession);
}

function normaliseSessionOwner(username) {
  return (username || "").trim().toLowerCase();
}

function sessionKeyFor(username) {
  const owner = normaliseSessionOwner(username);
  return owner ? `${STORAGE_KEY}:${owner}` : "";
}

export function loadSession(username) {
  const key = sessionKeyFor(username);
  if (!key) return emptySession;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? normaliseSession(JSON.parse(saved)) : emptySession;
  } catch {
    return emptySession;
  }
}

export function saveSession(username, session) {
  const key = sessionKeyFor(username);
  if (key) window.localStorage.setItem(key, JSON.stringify(session));
}

export function loadAuth() {
  try {
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { token: "", username: "" };
  } catch {
    return { token: "", username: "" };
  }
}

export function saveAuth(auth) {
  if (auth?.token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function authHeaders(auth) {
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}
