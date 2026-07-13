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

interface EstudianteGrupo {
  id: number
  nombre: string
  rut: string
  correo?: string
}

export function EvaluationForm() {
  const { codigo } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [criterios, setCriterios] = useState<Criterio[]>([])
  const [estudiantes, setEstudiantes] = useState<EstudianteGrupo[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [respuestas, setRespuestas] = useState<Record<number, Record<number, { valor: number, comentario: string }>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [nombreEvaluador] = useState('')
  const [rutEvaluador] = useState('')

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

        if (sesionData.id_grupo) {
          const estudiantesRes = await fetch(apiUrl(`/students/group/${sesionData.id_grupo}`))
          const estudiantesData = await estudiantesRes.json()
          if (estudiantesRes.ok) {
            setEstudiantes(estudiantesData)
          }
        }

        setLoading(false)
      } catch (err) {
        setError('Error de conexión')
        setLoading(false)
      }
    }

    loadSession()
  }, [codigo])

  useEffect(() => {
    if (!selectedStudentId && estudiantes.length > 0) {
      setSelectedStudentId(estudiantes[0].id)
      return
    }

    if (selectedStudentId && !estudiantes.some((estudiante) => estudiante.id === selectedStudentId)) {
      setSelectedStudentId(estudiantes[0]?.id ?? null)
    }
  }, [estudiantes, selectedStudentId])

  const handleRespuestaChange = (criterioId: number, field: 'valor' | 'comentario', value: string | number) => {
    if (!selectedStudentId) return

    setRespuestas((prev) => ({
      ...prev,
      [selectedStudentId]: {
        ...(prev[selectedStudentId] || {}),
        [criterioId]: {
          ...(prev[selectedStudentId]?.[criterioId] || { valor: 0, comentario: '' }),
          [field]: value,
        },
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!sesion || !selectedStudentId) return

    const estudianteActual = estudiantes.find((estudiante) => estudiante.id === selectedStudentId)
    const respuestasActuales = respuestas[selectedStudentId] || {}

    const missingCriterios = criterios.filter((c) => !respuestasActuales[c.id_criterio]?.valor)
    if (missingCriterios.length > 0) {
      setError('Por favor completa todos los criterios de evaluación')
      return
    }

    try {
      const respuestasArray = criterios.map((c) => ({
        id_criterio: c.id_criterio,
        valor_asignado: respuestasActuales[c.id_criterio]?.valor || 0,
        comentario: respuestasActuales[c.id_criterio]?.comentario || null,
      }))

      const res = await fetch(apiUrl('/evaluaciones/respuestas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_sesion: sesion.id_sesion,
          respuestas: respuestasArray,
          nombre_evaluador: nombreEvaluador,
          rut_evaluador: rutEvaluador,
          nombre_estudiante: estudianteActual?.nombre || null,
          rut_estudiante: estudianteActual?.rut || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar la evaluación')
      } else {
        setSuccessMessage(`Evaluación enviada para ${estudianteActual?.nombre || 'el estudiante seleccionado'}.`)
        setRespuestas((prev) => ({
          ...prev,
          [selectedStudentId]: {},
        }))

        const currentIndex = estudiantes.findIndex((estudiante) => estudiante.id === selectedStudentId)
        const nextStudent = estudiantes[currentIndex + 1]
        if (nextStudent) {
          setSelectedStudentId(nextStudent.id)
        }
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, Roboto, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.35rem', color: '#6366f1', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
          Rúbrica de evaluación oral
        </p>
        <h1 style={{ margin: 0, color: '#111827', fontSize: '1.8rem' }}>Evalúa la exposición con rapidez y claridad</h1>
        <p style={{ color: '#6b7280', margin: '0.4rem 0 0' }}>Código de sesión: <strong>{codigo}</strong></p>
        {sesion && (
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Expira: {new Date(sesion.expires_at).toLocaleString()}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 300px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <aside style={{ position: 'sticky', top: '1rem' }}>
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '18px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '999px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {selectedStudentId ? (estudiantes.find((estudiante) => estudiante.id === selectedStudentId)?.nombre?.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase() || 'ES') : 'ES'}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estudiante a evaluar</p>
                  <h3 style={{ margin: '0.2rem 0 0', color: '#111827', fontSize: '1.05rem' }}>
                    {estudiantes.find((estudiante) => estudiante.id === selectedStudentId)?.nombre || 'Cargando estudiantes...'}
                  </h3>
                </div>
              </div>

              <div style={{ background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: '14px', padding: '0.9rem', marginBottom: '0.9rem' }}>
                <p style={{ margin: 0, color: '#4f46e5', fontWeight: 700, fontSize: '0.9rem' }}>Exposición oral</p>
                <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.92rem' }}>Grupo • Evaluación individual</p>
              </div>

              <div style={{ display: 'grid', gap: '0.6rem' }}>
                <div style={{ padding: '0.7rem 0.8rem', borderRadius: '10px', background: '#f9fafb', color: '#374151', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#111827' }}>Puntajes:</strong> 7, 5, 3, 1
                </div>
                <div style={{ padding: '0.7rem 0.8rem', borderRadius: '10px', background: '#f9fafb', color: '#374151', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#111827' }}>Modo:</strong> selección rápida por criterio
                </div>
              </div>

              {estudiantes.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem', color: '#374151', fontSize: '0.9rem', fontWeight: 700 }}>Otros estudiantes del grupo</p>
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    {estudiantes.map((estudiante) => {
                      const active = estudiante.id === selectedStudentId
                      return (
                        <button
                          key={estudiante.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(estudiante.id)
                            setError(null)
                            setSuccessMessage(null)
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '0.7rem 0.8rem',
                            borderRadius: '10px',
                            border: active ? '1px solid #4f46e5' : '1px solid #e5e7eb',
                            backgroundColor: active ? '#eef2ff' : '#fff',
                            color: active ? '#4338ca' : '#374151',
                            cursor: 'pointer',
                            fontWeight: active ? 700 : 500,
                          }}
                        >
                          {estudiante.nombre}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {criterios.map((criterio) => {
              const options = Array.isArray(criterio.subcriterios) && criterio.subcriterios.length > 0
                ? criterio.subcriterios.map((sub) => ({
                    valor: typeof sub.puntaje === 'number' ? sub.puntaje : Number(sub.puntaje) || 0,
                    descripcion: sub.nombre,
                  }))
                : [
                    { valor: 7, descripcion: 'Excelente' },
                    { valor: 5, descripcion: 'Bueno' },
                    { valor: 3, descripcion: 'Aceptable' },
                    { valor: 1, descripcion: 'Insuficiente' },
                  ]

              return (
                <div key={criterio.id_criterio} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)', padding: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1fr', gap: '1rem', alignItems: 'stretch' }}>
                    <div style={{ background: '#14213d', color: 'white', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem' }}>{criterio.nombre}</h3>
                      {criterio.descripcion && (
                        <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.4 }}>{criterio.descripcion}</p>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(90px, 1fr))', gap: '0.75rem' }}>
                      {options.map((option) => {
                        const selected = Number(respuestas[selectedStudentId || 0]?.[criterio.id_criterio]?.valor) === option.valor
                        return (
                          <button
                            key={`${criterio.id_criterio}-${option.valor}`}
                            type="button"
                            onClick={() => handleRespuestaChange(criterio.id_criterio, 'valor', option.valor)}
                            style={{
                              border: selected ? '2px solid #4f46e5' : '1px solid #dbe4ff',
                              backgroundColor: selected ? '#eef2ff' : '#f8fafc',
                              borderRadius: '12px',
                              padding: '0.8rem 0.6rem',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: selected ? '0 6px 16px rgba(79, 70, 229, 0.15)' : 'none',
                            }}
                          >
                            <div style={{ color: '#111827', fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{option.valor}</div>
                            <div style={{ color: '#4b5563', fontSize: '0.8rem', lineHeight: 1.3 }}>{option.descripcion}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.9rem' }}>
                    <textarea
                      value={respuestas[selectedStudentId || 0]?.[criterio.id_criterio]?.comentario || ''}
                      onChange={(e) => handleRespuestaChange(criterio.id_criterio, 'comentario', e.target.value)}
                      placeholder="Agregar comentario opcional"
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        minHeight: '70px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#fee', borderRadius: '10px', border: '1px solid #fcc', color: '#c33' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#effdf5', borderRadius: '10px', border: '1px solid #b7f0c8', color: '#17663b' }}>
            {successMessage}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button
            type="submit"
            style={{
              padding: '0.95rem 1.6rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)',
            }}
          >
            Enviar evaluación
          </button>
        </div>
      </form>
    </div>
  )
}
