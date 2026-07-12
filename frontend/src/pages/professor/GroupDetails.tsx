import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { groupsSeedData } from '../../data/groups-mock'
import { StudentImportForm } from '../../components/StudentImportForm'
import '../../styles/group-details.css'

export function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const group = groupsSeedData.find((g) => g.id === groupId)
  const [showImportForm, setShowImportForm] = useState(false)

  if (!group) {
    return (
      <div className="details-page">
        <div className="details-container">
          <div className="error-message">
            <h2>Grupo no encontrado</h2>
            <button onClick={() => navigate('/')} className="btn-back">
              Volver a evaluacion
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="details-page">
      <div className="details-container">
        <header className="details-header">
          <div>
            <p className="eyebrow">Panel profesor</p>
            <h1>{group.name}</h1>
            <p className="group-id-detail">{group.id}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-back"
            aria-label="Volver a evaluacion"
            title="Volver a evaluacion"
          >
            ←
          </button>
        </header>

        <div className="group-info-summary">
          <div className="info-card">
            <span className="label">Codigo</span>
            <strong>{group.accessCode}</strong>
          </div>
          <div className="info-card">
            <span className="label">Estado</span>
            <strong className={group.status === 'presented' ? 'status-ok' : 'status-pending'}>
              {group.status === 'presented' ? 'Presentado' : 'Pendiente'}
            </strong>
          </div>
          {group.score !== null && (
            <div className="info-card">
              <span className="label">Calificación Grupal</span>
              <strong className="score">{group.score.toFixed(1)}</strong>
            </div>
          )}
          <div className="info-card">
            <span className="label">Votos Totales</span>
            <strong>{group.votes}</strong>
          </div>
          {group.startedAt && (
            <div className="info-card">
              <span className="label">Iniciado en</span>
              <strong>{group.startedAt}</strong>
            </div>
          )}
          <div className="info-card">
            <button
              onClick={() => setShowImportForm(!showImportForm)}
              className="btn-import-toggle"
              title="Importar estudiantes desde Excel"
            >
              {showImportForm ? '✕ Cerrar' : '+ Importar Estudiantes'}
            </button>
          </div>
        </div>

        {showImportForm && (
          <StudentImportForm
            groupId={groupId || ''}
            onImportSuccess={() => {
              setShowImportForm(false)
            }}
          />
        )}

        {group.participants && group.participants.length > 0 && (
          <section className="participants-section">
            <h2>Calificaciones por Participante</h2>
            <div className="participants-grid">
              {group.participants.map((participant) => (
                <article className="participant-card" key={participant.id}>
                  <div className="participant-header">
                    <h3>{participant.name}</h3>
                  </div>
                  <div className="participant-score-display">
                    <div className="score-value">{participant.score.toFixed(1)}</div>
                    <div className="score-context">
                      <span className="rater-count">{participant.raterCount} evaluador{participant.raterCount !== 1 ? 'es' : ''}</span>
                    </div>
                  </div>
                  <div className="raters-list">
                    <strong className="raters-label">Evaluadores:</strong>
                    <ul>
                      {participant.raters.map((rater, idx) => (
                        <li key={idx}>{rater}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {(!group.participants || group.participants.length === 0) && (
          <section className="participants-section">
            <div className="empty-state">
              <p>No hay calificaciones disponibles para este grupo aún.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
