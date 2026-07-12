import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiUrl } from '../../utils/api'

interface Criterio {
  id_criterio: number
  nombre: string
  descripcion: string | null
  ponderacion: number
  tipo_escala: string
  valor_maximo: number
}

interface Sesion {
  id_sesion: number
  codigo: string
  estado: string
  created_at: string
  expires_at: string
  id_grupo: number
  id_evaluacion: number
}

interface EvaluacionGrupo {
  id_evaluacion_grupo: number
  id_evaluacion: number
  id_grupo: number
  estado: string
  nota_final: number | null
  respuestas?: any[]
}

interface Evaluacion {
  id_evaluacion: number
  titulo: string
  descripcion: string | null
  tipo: string
  fecha_inicio: string
  fecha_fin: string
}

interface Grupo {
  id_grupo: number
  nombre: string
  descripcion: string | null
}

export function GroupEvaluationView() {
  const { evaluacionId, grupoId } = useParams<{ evaluacionId: string, grupoId: string }>()
  const navigate = useNavigate()
  
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null)
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [criterios, setCriterios] = useState<Criterio[]>([])
  const [evaluacionGrupo, setEvaluacionGrupo] = useState<EvaluacionGrupo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if (!evaluacionId || !grupoId) {
      setError('IDs no proporcionados')
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Cargando datos para evaluacion:', evaluacionId, 'grupo:', grupoId)
        
        // Cargar evaluación
        const evalRes = await fetch(apiUrl(`/evaluaciones/${evaluacionId}`))
        if (evalRes.ok) {
          const evalData = await evalRes.json()
          setEvaluacion(evalData)
          console.log('Evaluación cargada:', evalData)
        } else {
          const errorData = await evalRes.json()
          setError(errorData.error || 'No se pudo cargar la evaluación')
          console.error('Error cargando evaluación:', errorData)
          setLoading(false)
          return
        }

        // Cargar grupo
        const grupoRes = await fetch(apiUrl(`/groups/${grupoId}`))
        if (grupoRes.ok) {
          const grupoData = await grupoRes.json()
          setGrupo(grupoData)
          console.log('Grupo cargado:', grupoData)
        } else {
          const errorData = await grupoRes.json()
          setError(errorData.error || 'No se pudo cargar el grupo')
          console.error('Error cargando grupo:', errorData)
          setLoading(false)
          return
        }

        // Cargar criterios
        const criteriosRes = await fetch(apiUrl(`/evaluaciones/${evaluacionId}/criterios`))
        if (criteriosRes.ok) {
          const criteriosData = await criteriosRes.json()
          setCriterios(criteriosData)
          console.log('Criterios cargados:', criteriosData)
        }

        // Cargar evaluación-grupo (esto puede fallar si no existe, no es crítico)
        const evalGrupoRes = await fetch(apiUrl(`/evaluaciones/grupo/${grupoId}/evaluacion/${evaluacionId}/resultados`))
        if (evalGrupoRes.ok) {
          const evalGrupoData = await evalGrupoRes.json()
          setEvaluacionGrupo(evalGrupoData)
          console.log('Evaluación-grupo cargada:', evalGrupoData)
        } else {
          console.log('Evaluación-grupo no encontrada, creando relación...')
          // Crear la relación automáticamente si no existe
          try {
            const linkRes = await fetch(apiUrl('/evaluaciones/link'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id_evaluacion: parseInt(evaluacionId),
                id_grupo: parseInt(grupoId)
              })
            })
            if (linkRes.ok) {
              const linkData = await linkRes.json()
              setEvaluacionGrupo(linkData)
              console.log('Relación creada:', linkData)
            }
          } catch (err) {
            console.error('Error creando relación:', err)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Error en loadData:', err)
        setError('Error de conexión')
        setLoading(false)
      }
    }

    loadData()
  }, [evaluacionId, grupoId])

  useEffect(() => {
    if (sesion && sesion.expires_at) {
      const updateTimer = () => {
        const now = new Date()
        const expires = new Date(sesion.expires_at)
        const diff = expires.getTime() - now.getTime()
        setTimeLeft(Math.max(0, Math.floor(diff / 1000)))
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [sesion])

  const handleGenerateCode = async () => {
    if (!evaluacionId || !grupoId) return

    try {
      setError(null)
      const res = await fetch(apiUrl('/evaluaciones/sesiones'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_evaluacion: parseInt(evaluacionId),
          id_grupo: parseInt(grupoId)
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo generar el código')
      } else {
        setSesion(data)
        // Recargar resultados después de generar código
        loadResults()
      }
    } catch (err) {
      setError('Error de red')
    }
  }

  const loadResults = async () => {
    if (!evaluacionId || !grupoId) return

    try {
      const res = await fetch(apiUrl(`/evaluaciones/grupo/${grupoId}/evaluacion/${evaluacionId}/resultados`))
      if (res.ok) {
        const data = await res.json()
        setEvaluacionGrupo(data)
      }
    } catch (err) {
      console.error('Error loading results:', err)
    }
  }

  const handleCalculateGrade = async () => {
    if (!evaluacionId || !grupoId) return

    try {
      setError(null)
      const res = await fetch(apiUrl(`/evaluaciones/grupo/${grupoId}/evaluacion/${evaluacionId}/calcular`))
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'No se pudo calcular la nota')
      } else {
        setEvaluacionGrupo(prev => prev ? { ...prev, nota_final: data.nota_final } : null)
        alert(`Nota final calculada: ${data.nota_final.toFixed(2)}`)
      }
    } catch (err) {
      setError('Error de red')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <h2>Cargando...</h2>
      </div>
    )
  }

  if (error && !evaluacion && !grupo) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#fee', padding: '2rem', borderRadius: '12px', border: '1px solid #fcc' }}>
          <h2 style={{ color: '#c33', margin: '0 0 1rem' }}>Error</h2>
          <p style={{ color: '#666', margin: 0 }}>{error}</p>
          <button 
            onClick={() => navigate('/profesor')}
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/profesor')}
        style={{ marginBottom: '1.5rem', background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <span>←</span> Volver
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem', color: '#333' }}>
          {evaluacion?.titulo} - {grupo?.nombre}
        </h1>
        {evaluacion?.descripcion && (
          <p style={{ color: '#666', margin: '0 0 1rem' }}>{evaluacion.descripcion}</p>
        )}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#888' }}>
          <span>Estado: <strong>{evaluacionGrupo?.estado || 'pendiente'}</strong></span>
          {evaluacionGrupo?.nota_final !== null && evaluacionGrupo?.nota_final !== undefined && (
            <span>Nota final: <strong>{Number(evaluacionGrupo.nota_final).toFixed(2)}</strong></span>
          )}
        </div>
      </div>

      {/* Criterios configurados */}
      <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Criterios de Evaluación</h2>
        {criterios.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '1rem 0' }}>No hay criterios configurados.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {criterios.map(c => (
              <div key={c.id_criterio} style={{ padding: '1rem', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                <strong>{c.nombre}</strong>
                {c.descripcion && <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.9rem' }}>{c.descripcion}</p>}
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
                  Ponderación: {c.ponderacion}% | Escala: 0 - {c.valor_maximo}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Generar código de sesión */}
      <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Evaluación en Vivo</h2>
        
        {!sesion ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#666', marginBottom: '1rem' }}>Genera un código de sesión para que los estudiantes puedan evaluar este grupo.</p>
            <button 
              onClick={handleGenerateCode}
              style={{ padding: '1rem 2rem', backgroundColor: '#2b8a3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              Generar Código de Sesión
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#666', marginBottom: '1rem' }}>Comparte este código con los estudiantes:</p>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold', 
              color: '#1976d2', 
              letterSpacing: '0.5rem',
              padding: '1.5rem',
              backgroundColor: '#e7f5ff',
              borderRadius: '12px',
              marginBottom: '1rem',
              border: '3px solid #a5d8ff'
            }}>
              {sesion.codigo}
            </div>
            <div style={{ fontSize: '1.2rem', color: timeLeft < 300 ? '#dc3545' : '#666', marginBottom: '1rem' }}>
              Tiempo restante: <strong>{formatTime(timeLeft)}</strong>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>
              Expira: {new Date(sesion.expires_at).toLocaleString()}
            </div>
            <button 
              onClick={handleGenerateCode}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Generar Nuevo Código
            </button>
          </div>
        )}
      </section>

      {/* Calcular nota final */}
      <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: '0 0 1rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Resultados</h2>
        
        {criterios.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '1rem 0' }}>Configura los criterios primero para calcular la nota.</p>
        ) : (
          <div>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Calcula la nota final basada en todas las respuestas recibidas.</p>
              <button 
                onClick={handleCalculateGrade}
                style={{ padding: '1rem 2rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
              >
                Calcular Nota Final
              </button>
            </div>

            {/* Mostrar respuestas recibidas */}
            {evaluacionGrupo?.respuestas && evaluacionGrupo.respuestas.length > 0 && (
              <div style={{ marginTop: '2rem', borderTop: '2px solid #eee', paddingTop: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#333' }}>Respuestas Recibidas</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {evaluacionGrupo.respuestas.map((respuesta: any, index: number) => (
                    <div key={index} style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      backgroundColor: '#fafafa', 
                      border: '1px solid #eee' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>{respuesta.criterio_nombre}</strong>
                        <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{respuesta.valor_asignado}</span>
                      </div>
                      {respuesta.nombre_evaluador && (
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          Evaluador: <strong>{respuesta.nombre_evaluador}</strong>
                          {respuesta.rut_evaluador && <span> (RUT: {respuesta.rut_evaluador})</span>}
                        </div>
                      )}
                      {respuesta.comentario && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                          "{respuesta.comentario}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee', borderRadius: '8px', border: '1px solid #fcc', color: '#c33' }}>
          {error}
        </div>
      )}
    </div>
  )
}
