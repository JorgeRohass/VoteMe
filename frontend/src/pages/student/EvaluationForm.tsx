import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiUrl } from '../../utils/api'

interface SubCriterio {
  nombre: string
  puntaje: number | string
}

interface Criterio {
  id_criterio: number
  nombre: string
  descripcion: string | null
  ponderacion: number
  tipo_escala: string
  valor_maximo: number
  subcriterios?: SubCriterio[]
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

export function EvaluationForm() {
  const { codigo } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [criterios, setCriterios] = useState<Criterio[]>([])
  const [respuestas, setRespuestas] = useState<{ [key: number]: { valor: number, comentario: string } }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [nombreEvaluador, setNombreEvaluador] = useState('')
  const [rutEvaluador, setRutEvaluador] = useState('')

  useEffect(() => {
    if (!codigo) {
      setError('Código no proporcionado')
      setLoading(false)
      return
    }

    const loadSession = async () => {
      try {
        const sesionRes = await fetch(apiUrl(`/evaluaciones/sesiones/${codigo}`))
        const sesionData = await sesionRes.json()
        
        if (!sesionRes.ok) {
          setError(sesionData.error || 'Sesión no encontrada')
          setLoading(false)
          return
        }

        setSesion(sesionData)

        const criteriosRes = await fetch(apiUrl(`/evaluaciones/${sesionData.id_evaluacion}/criterios`))
        const criteriosData = await criteriosRes.json()
        
        if (criteriosRes.ok) {
          setCriterios(criteriosData)
        }

        setLoading(false)
      } catch (err) {
        setError('Error de conexión')
        setLoading(false)
      }
    }

    loadSession()
  }, [codigo])

  const handleRespuestaChange = (criterioId: number, field: 'valor' | 'comentario', value: string | number) => {
    setRespuestas(prev => ({
      ...prev,
      [criterioId]: {
        ...prev[criterioId],
        [field]: value
      }
    }))
  }

  const handleSubcriterioSelect = (criterio: Criterio, subcriterio: SubCriterio) => {
    const puntaje = typeof subcriterio.puntaje === 'number' ? subcriterio.puntaje : Number(subcriterio.puntaje) || 0
    handleRespuestaChange(criterio.id_criterio, 'valor', puntaje)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!sesion) return

    // Validar que todos los criterios tengan valor
    const missingCriterios = criterios.filter(c => !respuestas[c.id_criterio]?.valor)
    if (missingCriterios.length > 0) {
      setError('Por favor completa todos los criterios de evaluación')
      return
    }

    try {
      const respuestasArray = criterios.map(c => ({
        id_criterio: c.id_criterio,
        valor_asignado: respuestas[c.id_criterio]?.valor || 0,
        comentario: respuestas[c.id_criterio]?.comentario || null
      }))

      const res = await fetch(apiUrl('/evaluaciones/respuestas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_sesion: sesion.id_sesion,
          respuestas: respuestasArray,
          nombre_evaluador: nombreEvaluador,
          rut_evaluador: rutEvaluador
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar la evaluación')
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      setError('Error de red')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Cargando evaluación...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#fee', padding: '2rem', borderRadius: '12px', border: '1px solid #fcc' }}>
          <h2 style={{ color: '#c33', margin: '0 0 1rem' }}>Error</h2>
          <p style={{ color: '#666', margin: 0 }}>{error}</p>
          <button 
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#efe', padding: '2rem', borderRadius: '12px', border: '1px solid #cfc' }}>
          <h2 style={{ color: '#3c3', margin: '0 0 1rem' }}>¡Evaluación enviada!</h2>
          <p style={{ color: '#666', margin: 0 }}>Gracias por participar en la evaluación.</p>
          <button 
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 0.5rem', color: '#333' }}>Formulario de Evaluación</h1>
        <p style={{ color: '#666', margin: 0 }}>Código de sesión: <strong>{codigo}</strong></p>
        {sesion && (
          <p style={{ color: '#666', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            Expira: {new Date(sesion.expires_at).toLocaleString()}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#333' }}>Información del Evaluador</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
                Tu Nombre *
              </label>
              <input 
                type="text" 
                value={nombreEvaluador}
                onChange={(e) => setNombreEvaluador(e.target.value)}
                placeholder="Ingresa tu nombre completo"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
                RUT (opcional)
              </label>
              <input 
                type="text" 
                value={rutEvaluador}
                onChange={(e) => setRutEvaluador(e.target.value)}
                placeholder="Ej: 12345678-9"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
          </div>
        </div>
        {criterios.map(criterio => (
          <div key={criterio.id_criterio} style={{ 
            padding: '1.5rem', 
            borderRadius: '12px', 
            backgroundColor: 'white', 
            border: '1px solid #eee',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#333' }}>{criterio.nombre}</h3>
              {criterio.descripcion && (
                <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>{criterio.descripcion}</p>
              )}
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
                Ponderación: <strong>{criterio.ponderacion}%</strong> | 
                Escala: 0 - {criterio.valor_maximo}
              </div>
            </div>

            {Array.isArray(criterio.subcriterios) && criterio.subcriterios.length > 0 ? (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
                  Selecciona un subcriterio
                </label>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {criterio.subcriterios.map((sub, index) => {
                    const puntaje = typeof sub.puntaje === 'number' ? sub.puntaje : Number(sub.puntaje) || 0
                    return (
                      <button
                        key={`${criterio.id_criterio}-${index}`}
                        type="button"
                        onClick={() => handleSubcriterioSelect(criterio, sub)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: respuestas[criterio.id_criterio]?.valor === puntaje ? '2px solid #1976d2' : '1px solid #ccc',
                          backgroundColor: respuestas[criterio.id_criterio]?.valor === puntaje ? '#e7f5ff' : 'white',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        {sub.nombre} — {puntaje}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
                  Calificación (0 - {criterio.valor_maximo})
                </label>
                <input 
                  type="number" 
                  min="0"
                  max={criterio.valor_maximo}
                  step="0.1"
                  value={respuestas[criterio.id_criterio]?.valor || ''}
                  onChange={(e) => handleRespuestaChange(criterio.id_criterio, 'valor', parseFloat(e.target.value) || 0)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    border: '1px solid #ccc',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
                Comentario (opcional)
              </label>
              <textarea 
                value={respuestas[criterio.id_criterio]?.comentario || ''}
                onChange={(e) => handleRespuestaChange(criterio.id_criterio, 'comentario', e.target.value)}
                placeholder="Agrega un comentario sobre este criterio..."
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  border: '1px solid #ccc',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        ))}

        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#fee', borderRadius: '8px', border: '1px solid #fcc', color: '#c33' }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          style={{ 
            padding: '1rem 2rem', 
            backgroundColor: '#2b8a3e', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '1.1rem',
            alignSelf: 'center'
          }}
        >
          Enviar Evaluación
        </button>
      </form>
    </div>
  )
}
