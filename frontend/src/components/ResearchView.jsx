import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";

function normaliseExplanation(explanation) {
  if (!explanation) return "it matches your current pathway and progression needs.";
  return explanation.replace(/^Recommended because\s+/i, "").replace(/\.$/, "") + ".";
}

function CurrentLearnerResearch({ path, session, coreSkillIds }) {
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

export default function ResearchView({ path, session, selectedPathway, coreSkillIds, onBack }) {
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
