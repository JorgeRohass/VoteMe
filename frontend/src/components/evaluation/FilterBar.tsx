import type { GroupStatus } from '../../types/evaluation'

export interface FilterBarProps {
  activeFilter: 'all' | GroupStatus
  onFilterChange: (filter: 'all' | GroupStatus) => void
}

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="filter-row" role="tablist" aria-label="Filtro grupos">
      <button
        type="button"
        className={activeFilter === 'all' ? 'is-active' : ''}
        onClick={() => onFilterChange('all')}
      >
        Todos
      </button>
      <button
        type="button"
        className={activeFilter === 'presented' ? 'is-active' : ''}
        onClick={() => onFilterChange('presented')}
      >
        Presentados
      </button>
      <button
        type="button"
        className={activeFilter === 'pending' ? 'is-active' : ''}
        onClick={() => onFilterChange('pending')}
      >
        Pendientes
      </button>
    </div>
  )
}
