import { useNavigate } from 'react-router-dom'
import type { Group } from '../../types/evaluation'
import { FilterBar } from './FilterBar'

export interface GroupsTableProps {
  groups: Group[]
  filter: 'all' | 'presented' | 'pending'
  activeCodeGroup: string | null
  onFilterChange: (filter: 'all' | 'presented' | 'pending') => void
  onGenerateCode: (groupId: string) => void
}

export function GroupsTable({
  groups,
  filter,
  activeCodeGroup,
  onFilterChange,
  onGenerateCode,
}: GroupsTableProps) {
  const navigate = useNavigate()

  const handleCardClick = (groupId: string) => {
    navigate(`/group/${groupId}`)
  }

  return (
    <section className="groups-panel" aria-label="Listado de grupos">
      <div className="panel-head">
        <h2>Grupos inscritos en la evaluacion</h2>
        <FilterBar activeFilter={filter} onFilterChange={onFilterChange} />
      </div>

      <div className="groups-grid">
        {groups.map((group) => (
          <article 
            className="group-card" 
            key={group.id} 
            aria-labelledby={`grp-${group.id}`}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(group.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleCardClick(group.id)
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-head">
              <div className="group-title">
                <strong id={`grp-${group.id}`}>{group.name}</strong>
                <span className="group-id">{group.id}</span>
              </div>
              <div>
                <span className={`tag ${group.status === 'presented' ? 'ok' : 'wait'}`}>
                  {group.status === 'presented' ? 'Presentado' : 'Sin presentar'}
                </span>
              </div>
            </div>

            <div className="card-body">
              <div className="presenter">Expositor(es): {group.presenter}</div>
              <div className="metrics">
                <div className="metric">
                  <div className="label">Nota</div>
                  <div className="value">{group.score ? group.score.toFixed(1) : '-'}</div>
                </div>
                <div className="metric">
                  <div className="label">Votos</div>
                  <div className="value">{group.votes}</div>
                </div>
              </div>

              <div className="code-area">
                <div className="code">{group.accessCode ?? '—'}</div>
                <small className="code-meta">{group.startedAt ? `Inicio: ${group.startedAt}` : 'Aun no iniciado'}</small>
              </div>
            </div>

            <div className="card-actions">
              <button
                type="button"
                className={activeCodeGroup === group.id ? 'action-btn is-success' : 'action-btn'}
                onClick={(e) => {
                  e.stopPropagation()
                  onGenerateCode(group.id)
                }}
              >
                {group.accessCode ? 'Regenerar codigo' : 'Generar codigo'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
