import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const STORAGE_KEY = "career-aware-recommender-session-v1";
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
function loadSession() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? normaliseSession(JSON.parse(saved)) : emptySession;
  } catch {
    return emptySession;
  }
}

function saveSession(session) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function App() {
  const [meta, setMeta] = useState(null);
  const [session, setSession] = useState(loadSession);
  const [step, setStep] = useState("landing");
  const [path, setPath] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [skillCheckIds, setSkillCheckIds] = useState([]);
  const [previousStep, setPreviousStep] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    saveSession(session);
  }, [session]);

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
        headers: { "Content-Type": "application/json" },
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

  async function completeItem(stageName, item) {
    if (session.completedItemIds.includes(item.item_id)) return;
    const response = await fetch(`${API_BASE}/api/complete-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        <Hero onStart={() => setStep("pathways")} pathwayCount={meta?.pathways?.length || 0} />
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
            <div>
              <span>Current step</span>
              <strong>{step === "pathways" ? "Choose pathway" : step === "skills" ? "Enter skills" : step === "research" ? "Research view" : "Dashboard"}</strong>
            </div>
            <div>
              <span>Courses</span>
              <strong>{session.selectedPathways.length}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{session.completedItemIds.length}</strong>
            </div>
          </div>

          <div className="button-stack">
            <button className="ghost" onClick={() => setStep("landing")}>Landing page</button>
            <button className="ghost" onClick={() => setStep("pathways")}>Choose new pathway</button>
            <button className="ghost" onClick={() => { setPreviousStep("dashboard"); setStep("research"); }}>Research view</button>
            <button className="ghost" onClick={resetProgress}>Reset progress</button>
            <button className="ghost" onClick={resetSkills}>Reset skills</button>
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

function Hero({ onStart, pathwayCount }) {
  return (
    <header className="hero">
      <div className="hero-copy">
        <div className="pill">Career-aware recommender</div>
        <h1>Learn just enough. Build early. Deepen later.</h1>
        <p>Choose a computing pathway, answer only the skill checks that are still unknown, and get a staged learning plan that favours useful practice over rigid full tracks.</p>
        <button className="primary" onClick={onStart}>Start Learning</button>
      </div>
      <div className="hero-system" aria-hidden="true">
        <div className="orbit orbit-a" />
        <div className="orbit orbit-b" />
        <div className="signal-card top">{pathwayCount} pathways</div>
        <div className="signal-card bottom">Session skills saved</div>
      </div>
    </header>
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

function Dashboard({ pathways, session, path, pathLoading, activePathway, activeCoreSkillIds, onSwitchPathway, onComplete, lastUpdate }) {
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
    </div>
  );
}

function PathStep({ path, pathLoading, session, selectedPathway, coreSkillIds, onComplete, lastUpdate }) {
  if (pathLoading && !path) return <div className="skeleton">Generating staged path...</div>;
  if (!path) return <div className="empty-state">Choose a pathway to generate your learning path.</div>;
  const visibleSkillGaps = (path.skill_gaps || []).filter((gap) => coreSkillIds.has(gap.skill));
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

      {path.mastery && (
        <div className="mastery-note">
          <strong>Congratulations, pathway foundation complete!</strong>
          <p>You finished the visible next steps for this pathway. Nice work. You can now deepen later or switch to another pathway with your saved skills.</p>
        </div>
      )}

      <div className="stage-list">
        {path.stages.map((stage) => (
          <Stage key={stage.name} stage={stage} onComplete={onComplete} />
        ))}
      </div>

      <details className="skill-gap-panel">
        <summary>Skill gaps ({visibleSkillGaps.length})</summary>
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
      <div className="section-heading">
        <span>Research</span>
        <h2>Research view</h2>
        <p>Understand why resources were chosen for your current session, with model evidence kept below for evaluation.</p>
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
      <button className="ghost" onClick={onBack}>Back</button>
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
          These are the current resources chosen from your pathway, saved skills, completed modules, preferred course difficulty, and skill gaps.
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
  if (!explanation) return "it matches your current pathway and skill gaps.";
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
