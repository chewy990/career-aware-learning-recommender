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

function skillLevelLabel(level) {
  return SKILL_LEVELS.find((item) => item.value === Number(level))?.label || "Not started";
}

const emptySession = {
  skills: {},
  completedTopics: [],
  completedItemIds: [],
  completedItems: [],
  pathSnapshots: {},
  selectedPathway: "",
  preferredDifficulty: 1,
  preferredFormat: "course",
};

function snapshotKey(session) {
  return `${session.selectedPathway}|${session.preferredDifficulty}|${session.preferredFormat}`;
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

function updatePathProfile(pathData, nextSession) {
  if (!pathData?.profile) return pathData;
  return {
    ...pathData,
    profile: {
      ...pathData.profile,
      current_skills: nextSession.skills,
      completed_topics: nextSession.completedTopics,
    },
  };
}

function markPathItemCompleted(pathData, itemId, nextSession) {
  return updatePathProfile(syncCompletedFlags(pathData, nextSession.completedItemIds), nextSession);
}
function loadSession() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...emptySession, ...JSON.parse(saved) } : emptySession;
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
  const [step, setStep] = useState("skills");
  const [path, setPath] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
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

  const selectedPathway = useMemo(
    () => meta?.pathways?.find((item) => item.id === session.selectedPathway),
    [meta, session.selectedPathway]
  );

  const visibleSkills = useMemo(() => {
    const pathwaySkills = selectedPathway?.skills || [];
    const known = new Set(pathwaySkills.map((skill) => skill.id));
    const extra = (meta?.skills || []).filter((skill) => session.skills[skill.id] > 0 && !known.has(skill.id));
    return [...pathwaySkills, ...extra.map((skill) => ({ ...skill, target: 0 }))];
  }, [meta, selectedPathway, session.skills]);

  async function loadLearningPath(nextSession = session) {
    if (!nextSession.selectedPathway) return;
    const key = snapshotKey(nextSession);
    const savedSnapshot = nextSession.pathSnapshots?.[key];
    if (savedSnapshot && nextSession.completedItemIds.length > 0) {
      setPath(updatePathProfile(syncCompletedFlags(savedSnapshot, nextSession.completedItemIds), nextSession));
      return;
    }
    setPathLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/learning-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_pathway: nextSession.selectedPathway,
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
        if (snapshotKey(current) !== key || current.pathSnapshots?.[key]) return current;
        return {
          ...current,
          pathSnapshots: {
            ...(current.pathSnapshots || {}),
            [key]: pathWithFlags,
          },
        };
      });
    } catch (err) {
      setError(err.message || "Could not generate the learning path.");
    } finally {
      setPathLoading(false);
    }
  }

  useEffect(() => {
    if (step === "path" && session.selectedPathway) {
      loadLearningPath(session);
    }
  }, [session.selectedPathway, session.preferredDifficulty, session.preferredFormat, step]);

  function updateSkill(skillId, value) {
    setSession((current) => ({
      ...current,
      skills: { ...current.skills, [skillId]: Number(value) },
    }));
  }

  function choosePathway(pathwayId) {
    const next = { ...session, selectedPathway: pathwayId };
    setSession(next);
    setStep("path");
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
        skill_targets: Object.fromEntries((selectedPathway?.skills || []).map((skill) => [skill.id, skill.target])),
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
        [snapshotKey(session)]: path || session.pathSnapshots?.[snapshotKey(session)],
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
    if (step === "path") loadLearningPath(next);
  }

  function resetSkills() {
    const next = { ...emptySession, selectedPathway: session.selectedPathway || meta?.pathways?.[0]?.id || "" };
    setSession(next);
    setPath(null);
    setLastUpdate(null);
    setStep("skills");
  }

  if (loading) return <Shell><div className="skeleton">Loading recommender data...</div></Shell>;

  return (
    <Shell>
      {error && <div className="error-banner">{error}</div>}
      <Hero onStart={() => setStep("skills")} pathwayCount={meta?.pathways?.length || 0} />

      <main className="app-grid">
        <aside className="control-panel">
          <div className="panel-eyebrow">Session</div>
          <h2>Your saved setup</h2>
          <p>This side only shows settings and reset controls. Complete the active step in the main panel.</p>

          <div className="session-summary">
            <div>
              <span>Current step</span>
              <strong>{step === "skills" ? "Enter skills" : step === "courses" ? "Choose pathway" : "Learning path"}</strong>
            </div>
            <div>
              <span>Saved skills</span>
              <strong>{Object.values(session.skills).filter((level) => Number(level) > 0).length}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{session.completedItemIds.length}</strong>
            </div>
          </div>

          <label className="field">
            <span>Preferred level</span>
            <select value={session.preferredDifficulty} onChange={(event) => setSession({ ...session, preferredDifficulty: Number(event.target.value) })}>
              {DIFFICULTIES.map((difficulty) => <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>)}
            </select>
          </label>

          <div className="button-stack">
            <button className="ghost" onClick={resetProgress}>Reset progress</button>
            <button className="ghost" onClick={resetSkills}>Reset skills</button>
          </div>
        </aside>

        <section className="main-panel">
          {step === "skills" && (
            <SkillStep
              skills={visibleSkills}
              session={session}
              updateSkill={updateSkill}
              onNext={() => setStep("courses")}
            />
          )}
          {step === "courses" && (
            <CourseStep pathways={meta?.pathways || []} selected={session.selectedPathway} choosePathway={choosePathway} />
          )}
          {step === "path" && (
            <PathStep
              path={path}
              pathLoading={pathLoading}
              session={session}
              selectedPathway={selectedPathway}
              onComplete={completeItem}
              lastUpdate={lastUpdate}
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
        <p>Choose a computing pathway, start from your current skills, and get a staged learning plan that favours useful practice over rigid full tracks.</p>
        <button className="primary" onClick={onStart}>Start with my skills</button>
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


function SkillStep({ skills, session, updateSkill, onNext }) {
  return (
    <div className="stack">
      <div className="section-heading">
        <span>Step 1</span>
        <h2>Indicate current skills</h2>
        <p>Move each slider to match what you can do today. Scroll through the skills, then use the button at the bottom to choose your course.</p>
      </div>
      <div className="skill-list">
        {skills.map((skill) => (
          <label className="skill-row" key={skill.id}>
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
        ))}
      </div>
      <button className="primary" onClick={onNext}>Continue to choose course</button>
    </div>
  );
}

function CourseStep({ pathways, selected, choosePathway }) {
  return (
    <div className="stack">
      <div className="section-heading">
        <span>Step 2</span>
        <h2>Choose one pathway to start</h2>
        <p>You can switch later with one click. Shared skills, such as Python or SQL, stay saved.</p>
      </div>
      <div className="pathway-grid">
        {pathways.map((pathway) => (
          <button className={selected === pathway.id ? "pathway-card selected" : "pathway-card"} key={pathway.id} onClick={() => choosePathway(pathway.id)}>
            <span>{pathway.label}</span>
            <small>{pathway.skills.slice(0, 4).map((skill) => skill.label).join(" / ")}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function PathStep({ path, pathLoading, session, selectedPathway, onComplete, lastUpdate }) {
  if (pathLoading && !path) return <div className="skeleton">Generating staged path...</div>;
  if (!path) return <div className="empty-state">Choose a pathway to generate your learning path.</div>;
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
            <p>{lastUpdate.skillChanges.map((change) => `${change.label}: ${change.before_label || skillLevelLabel(change.before)} > ${change.after_label || skillLevelLabel(change.after)}`).join(", ")}</p>
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
          <strong>Pathway foundation complete</strong>
          <p>You have completed the visible next steps for this pathway. You can deepen later or switch to another pathway with your saved skills.</p>
        </div>
      )}

      <div className="stage-list">
        {path.stages.map((stage) => (
          <Stage key={stage.name} stage={stage} onComplete={onComplete} />
        ))}
      </div>

      <div className="skill-gap-panel">
        <h3>Skill gaps</h3>
        {path.skill_gaps.length === 0 ? <p>No actionable gaps right now.</p> : path.skill_gaps.map((gap) => (
          <div className="gap-row" key={gap.skill}>
            <span>{gap.label}</span>
            <small>{gap.priority}</small>
            <b>{gap.current_label || skillLevelLabel(gap.current)} &gt; {gap.target_label || skillLevelLabel(gap.target)}</b>
          </div>
        ))}
      </div>
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
