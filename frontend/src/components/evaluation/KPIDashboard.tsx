import type { DashboardMetrics } from '../../types/evaluation'

export interface KPIDashboardProps {
  metrics: DashboardMetrics
}

export function KPIDashboard({ metrics }: KPIDashboardProps) {
  return (
    <section className="kpi-grid" aria-label="Resumen de evaluacion">
      <article className="kpi-card">
        <p>Total grupos</p>
        <strong>{metrics.totalGroups}</strong>
      </article>
      <article className="kpi-card">
        <p>Ya presentaron</p>
        <strong>{metrics.presentedCount}</strong>
      </article>
      <article className="kpi-card">
        <p>Pendientes</p>
        <strong>{metrics.pendingCount}</strong>
      </article>
      <article className="kpi-card">
        <p>Promedio evaluacion</p>
        <strong>{metrics.averageScore.toFixed(1)}</strong>
      </article>
      <article className="kpi-card">
        <p>Votos registrados</p>
        <strong>{metrics.totalVotes}</strong>
      </article>
    </section>
  )
}
