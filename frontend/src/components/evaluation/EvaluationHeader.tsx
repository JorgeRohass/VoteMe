export interface EvaluationHeaderProps {
  title: string
  course: string
  section: string
  description: string
}

export function EvaluationHeader({
  title,
  course,
  section,
  description,
}: EvaluationHeaderProps) {
  return (
    <header className="prof-header">
      <div className="prof-header-left">
        <p className="eyebrow">Panel profesor</p>
        <h1>{title}</h1>
        <p className="subtitle">
          Curso {course} | Seccion {section} | {description}
        </p>
      </div>

      <div className="prof-header-actions">
        <button type="button" className="action-btn edit-btn" aria-label="Editar evaluación">
          Editar evaluación
        </button>
      </div>
    </header>
  )
}
