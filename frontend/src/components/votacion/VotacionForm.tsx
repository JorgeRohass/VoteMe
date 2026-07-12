import { useState } from 'react'
import { CriterioSlider } from './CriterioSlider'
import './votacion.css'

export interface Criterio {
  id: string
  nombre: string
}

interface VotacionFormProps {
  criterios: Criterio[]
  rangoMin: number
  rangoMax: number
  nombreUsuario: string
  onEnviar: (votos: Record<string, number>, comentarios: string) => void
}

export function VotacionForm({ criterios, rangoMin, rangoMax, nombreUsuario, onEnviar }: VotacionFormProps) {
  const [votos, setVotos] = useState<Record<string, number>>(() => {
    const inicial: Record<string, number> = {}
    criterios.forEach((c) => {
      inicial[c.id] = rangoMin
    })
    return inicial
  })
  const [comentarios, setComentarios] = useState('')

  const handleVotoChange = (criterioId: string, valor: number) => {
    setVotos((prev) => ({ ...prev, [criterioId]: valor }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEnviar(votos, comentarios)
  }

  const todosVotados = criterios.every((c) => votos[c.id] !== undefined)

  return (
    <div className="votacion-container">
      <div className="votacion-header">
        <h1 className="votacion-titulo">Evaluar Presentación</h1>
        <p className="votacion-usuario">Evaluador: {nombreUsuario}</p>
      </div>

      <form onSubmit={handleSubmit} className="votacion-form">
        <div className="criterios-section">
          <h2 className="section-title">Criterios de evaluación</h2>
          {criterios.map((criterio) => (
            <CriterioSlider
              key={criterio.id}
              nombre={criterio.nombre}
              valor={votos[criterio.id] ?? rangoMin}
              min={rangoMin}
              max={rangoMax}
              onChange={(valor) => handleVotoChange(criterio.id, valor)}
            />
          ))}
        </div>

        <div className="comentarios-section">
          <h2 className="section-title">Comentarios (opcional)</h2>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Escribe tus comentarios sobre la presentación..."
            className="comentarios-input"
            rows={4}
          />
        </div>

        <button type="submit" className="btn-enviar" disabled={!todosVotados}>
          Enviar Voto
        </button>
      </form>
    </div>
  )
}