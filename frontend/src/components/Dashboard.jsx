import PathStep from "./PathStep";

export default function Dashboard({ pathways, session, path, pathLoading, activePathway, activeCoreSkillIds, onSwitchPathway, onDeletePathway, onComplete, lastUpdate }) {
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
