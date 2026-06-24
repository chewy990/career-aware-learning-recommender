import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Landing from "./Landing";
import "./styles.css";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const STORAGE_KEY = "career-aware-recommender-session-v1";
const AUTH_STORAGE_KEY = "career-aware-recommender-auth-v1";
const DIFFICULTIES = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Intermediate" },
  { value: 3, label: "Advanced" },
];

const SKILL_LEVELS = [
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

function skillLevelLabel(level) {
  return SKILL_LEVELS.find((item) => item.value === Number(level))?.label || "Not started";
}

function knownSkillLevel(skills, skillId) {
  return Number(skills?.[skillId] || 0);
}

function isKnownSkill(skills, skillId) {
  return knownSkillLevel(skills, skillId) > 0;
}

function coreSkillsForPathway(pathway) {
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

function itemReadiness(stageName, skills, itemSkills = []) {
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

const emptySession = {
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

function snapshotKeyFor(session, pathwayId) {
  return `${pathwayId}|${session.preferredDifficulty}|${session.preferredFormat}`;
}

function snapshotKey(session) {
  return snapshotKeyFor(session, session.activePathway || session.selectedPathway);
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

function syncCompletedFlags(pathData, completedItemIds) {
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

function refreshPathState(pathData, nextSession) {
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

function markPathItemCompleted(pathData, itemId, nextSession) {
  return refreshPathState(syncCompletedFlags(pathData, nextSession.completedItemIds), nextSession);
}

function normaliseSessionOwner(username) {
  return (username || "").trim().toLowerCase();
}

function sessionKeyFor(username) {
  const owner = normaliseSessionOwner(username);
  return owner ? `${STORAGE_KEY}:${owner}` : "";
}

function loadSession(username) {
  const key = sessionKeyFor(username);
  if (!key) return emptySession;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? normaliseSession(JSON.parse(saved)) : emptySession;
  } catch {
    return emptySession;
  }
}

function saveSession(username, session) {
  const key = sessionKeyFor(username);
  if (key) window.localStorage.setItem(key, JSON.stringify(session));
}

function loadAuth() {
  try {
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { token: "", username: "" };
  } catch {
    return { token: "", username: "" };
  }
}

function saveAuth(auth) {
  if (auth?.token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function authHeaders(auth) {
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

function App() {
  const [meta, setMeta] = useState(null);
  const [auth, setAuth] = useState(loadAuth);
  const [session, setSession] = useState(() => loadSession(loadAuth().username));
  const [step, setStep] = useState("landing");
  const [path, setPath] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [skillCheckIds, setSkillCheckIds] = useState([]);
  const [previousStep, setPreviousStep] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    saveSession(auth.username, session);
  }, [auth.username, session]);

  useEffect(() => {
    saveAuth(auth);
  }, [auth]);

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        const pathwaysRes = await fetch(`${API_BASE}/api/pathways`);
        if (!pathwaysRes.ok) throw new Error("API did not respond cleanly.");
        const pathways = await pathwaysRes.json();
        setMeta(pathways);
        setSession((current) => ({
          ...current,
          selectedPathway: current.selectedPathway || pathways.pathways?.[0]?.id || "",
        }));
      } catch (err) {
        setError(err.message || "Could not load app data.");
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const setupPathway = useMemo(
    () => meta?.pathways?.find((item) => item.id === session.selectedPathway),
    [meta, session.selectedPathway]
  );
  const activePathway = useMemo(
    () => meta?.pathways?.find((item) => item.id === session.activePathway),
    [meta, session.activePathway]
  );

  const coreSkills = useMemo(() => coreSkillsForPathway(setupPathway), [setupPathway]);
  const skillCheckIdSet = useMemo(() => new Set(skillCheckIds), [skillCheckIds]);
  const skillCheckSkills = useMemo(
    () => coreSkills.filter((skill) => skillCheckIdSet.has(skill.id)),
    [coreSkills, skillCheckIdSet]
  );
  const knownCoreSkills = useMemo(
    () => coreSkills.filter((skill) => !skillCheckIdSet.has(skill.id) && isKnownSkill(session.skills, skill.id)),
    [coreSkills, session.skills, skillCheckIdSet]
  );
  const activeCoreSkillIds = useMemo(
    () => new Set(coreSkillsForPathway(activePathway).map((skill) => skill.id)),
    [activePathway]
  );

  async function startLearning() {
    setError("");
    if (!auth.token) {
      setStep("auth");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: authHeaders(auth),
      });
      if (!response.ok) throw new Error("Session expired");
      const data = await response.json();
      const username = data.username || auth.username;
      setAuth((current) => ({ ...current, username }));
      setSession(loadSession(username));
      setPath(null);
      setLastUpdate(null);
      setSkillCheckIds([]);
      setStep("pathways");
    } catch {
      setAuth({ token: "", username: "" });
      setSession(emptySession);
      setPath(null);
      setLastUpdate(null);
      setSkillCheckIds([]);
      setStep("auth");
    }
  }

  async function submitAuth(mode, credentials) {
    setError("");
    const response = await fetch(`${API_BASE}/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || "Could not sign in.");
    }
    setAuth({ token: data.token, username: data.username });
    setSession(loadSession(data.username));
    setPath(null);
    setLastUpdate(null);
    setSkillCheckIds([]);
    setStep("pathways");
  }

  async function logout() {
    if (auth.token) {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: authHeaders(auth),
      }).catch(() => {});
    }
    setAuth({ token: "", username: "" });
    setSession(emptySession);
    setPath(null);
    setLastUpdate(null);
    setSkillCheckIds([]);
    setStep("landing");
    setError("");
  }

  async function loadLearningPath(nextSession = session, pathwayId = nextSession.activePathway || nextSession.selectedPathway) {
    if (!pathwayId) return null;
    const key = snapshotKeyFor(nextSession, pathwayId);
    const savedSnapshot = nextSession.pathSnapshots?.[key];
    if (savedSnapshot && nextSession.completedItemIds.length > 0) {
      const refreshedPath = refreshPathState(syncCompletedFlags(savedSnapshot, nextSession.completedItemIds), nextSession);
      setPath(refreshedPath);
      return refreshedPath;
    }
    if (savedSnapshot) {
      setPath(syncCompletedFlags(savedSnapshot, nextSession.completedItemIds));
      return savedSnapshot;
    }
    setPathLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/learning-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(auth) },
        body: JSON.stringify({
          target_pathway: pathwayId,
          current_skills: nextSession.skills,
          completed_topics: nextSession.completedTopics,
          completed_item_ids: nextSession.completedItemIds,
          preferred_difficulty: nextSession.preferredDifficulty,
          preferred_format: nextSession.preferredFormat,
          max_duration_hours: 12,
          profile_id: "react_custom",
          name: "Custom learner",
        }),
      });
      if (!response.ok) throw new Error("Could not generate the learning path.");
      const generatedPath = await response.json();
      const pathWithFlags = syncCompletedFlags(generatedPath, nextSession.completedItemIds);
      setPath(pathWithFlags);
      setSession((current) => {
        if (current.pathSnapshots?.[key]) return current;
        return {
          ...current,
          pathSnapshots: {
            ...(current.pathSnapshots || {}),
            [key]: pathWithFlags,
          },
        };
      });
      return pathWithFlags;
    } catch (err) {
      setError(err.message || "Could not generate the learning path.");
      return null;
    } finally {
      setPathLoading(false);
    }
  }

  useEffect(() => {
    if ((step === "dashboard" || step === "research") && session.activePathway) {
      loadLearningPath(session, session.activePathway);
    }
  }, [session.activePathway, session.preferredDifficulty, session.preferredFormat, step]);

  function updateSkill(skillId, value) {
    setSession((current) => ({
      ...current,
      skills: { ...current.skills, [skillId]: Number(value) },
    }));
  }

  function choosePathway(pathwayId) {
    const nextPathway = meta?.pathways?.find((item) => item.id === pathwayId);
    const nextCoreSkills = coreSkillsForPathway(nextPathway);
    const nextSkillCheckIds = nextCoreSkills.map((skill) => skill.id);
    const next = { ...session, selectedPathway: pathwayId };
    setSession(next);
    setPath(null);
    setLastUpdate(null);
    setSkillCheckIds(nextSkillCheckIds);
    setStep("skills");
  }

  async function generateCourse() {
    if (!session.selectedPathway) return;
    const nextSelectedPathways = session.selectedPathways.includes(session.selectedPathway)
      ? session.selectedPathways
      : [...session.selectedPathways, session.selectedPathway];
    const next = {
      ...session,
      selectedPathways: nextSelectedPathways,
      activePathway: session.selectedPathway,
    };
    setSession(next);
    setLastUpdate(null);
    setStep("dashboard");
    await loadLearningPath(next, session.selectedPathway);
  }

  function switchActivePathway(pathwayId) {
    const next = { ...session, activePathway: pathwayId, selectedPathway: pathwayId };
    setSession(next);
    setLastUpdate(null);
    loadLearningPath(next, pathwayId);
  }

  function deletePathway(pathwayId) {
    const pathwayLabel = meta?.pathways?.find((item) => item.id === pathwayId)?.label || "this pathway";
    if (!window.confirm(`Are you sure you want to delete ${pathwayLabel} from your courses? Your shared skills and completed progress will stay saved.`)) return;
    const nextSelectedPathways = session.selectedPathways.filter((item) => item !== pathwayId);
    const nextActivePathway = session.activePathway === pathwayId ? nextSelectedPathways[0] || "" : session.activePathway;
    const nextPathSnapshots = Object.fromEntries(
      Object.entries(session.pathSnapshots || {}).filter(([key]) => !key.startsWith(`${pathwayId}|`))
    );
    const next = {
      ...session,
      selectedPathways: nextSelectedPathways,
      activePathway: nextActivePathway,
      selectedPathway: nextActivePathway || session.selectedPathway,
      pathSnapshots: nextPathSnapshots,
    };
    setSession(next);
    setLastUpdate(null);
    if (nextActivePathway) {
      loadLearningPath(next, nextActivePathway);
    } else {
      setPath(null);
      setStep("pathways");
    }
  }

  async function completeItem(stageName, item) {
    if (session.completedItemIds.includes(item.item_id)) return;
    const response = await fetch(`${API_BASE}/api/complete-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(auth) },
      body: JSON.stringify({
        stage: stageName,
        current_skills: session.skills,
        completed_topics: session.completedTopics,
        topic: item.topic,
        skills: item.skills,
        skill_targets: Object.fromEntries((activePathway?.skills || []).map((skill) => [skill.id, skill.target])),
      }),
    });
    const result = response.ok ? await response.json() : null;
    const completedRecord = {
      item_id: item.item_id,
      resource_id: item.resource_id,
      title: item.title,
      stage: stageName,
      source: item.source,
      source_url: item.source_url,
      reason: item.reason,
      skill_changes: result?.skill_changes || [],
    };
    const nextCompletedIds = [...session.completedItemIds, item.item_id];
    const next = {
      ...session,
      skills: result?.current_skills || session.skills,
      completedTopics: result?.completed_topics || session.completedTopics,
      completedItemIds: nextCompletedIds,
      completedItems: [...session.completedItems, completedRecord],
      pathSnapshots: {
        ...(session.pathSnapshots || {}),
        [snapshotKeyFor(session, session.activePathway)]: path || session.pathSnapshots?.[snapshotKeyFor(session, session.activePathway)],
      },
    };
    setLastUpdate({ title: item.title, skillChanges: result?.skill_changes || [] });
    setSession(next);
    setPath(markPathItemCompleted(path, item.item_id, next));
  }

  function resetProgress() {
    const next = { ...session, completedItemIds: [], completedItems: [], completedTopics: [], pathSnapshots: {} };
    setSession(next);
    setLastUpdate(null);
    if (step === "dashboard" || step === "research") loadLearningPath(next, next.activePathway);
  }

  function resetSkills() {
    const next = { ...session, skills: {}, pathSnapshots: {} };
    setSession(next);
    setPath(null);
    setLastUpdate(null);
    setSkillCheckIds([]);
    setStep("pathways");
  }

  if (loading) return <Shell><div className="skeleton">Loading recommender data...</div></Shell>;

  if (step === "landing") {
    return (
      <Shell>
        <Landing onStart={startLearning} />
      </Shell>
    );
  }

  if (step === "auth") {
    return (
      <Shell>
        <AuthStep onSubmit={submitAuth} onBack={() => setStep("landing")} />
      </Shell>
    );
  }

  return (
    <Shell>
      {error && <div className="error-banner">{error}</div>}

      <main className="app-grid">
        <aside className="control-panel">
          <div className="panel-eyebrow">Course home</div>
          <h2>Your learning space</h2>
          <p>Generated courses stay here. Add another pathway when you are ready.</p>

          <div className="session-summary">
            {auth.username && (
              <div>
                <span>Signed in</span>
                <strong>{auth.username}</strong>
              </div>
            )}
            <div>
              <span>Current step</span>
              <strong>{step === "pathways" ? "Choose pathway" : step === "skills" ? "Enter skills" : step === "auth" ? "Login" : step === "research" ? "Research view" : "Dashboard"}</strong>
            </div>
            <div>
              <span>Courses</span>
              <strong>{session.selectedPathways.length}</strong>
            </div>
            <div>
              <span>Skills completed</span>
              <strong>{session.completedItemIds.length}</strong>
            </div>
          </div>

          <div className="button-stack">
            <button className="ghost" onClick={() => setStep("landing")}>Landing page</button>
            <button className="ghost" onClick={() => setStep("pathways")}>Choose new pathway</button>
            <button className="ghost" onClick={() => { setPreviousStep("dashboard"); setStep("research"); }}>Research view</button>
            <button className="ghost" onClick={resetProgress}>Reset progress</button>
            <button className="ghost" onClick={resetSkills}>Reset skills</button>
            <button className="ghost subtle" onClick={logout}>Logout</button>
          </div>
        </aside>

        <section className="main-panel">
          {step === "pathways" && (
            <CourseStep
              pathways={meta?.pathways || []}
              hasCourses={session.selectedPathways.length > 0}
              choosePathway={choosePathway}
              onBack={() => setStep("dashboard")}
            />
          )}
          {step === "skills" && (
            <SkillStep
              pathway={setupPathway}
              unknownSkills={skillCheckSkills}
              knownSkills={knownCoreSkills}
              session={session}
              setSession={setSession}
              updateSkill={updateSkill}
              onBack={() => setStep("pathways")}
              onNext={generateCourse}
            />
          )}
          {step === "dashboard" && (
            <Dashboard
              pathways={meta?.pathways || []}
              session={session}
              path={path}
              pathLoading={pathLoading}
              activePathway={activePathway}
              activeCoreSkillIds={activeCoreSkillIds}
              onSwitchPathway={switchActivePathway}
              onDeletePathway={deletePathway}
              onComplete={completeItem}
              lastUpdate={lastUpdate}
            />
          )}
          {step === "research" && (
            <ResearchView
              path={path}
              session={session}
              selectedPathway={activePathway}
              coreSkillIds={activeCoreSkillIds}
              onBack={() => setStep(session.selectedPathways.length > 0 ? "dashboard" : "pathways")}
            />
          )}
        </section>
      </main>
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="page-shell">{children}</div>;
}

function AuthStep({ onSubmit, onBack }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRegistering = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    const nextUsername = username.trim();
    if (!nextUsername || !password) {
      setError("Enter both a username and password.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await onSubmit(mode, { username: nextUsername, password });
    } catch (err) {
      setError(err.message || "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="section-heading">
          <span>{isRegistering ? "Create account" : "Login"}</span>
          <h2>{isRegistering ? "Create your learner account" : "Welcome back"}</h2>
          <p>Sign in after the landing page so your course dashboard stays tucked behind a simple account step.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>
          {error && <div className="error-banner">{error}</div>}
          <div className="action-row">
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : isRegistering ? "Create account" : "Log in"}
            </button>
            <button className="ghost" type="button" onClick={onBack}>Back to landing</button>
          </div>
        </form>
        <button
          className="auth-toggle"
          type="button"
          onClick={() => {
            setMode(isRegistering ? "login" : "register");
            setError("");
          }}
        >
          {isRegistering ? "Already have an account? Log in." : "New here? Create an account."}
        </button>
      </section>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.4 12s3.5-6 9.6-6 9.6 6 9.6 6-3.5 6-9.6 6-9.6-6-9.6-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M9.6 5.4A10.2 10.2 0 0 1 12 5c6.1 0 9.6 7 9.6 7a16.7 16.7 0 0 1-3 3.8" />
      <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
      <path d="M6.5 6.8C3.9 8.5 2.4 12 2.4 12s3.5 7 9.6 7a9.9 9.9 0 0 0 4.2-.9" />
    </svg>
  );
}


function SkillStep({ pathway, unknownSkills, knownSkills, session, setSession, updateSkill, onBack, onNext }) {
  return (
    <div className="stack">
      <div className="section-heading">
        <span>Step 2</span>
        <h2>{pathway?.label || "Selected pathway"} skill check</h2>
        <p>Only unknown core skills need sliders. Skills you already know stay saved and carry across pathways.</p>
      </div>
      {knownSkills.length > 0 && (
        <div className="known-skills">
          <h3>Already known</h3>
          <div className="known-skill-list">
            {knownSkills.map((skill) => (
              <span key={skill.id}>{skill.label}: {skillLevelLabel(session.skills[skill.id])}</span>
            ))}
          </div>
        </div>
      )}
      {unknownSkills.length > 0 ? (
        <div className="skill-list">
          {unknownSkills.map((skill) => (
            <SkillSliderRow key={skill.id} skill={skill} session={session} updateSkill={updateSkill} />
          ))}
        </div>
      ) : (
        <div className="empty-state">All core skills for this pathway are already known. You can go straight to the learning path.</div>
      )}
      <label className="field">
        <span>Preferred course difficulty</span>
        <select value={session.preferredDifficulty} onChange={(event) => setSession({ ...session, preferredDifficulty: Number(event.target.value) })}>
          {DIFFICULTIES.map((difficulty) => <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>)}
        </select>
        <small>Used to suggest easier or harder resources. It does not change skill progress.</small>
      </label>
      <div className="action-row">
        <button className="ghost" onClick={onBack}>Back to pathways</button>
        <button className="primary" onClick={onNext}>Generate Course</button>
      </div>
    </div>
  );
}

function SkillSliderRow({ skill, session, updateSkill }) {
  return (
    <label className="skill-row">
      <span>
        <strong>{skill.label}</strong>
      </span>
      <div className="skill-slider">
        <input type="range" min="0" max="3" value={session.skills[skill.id] || 0} aria-label={`${skill.label} level`} onChange={(event) => updateSkill(skill.id, event.target.value)} />
        <div className="skill-scale" aria-hidden="true">
          {SKILL_LEVELS.map((level) => <span key={level.value}>{level.label}</span>)}
        </div>
      </div>
      <b>{skillLevelLabel(session.skills[skill.id] || 0)}</b>
    </label>
  );
}

function CourseStep({ pathways, hasCourses, choosePathway, onBack }) {
  return (
    <div className="stack">
      <div className="section-heading">
        <span>Step 1</span>
        <h2>What will we start learning today?</h2>
        <p>You can switch later with one click. Shared skills, such as Python, SQL, Programming, Databases, and Version Control, stay saved.</p>
      </div>
      {hasCourses && <button className="ghost inline-action" onClick={onBack}>Back to Courses</button>}
      <div className="pathway-grid">
        {pathways.map((pathway) => (
          <button className="pathway-card" key={pathway.id} onClick={() => choosePathway(pathway.id)}>
            <span>{pathway.label}</span>
            <small>{pathway.skills.slice(0, 4).map((skill) => skill.label).join(" / ")}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ pathways, session, path, pathLoading, activePathway, activeCoreSkillIds, onSwitchPathway, onDeletePathway, onComplete, lastUpdate }) {
  const selectedPathwaySet = new Set(session.selectedPathways);
  const selectedPathways = pathways.filter((pathway) => selectedPathwaySet.has(pathway.id));
  if (selectedPathways.length === 0) {
    return <div className="empty-state">No courses yet. Choose a pathway to generate your first course.</div>;
  }
  return (
    <div className="stack">
      <div className="dashboard-header">
        <div className="section-heading">
          <span>Course Home</span>
          <h2>Your generated courses</h2>
          <p>Switch between pathways. Your saved skills and completion progress carry across courses.</p>
        </div>
        <div className="pathway-tabs">
          {selectedPathways.map((pathway) => (
            <button
              className={session.activePathway === pathway.id ? "pathway-tab active" : "pathway-tab"}
              key={pathway.id}
              onClick={() => onSwitchPathway(pathway.id)}
            >
              {pathway.label}
            </button>
          ))}
        </div>
      </div>
      <div className="course-slider" key={session.activePathway}>
        <PathStep
          path={path}
          pathLoading={pathLoading}
          session={session}
          selectedPathway={activePathway}
          coreSkillIds={activeCoreSkillIds}
          onComplete={onComplete}
          lastUpdate={lastUpdate}
        />
      </div>
      <div className="danger-zone">
        <h3>Remove a pathway</h3>
        <p>Delete a pathway course if you no longer want to commit to it. Shared skills and completed progress stay saved.</p>
        <div className="delete-pathway-list">
          {selectedPathways.map((pathway) => (
            <button className="danger-button" key={pathway.id} onClick={() => onDeletePathway(pathway.id)}>
              Delete {pathway.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PathStep({ path, pathLoading, session, selectedPathway, coreSkillIds, onComplete, lastUpdate }) {
  if (pathLoading && !path) return <div className="skeleton">Generating staged path...</div>;
  if (!path) return <div className="empty-state">Choose a pathway to generate your learning path.</div>;
  const visibleSkillGaps = (path.skill_gaps || []).filter((gap) => coreSkillIds.has(gap.skill));
  const visibleItems = (path.stages || []).flatMap((stage) => stage.items || []);
  const pathwayComplete = visibleItems.length > 0 && visibleItems.every((item) => item.completed);
  return (
    <div className="stack">
      <div className="path-header">
        <div>
          <span>Active pathway</span>
          <h2>{path.profile.target_pathway_label}</h2>
        </div>
        <div className="progress-chip">{session.completedItemIds.length} completed</div>
      </div>

      {lastUpdate && (
        <div className="progress-note">
          <strong>Completed {lastUpdate.title}</strong>
          {lastUpdate.skillChanges.length > 0 ? (
            <div className="skill-change-list">
              {lastUpdate.skillChanges.map((change) => (
                <div className="skill-change" key={change.skill}>
                  <span>{change.label}</span>
                  <div className="skill-change-levels">
                    <b>{change.before_label || skillLevelLabel(change.before)}</b>
                    <i aria-hidden="true">&gt;</i>
                    <b>{change.after_label || skillLevelLabel(change.after)}</b>
                  </div>
                </div>
              ))}
            </div>
          ) : <p>Skills reinforced.</p>}
        </div>
      )}

      {path.data_scientist_suggestion && (
        <div className="bridge-note">
          <strong>Data Scientist</strong>
          <p>You are building a strong Data Analyst foundation. If you want to move toward predictive modelling, Data Scientist could be a natural next pathway.</p>
        </div>
      )}

      {(path.mastery || pathwayComplete) && (
        <div className="mastery-note">
          <strong>Congratulations, you completed this pathway!</strong>
          <p>You finished every visible step in this course. Nice work. You can review the resources, deepen later, or start another pathway with your saved skills.</p>
        </div>
      )}

      <div className="stage-list">
        {path.stages.map((stage) => (
          <Stage key={stage.name} stage={stage} onComplete={onComplete} />
        ))}
      </div>

      <details className="skill-gap-panel">
        <summary>Progression ({visibleSkillGaps.length})</summary>
        {visibleSkillGaps.length === 0 ? <p>No actionable core gaps right now.</p> : visibleSkillGaps.map((gap) => (
          <div className="gap-row" key={gap.skill}>
            <span>{gap.label}</span>
            <small>{gap.priority}</small>
            <b>
              <span>{gap.current_label || skillLevelLabel(gap.current)}</span>
              <i aria-hidden="true">&gt;</i>
              <span>{gap.target_label || skillLevelLabel(gap.target)}</span>
            </b>
          </div>
        ))}
      </details>
    </div>
  );
}

function ResearchView({ path, session, selectedPathway, coreSkillIds, onBack }) {
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState("");
  const [model, setModel] = useState("hybrid");
  const [topK, setTopK] = useState(5);
  const [recommendations, setRecommendations] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [datasetSummary, setDatasetSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfiles() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/profiles`);
        if (!response.ok) throw new Error("Could not load research profiles.");
        const data = await response.json();
        const nextProfiles = data.profiles || [];
        setProfiles(nextProfiles);
        setProfileId((current) => current || nextProfiles[0]?.profile_id || "");
      } catch (err) {
        setError(err.message || "Could not load research profiles.");
      } finally {
        setLoading(false);
      }
    }
    loadProfiles();
  }, []);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setMetricsLoading(true);
        const response = await fetch(`${API_BASE}/api/research/metrics`);
        if (!response.ok) throw new Error("Could not load model metrics.");
        const data = await response.json();
        setMetrics(data.metrics || []);
      } catch (err) {
        setError(err.message || "Could not load model metrics.");
      } finally {
        setMetricsLoading(false);
      }
    }
    loadMetrics();
  }, []);

  useEffect(() => {
    async function loadDatasetSummary() {
      try {
        const response = await fetch(`${API_BASE}/api/research/dataset-summary`);
        if (!response.ok) throw new Error("Could not load dataset summary.");
        const data = await response.json();
        setDatasetSummary(data);
      } catch (err) {
        setError(err.message || "Could not load dataset summary.");
      }
    }
    loadDatasetSummary();
  }, []);

  useEffect(() => {
    async function loadRecommendations() {
      if (!profileId) return;
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/research/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_id: profileId, model, top_k: topK }),
        });
        if (!response.ok) throw new Error("Could not load research recommendations.");
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        setError(err.message || "Could not load research recommendations.");
      } finally {
        setLoading(false);
      }
    }
    loadRecommendations();
  }, [profileId, model, topK]);

  return (
    <div className="stack">
      <div className="research-header">
        <div className="section-heading">
          <span>Research</span>
          <h2>Research view</h2>
          <p>Understand why resources were chosen for your current session, with model evidence kept below for evaluation.</p>
        </div>
        <button className="ghost inline-action" onClick={onBack}>Back to Courses</button>
      </div>
      <CurrentLearnerResearch path={path} session={session} selectedPathway={selectedPathway} coreSkillIds={coreSkillIds} />
      {metricsLoading ? <div className="skeleton">Loading model metrics...</div> : (
        <>
          <MetricsTable metrics={metrics} />
          <NdcgChart metrics={metrics} />
        </>
      )}
      {datasetSummary && <DatasetSummary summary={datasetSummary} />}
      {error && <div className="error-banner">{error}</div>}
      <details className="evaluation-examples">
        <summary>Model example recommendations</summary>
        <p>These use fixed sample profiles from the evaluation dataset. They are for model inspection, not your personal learner state.</p>
        <div className="research-controls">
          <label className="field">
            <span>Evaluation profile</span>
            <select value={profileId} onChange={(event) => setProfileId(event.target.value)}>
              {profiles.map((profile) => <option key={profile.profile_id} value={profile.profile_id}>{profile.name} - {profile.target_pathway_label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Model</span>
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              <option value="hybrid">Hybrid</option>
              <option value="content_based">Content based</option>
              <option value="popularity">Popularity</option>
            </select>
          </label>
          <label className="field">
            <span>Top K</span>
            <select value={topK} onChange={(event) => setTopK(Number(event.target.value))}>
              {[3, 5, 10].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
        {loading ? <div className="skeleton">Loading research results...</div> : (
          <div className="research-list">
            {recommendations.map((item) => (
              <article className="research-row" key={`${item.rank}-${item.resource_id}`}>
                <strong>#{item.rank} {item.title}</strong>
                <span>{item.provider} | Score {Number(item.score).toFixed(3)}</span>
                <p>{item.explanation}</p>
              </article>
            ))}
          </div>
        )}
      </details>
      <button className="ghost" onClick={onBack}>Back to Courses</button>
    </div>
  );
}

function CurrentLearnerResearch({ path, session, selectedPathway, coreSkillIds }) {
  const visibleItems = (path?.stages || []).flatMap((stage) =>
    (stage.items || []).map((item) => ({ ...item, stage: stage.name }))
  );
  const relevantItems = visibleItems.slice(0, 8);
  return (
    <section className="current-research">
      <div>
        <h3>Relevant courses for you</h3>
        <p>
          These are the current resources chosen from your pathway, saved skills, completed modules, preferred course difficulty, and progression needs.
        </p>
      </div>
      {!path ? (
        <div className="research-note">Choose a pathway and generate a learning path first. This section will then show the relevant courses the system chose for you.</div>
      ) : (
        <>
          {session.completedItems.length === 0 && (
            <div className="research-note">You have not completed any modules yet. This section shows why the system chose your current resources.</div>
          )}
          <div className="personal-reason-list">
            {relevantItems.length === 0 ? (
              <div className="research-note">All currently visible resources are completed. Generate or switch pathways to see more relevant courses.</div>
            ) : relevantItems.map((item, index) => (
              <article className={item.completed ? "research-row completed" : "research-row"} key={item.item_id}>
                <strong>#{index + 1} {item.title} {item.completed && <em>(Completed)</em>}</strong>
                <span>{item.provider || item.source} | {item.stage} | Score {item.score == null ? "N/A" : Number(item.score).toFixed(3)}</span>
                <p>Recommended because {normaliseExplanation(item.explanation || item.reason)}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function normaliseExplanation(explanation) {
  if (!explanation) return "it matches your current pathway and progression needs.";
  return explanation.replace(/^Recommended because\s+/i, "").replace(/\.$/, "") + ".";
}

function DatasetSummary({ summary }) {
  return (
    <details className="dataset-summary">
      <summary>Dataset summary</summary>
      <div className="dataset-grid">
        <div><span>Learning resources</span><strong>{summary.learning_resources}</strong></div>
        <div><span>Verified modules</span><strong>{summary.verified_modules}</strong></div>
        <div><span>Learner profiles</span><strong>{summary.learner_profiles}</strong></div>
        <div><span>Relevance profiles</span><strong>{summary.relevance_profiles}</strong></div>
        <div><span>Pathways</span><strong>{summary.pathways}</strong></div>
        <div><span>Skills</span><strong>{summary.skills}</strong></div>
        <div><span>Output folder</span><strong>{summary.output_folder}</strong></div>
      </div>
    </details>
  );
}

function MetricsTable({ metrics }) {
  return (
    <div className="metrics-table-wrap">
      <table className="metrics-table">
        <thead>
          <tr>
            <th>model</th>
            <th>k</th>
            <th>precision_at_k</th>
            <th>recall_at_k</th>
            <th>ndcg_at_k</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((row) => (
            <tr key={row.model}>
              <td>{row.model}</td>
              <td>{row.k}</td>
              <td>{Number(row.precision_at_k).toFixed(4)}</td>
              <td>{Number(row.recall_at_k).toFixed(4)}</td>
              <td>{Number(row.ndcg_at_k).toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NdcgChart({ metrics }) {
  const chartWidth = 620;
  const chartHeight = 260;
  const plotTop = 44;
  const plotBottom = 206;
  const barWidth = 110;
  const gap = metrics.length > 1 ? (chartWidth - 120 - barWidth * metrics.length) / (metrics.length - 1) : 0;
  return (
    <div className="ndcg-card">
      <h3>NDCG@5 comparison</h3>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="NDCG at 5 comparison chart">
        <line x1="50" y1={plotBottom} x2={chartWidth - 50} y2={plotBottom} />
        <text x="58" y="24">NDCG@5</text>
        {metrics.map((row, index) => {
          const value = Number(row.ndcg_at_k || 0);
          const x = 70 + index * (barWidth + gap);
          const height = Math.max(2, value * (plotBottom - plotTop));
          const y = plotBottom - height;
          return (
            <g key={row.model}>
              <rect x={x} y={y} width={barWidth} height={height} />
              <text className="bar-value" x={x + barWidth / 2} y={Math.max(18, y - 8)}>{value.toFixed(3)}</text>
              <text className="bar-label" x={x + barWidth / 2} y={plotBottom + 22}>{row.model}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Stage({ stage, onComplete }) {
  return (
    <details className="stage" open={stage.name.startsWith("1.") || stage.name.startsWith("2.")}>
      <summary>{stage.name}</summary>
      {stage.items.length === 0 ? (
        <div className="empty-stage">Completed items remain visible. No new useful next steps for this stage right now.</div>
      ) : stage.items.map((item) => (
        <article className={item.completed ? "resource completed" : "resource"} key={item.item_id}>
          <label className="complete-line">
            <input type="checkbox" checked={item.completed} disabled={item.completed || !item.ready} onChange={() => onComplete(stage.name, item)} />
            <span>{item.completed ? "Completed" : item.ready ? "Completed" : "Locked"}</span>
          </label>
          <h3>{item.title}</h3>
          {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">{item.source}</a> : <p>{item.source}</p>}
          <div className="meta-line">{item.difficulty_label} | {Number(item.duration_hours).toLocaleString(undefined, { maximumFractionDigits: 2 })} hours</div>
          {!item.ready && <div className="lock-note">{item.locked_reason}</div>}
          <p>{item.reason}</p>
        </article>
      ))}
    </details>
  );
}

createRoot(document.getElementById("root")).render(<App />);
