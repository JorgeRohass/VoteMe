import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EvaluationHeader } from '../../components/evaluation/EvaluationHeader'
import { apiUrl } from '../../utils/api'
import '../../styles/evaluation.css'

interface Curso {
  id_ramo: number
  nombre: string
  descripcion: string | null
  creditos: number | null
}

export function EvaluationDetail() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [creditos, setCreditos] = useState('3')
  const [creando, setCreando] = useState(false)

  const navigate = useNavigate()
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null

  const fetchCursos = async () => {
    if (!user?.id) {
      setError('No se encontró el usuario. Vuelve a iniciar sesión.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(apiUrl(`/ramos?id_profesor=${user.id}`))
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No se pudieron cargar las asignaturas')
      } else {
        setCursos(data)
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCursos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user?.id) {
      setError('No se encontró el usuario. Vuelve a iniciar sesión.')
      return
    }

    setError(null)
    setCreando(true)

    try {
      const creditosNumber = creditos !== '' ? Number(creditos) : null
      const response = await fetch(apiUrl('/ramos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          creditos: creditosNumber,
          id_profesor: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No se pudo crear la asignatura')
      } else {
        setNombre('')
        setDescripcion('')
        setCreditos('3')
        setCursos((prev) => [...prev, data])
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="prof-view" style={{ padding: '1.5rem' }}>
      <div className="header" style={{ marginBottom: '2rem' }}>
        <EvaluationHeader
          title="Mis asignaturas"
          course="Panel profesor"
          section=""
          description="Revisa tus ramos y crea nuevas asignaturas para tu curso."
        />
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <section style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginBottom: '1rem' }}>Crear asignatura</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ced4da' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ced4da' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Créditos</label>
              <input
                type="number"
                min="0"
                value={creditos}
                onChange={(e) => setCreditos(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ced4da' }}
              />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button
              type="submit"
              disabled={creando}
              style={{ padding: '0.85rem 1rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              {creando ? 'Creando...' : 'Crear asignatura'}
            </button>
          </form>
        </section>

        <section style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2>Asignaturas</h2>
            <span style={{ color: '#555' }}>{cursos.length} ramos</span>
          </div>

          {loading ? (
            <p>Cargando asignaturas...</p>
          ) : cursos.length === 0 ? (
            <p>No tienes asignaturas aún. Crea una para comenzar.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {cursos.map((curso) => (
                <div key={curso.id_ramo} style={{ padding: '1rem', borderRadius: '10px', border: '1px solid #e0e0e0', backgroundColor: '#fafbff' }}>
                  <h3 style={{ margin: 0 }}>{curso.nombre}</h3>
                  <p style={{ margin: '0.5rem 0 0', color: '#555' }}>{curso.descripcion || 'Sin descripción'}</p>
                  <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.95rem' }}>Créditos: {curso.creditos ?? 'N/A'}</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/profesor/ramo/${curso.id_ramo}`)}
                    style={{
                      marginTop: '1rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #1976d2',
                      backgroundColor: '#ffffff',
                      color: '#1976d2',
                      cursor: 'pointer'
                    }}
                  >
                    Ver ramo
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
