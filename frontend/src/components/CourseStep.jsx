export default function CourseStep({ pathways, hasCourses, choosePathway, onBack }) {
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
