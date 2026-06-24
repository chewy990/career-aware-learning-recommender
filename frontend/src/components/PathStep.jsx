import { skillLevelLabel } from "../lib/session";

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

export default function PathStep({ path, pathLoading, session, selectedPathway, coreSkillIds, onComplete, lastUpdate }) {
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
