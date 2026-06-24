import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "./lib/api";
import {
  authHeaders,
  coreSkillsForPathway,
  emptySession,
  isKnownSkill,
  loadAuth,
  loadSession,
  markPathItemCompleted,
  refreshPathState,
  saveAuth,
  saveSession,
  snapshotKeyFor,
  syncCompletedFlags,
} from "./lib/session";
import Landing from "./Landing";
import Shell from "./components/Shell";
import AuthStep from "./components/AuthStep";
import CourseStep from "./components/CourseStep";
import SkillStep from "./components/SkillStep";
import Dashboard from "./components/Dashboard";
import ResearchView from "./components/ResearchView";

export default function App() {
  const [meta, setMeta] = useState(null);
  const [auth, setAuth] = useState(loadAuth);
  const [session, setSession] = useState(() => loadSession(loadAuth().username));
  const [step, setStep] = useState("landing");
  const [path, setPath] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [skillCheckIds, setSkillCheckIds] = useState([]);
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
            <button className="ghost" onClick={() => setStep("research")}>Research view</button>
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
