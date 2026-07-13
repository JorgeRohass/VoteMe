import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EvaluationHeader } from '../../components/evaluation/EvaluationHeader'
import { ImportStudentsModal } from '../../components/ImportStudentsModal'
import { apiUrl } from '../../utils/api'
import '../../styles/evaluation.css'

interface Ramo {
  id_ramo: number
  nombre: string
  descripcion: string | null
  creditos: number | null
  id_profesor: number
}

interface Student {
  id: number
  rut: string
  name: string
  email: string
  fecha_inscripcion: string
  estado: string
}

interface Group {
  id_grupo: number
  nombre: string
  descripcion: string | null
  id_evaluacion: number | null
  id_ramo: number | null
  max_alumnos: number
  alumnos?: { id: number, name: string, email: string }[]
}

interface Evaluation {
  id_evaluacion: number
  titulo: string
  descripcion: string | null
  tipo: string
  fecha_inicio: string
  fecha_fin: string
}

interface SubCriterioDraft {
  nombre: string
  puntaje: string
}

interface CriterioDraft {
  nombre: string
  descripcion: string
  valor_maximo: string
  subcriterios: SubCriterioDraft[]
}

interface CriterioEvaluacion {
  id_criterio: number
  nombre: string
  descripcion: string | null
  ponderacion: string | number
  tipo_escala: string
  valor_maximo: number
  id_evaluacion: number
  subcriterios?: Array<{ nombre: string; puntaje: string | number }>
}

export function RamoDetails() {
  const { ramoId } = useParams<{ ramoId: string }>()
  const navigate = useNavigate()
  
  const [ramo, setRamo] = useState<Ramo | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [evaluaciones, setEvaluaciones] = useState<Evaluation[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [allUsers, setAllUsers] = useState<any[]>([])

  // Student Form states
  const [studentIdentifier, setStudentIdentifier] = useState('')
  const [addStudentError, setAddStudentError] = useState<string | null>(null)
  const [addStudentSuccess, setAddStudentSuccess] = useState<string | null>(null)

  // Group Form states
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupMaxAlumnos, setNewGroupMaxAlumnos] = useState('')
  const [newGroupStudents, setNewGroupStudents] = useState<number[]>([])
  const [addGroupError, setAddGroupError] = useState<string | null>(null)

  // Evaluation states
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false)
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null)
  
  const [newEvalTitle, setNewEvalTitle] = useState('')
  const [newEvalDesc, setNewEvalDesc] = useState('')
  const [newEvalDate, setNewEvalDate] = useState('')
  const [newEvalCriterios, setNewEvalCriterios] = useState<CriterioDraft[]>([{ nombre: '', descripcion: '', valor_maximo: '7', subcriterios: [{ nombre: '', puntaje: '7' }] }])
  const [addEvalError, setAddEvalError] = useState<string | null>(null)

  // Criterios de evaluación
  const [isCriteriosModalOpen, setIsCriteriosModalOpen] = useState(false)
  const [criterios, setCriterios] = useState<CriterioDraft[]>([{ nombre: '', descripcion: '', valor_maximo: '7', subcriterios: [{ nombre: '', puntaje: '7' }] }])
  const [selectedEvalCriterios, setSelectedEvalCriterios] = useState<CriterioEvaluacion[]>([])
  const [criteriosLoading, setCriteriosLoading] = useState(false)
  const [criteriosError, setCriteriosError] = useState<string | null>(null)

  // Import students modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const loadData = async () => {
    if (!ramoId) {
      setError('Id de ramo no encontrado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [ramoRes, studentsRes, groupsRes, usersRes, evalsRes] = await Promise.all([
        fetch(apiUrl(`/ramos/${ramoId}`)),
        fetch(apiUrl(`/ramos/${ramoId}/students`)),
        fetch(apiUrl(`/ramos/${ramoId}/groups`)),
        fetch(apiUrl('/auth/users')),
        fetch(apiUrl(`/ramos/${ramoId}/evaluaciones`))
      ])

      const ramoData = await ramoRes.json()
      if (!ramoRes.ok) throw new Error(ramoData.error || 'No se pudo cargar el ramo')
      setRamo(ramoData)

      if (studentsRes.ok) setStudents(await studentsRes.json())
      if (groupsRes.ok) setGroups(await groupsRes.json())
      if (usersRes.ok) setAllUsers(await usersRes.json())
      
      if (evalsRes.ok) {
        const evalsData = await evalsRes.json()
        setEvaluaciones(evalsData)
        if (evalsData.length > 0 && selectedEvalId === null) {
          setSelectedEvalId(evalsData[0].id_evaluacion)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ramoId])

  useEffect(() => {
    if (!selectedEvalId) {
      setSelectedEvalCriterios([])
      return
    }

    const loadCriterios = async () => {
      try {
        setCriteriosLoading(true)
        const res = await fetch(apiUrl(`/evaluaciones/${selectedEvalId}/criterios`))
        const data = await res.json()

        if (res.ok) {
          setSelectedEvalCriterios(data)
        } else {
          setSelectedEvalCriterios([])
        }
      } catch (err) {
        setSelectedEvalCriterios([])
      } finally {
        setCriteriosLoading(false)
      }
    }

    loadCriterios()
  }, [selectedEvalId])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddStudentError(null)
    setAddStudentSuccess(null)

    try {
      const res = await fetch(apiUrl(`/ramos/${ramoId}/students`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: studentIdentifier })
      })
      const data = await res.json()
      if (!res.ok) {
        setAddStudentError(data.error || 'No se pudo agregar al alumno')
      } else {
        setAddStudentSuccess('Alumno agregado correctamente')
        setStudentIdentifier('')
        loadData()
      }
    } catch (err) {
      setAddStudentError('Error de red')
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddGroupError(null)

    try {
      const res = await fetch(apiUrl(`/ramos/${ramoId}/groups`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: newGroupName, 
          descripcion: newGroupDesc,
          max_alumnos: newGroupMaxAlumnos,
          alumnos: newGroupStudents
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setAddGroupError(data.error || 'No se pudo crear el grupo')
      } else {
        setNewGroupName('')
        setNewGroupDesc('')
        setNewGroupMaxAlumnos('')
        setNewGroupStudents([])
        loadData()
      }
    } catch (err) {
      setAddGroupError('Error de red')
    }
  }

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddEvalError(null)

    const criteriosValidos = newEvalCriterios
      .map(c => ({
        nombre: c.nombre.trim(),
        descripcion: c.descripcion.trim(),
        valor_maximo: c.valor_maximo.trim() || '7',
        subcriterios: c.subcriterios
          .map(sc => ({ nombre: sc.nombre.trim(), puntaje: sc.puntaje.trim() || '0' }))
          .filter(sc => sc.nombre)
      }))
      .filter(c => c.nombre)

    if (criteriosValidos.length === 0) {
      setAddEvalError('Debes agregar al menos un criterio con nombre')
      return
    }

    try {
      // Como simplificación, usamos la misma fecha para inicio y fin
      const res = await fetch(apiUrl(`/ramos/${ramoId}/evaluaciones`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titulo: newEvalTitle, 
          descripcion: newEvalDesc,
          fecha_inicio: newEvalDate,
          fecha_fin: newEvalDate,
          tipo: 'grupal'
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setAddEvalError(data.error || 'No se pudo crear la evaluación')
      } else {
        const criteriosRes = await fetch(apiUrl(`/evaluaciones/${data.id_evaluacion}/criterios`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ criterios: criteriosValidos })
        })
        const criteriosData = await criteriosRes.json()

        if (!criteriosRes.ok) {
          setAddEvalError(criteriosData.error || 'La evaluación se creó, pero no se pudieron guardar los criterios')
          return
        }

        setSelectedEvalCriterios(criteriosData.criterios || [])
        setNewEvalTitle('')
        setNewEvalDesc('')
        setNewEvalDate('')
        setNewEvalCriterios([{ nombre: '', descripcion: '', valor_maximo: '7', subcriterios: [{ nombre: '', puntaje: '7' }] }])
        setIsEvalModalOpen(false)
        setSelectedEvalId(data.id_evaluacion)
        loadData()
      }
    } catch (err) {
      setAddEvalError('Error de red')
    }
  }

  const handleSaveCriterios = async (e: React.FormEvent) => {
    e.preventDefault()
    setCriteriosError(null)

    if (!selectedEvalId) {
      setCriteriosError('Selecciona una evaluación primero')
      return
    }

    const criteriosValidos = criterios
      .map(c => ({
        nombre: c.nombre.trim(),
        descripcion: c.descripcion.trim(),
        valor_maximo: c.valor_maximo.trim() || '7',
        subcriterios: c.subcriterios
          .map(sc => ({ nombre: sc.nombre.trim(), puntaje: sc.puntaje.trim() || '0' }))
          .filter(sc => sc.nombre)
      }))
      .filter(c => c.nombre)

    if (criteriosValidos.length === 0) {
      setCriteriosError('Debes agregar al menos un criterio con nombre')
      return
    }

    try {
      const res = await fetch(apiUrl(`/evaluaciones/${selectedEvalId}/criterios`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criterios: criteriosValidos })
      })
      const data = await res.json()
      if (!res.ok) {
        setCriteriosError(data.error || 'No se pudieron guardar los criterios')
      } else {
        setSelectedEvalCriterios(data.criterios || [])
        setCriterios([{ nombre: '', descripcion: '', valor_maximo: '7', subcriterios: [{ nombre: '', puntaje: '7' }] }])
        setIsCriteriosModalOpen(false)
        alert('Criterios guardados correctamente')
      }
    } catch (err) {
      setCriteriosError('Error de red')
    }
  }

  const addCriterio = () => {
    setCriterios([...criterios, { nombre: '', descripcion: '', valor_maximo: '7', subcriterios: [{ nombre: '', puntaje: '7' }] }])
  }

  const addNewEvalCriterio = () => {
    setNewEvalCriterios([...newEvalCriterios, { nombre: '', descripcion: '', valor_maximo: '7', subcriterios: [{ nombre: '', puntaje: '7' }] }])
  }

  const removeCriterio = (index: number) => {
    setCriterios(criterios.filter((_, i) => i !== index))
  }

  const removeNewEvalCriterio = (index: number) => {
    setNewEvalCriterios(newEvalCriterios.filter((_, i) => i !== index))
  }

  const updateCriterio = (index: number, field: keyof CriterioDraft, value: string) => {
    const newCriterios = [...criterios]
    newCriterios[index] = { ...newCriterios[index], [field]: value }
    setCriterios(newCriterios)
  }

  const updateNewEvalCriterio = (index: number, field: keyof CriterioDraft, value: string) => {
    const updatedCriterios = [...newEvalCriterios]
    updatedCriterios[index] = { ...updatedCriterios[index], [field]: value }
    setNewEvalCriterios(updatedCriterios)
  }

  const addSubCriterio = (criterioIndex: number, isNewEval: boolean) => {
    const target = isNewEval ? newEvalCriterios : criterios
    const setter = isNewEval ? setNewEvalCriterios : setCriterios
    const updated = [...target]
    updated[criterioIndex] = {
      ...updated[criterioIndex],
      subcriterios: [...updated[criterioIndex].subcriterios, { nombre: '', puntaje: '7' }]
    }
    setter(updated)
  }

  const removeSubCriterio = (criterioIndex: number, subIndex: number, isNewEval: boolean) => {
    const target = isNewEval ? newEvalCriterios : criterios
    const setter = isNewEval ? setNewEvalCriterios : setCriterios
    const updated = [...target]
    updated[criterioIndex] = {
      ...updated[criterioIndex],
      subcriterios: updated[criterioIndex].subcriterios.filter((_, i) => i !== subIndex)
    }
    setter(updated)
  }

  const updateSubCriterio = (criterioIndex: number, subIndex: number, field: keyof SubCriterioDraft, value: string, isNewEval: boolean) => {
    const target = isNewEval ? newEvalCriterios : criterios
    const setter = isNewEval ? setNewEvalCriterios : setCriterios
    const updated = [...target]
    updated[criterioIndex] = {
      ...updated[criterioIndex],
      subcriterios: updated[criterioIndex].subcriterios.map((sub, idx) => idx === subIndex ? { ...sub, [field]: value } : sub)
    }
    setter(updated)
  }

  const openCriteriosModal = () => {
    if (selectedEvalCriterios.length > 0) {
      setCriterios(selectedEvalCriterios.map(c => ({
        nombre: c.nombre,
        descripcion: c.descripcion || '',
        valor_maximo: String(c.valor_maximo ?? '7'),
        subcriterios: Array.isArray((c as any).subcriterios) ? (c as any).subcriterios.map((sc: any) => ({ nombre: sc.nombre || '', puntaje: String(sc.puntaje ?? '7') })) : [{ nombre: '', puntaje: '7' }]
      })))
    } else {
      setCriterios([{ nombre: '', descripcion: '', valor_maximo: '7', subcriterios: [{ nombre: '', puntaje: '7' }] }])
    }
    setCriteriosError(null)
    setIsCriteriosModalOpen(true)
  }

  if (loading && !ramo) {
    return <div style={{ padding: '1.5rem' }}>Cargando detalles del ramo...</div>
  }

  if (error) {
    return <div style={{ padding: '1.5rem', color: 'red' }}>{error}</div>
  }

  if (!ramo) {
    return <div style={{ padding: '1.5rem' }}>No se encontró el ramo.</div>
  }

  const availableStudents = allUsers.filter(u => !students.some(s => s.id === u.id))
  
  const handleStudentCheckbox = (studentId: number) => {
    setNewGroupStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const maxAlumnosNum = parseInt(newGroupMaxAlumnos) || 0
  const isLimitReached = maxAlumnosNum > 0 && newGroupStudents.length >= maxAlumnosNum

  const studentsAlreadyInGroups = new Set(
    groups.flatMap(g => (g.alumnos || []).map(a => a.id))
  )
  
  const groupableStudents = students.filter(s => !studentsAlreadyInGroups.has(s.id))

  const selectedEval = evaluaciones.find(e => e.id_evaluacion === selectedEvalId)

  return (
    <div className="prof-view" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
      <button
        type="button"
        onClick={() => navigate('/profesor')}
        style={{ marginBottom: '1.5rem', background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <span>←</span> Volver a mis asignaturas
      </button>

      <div className="header" style={{ marginBottom: '2rem' }}>
        <EvaluationHeader
          title={ramo.nombre}
          course="Detalles de Asignatura"
          section=""
          description={ramo.descripcion || 'Sin descripción'}
        />
      </div>

      {/* STATS SECTION */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ backgroundColor: '#f0f7ff', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #cce3ff' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#004282' }}>Alumnos Inscritos</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#1976d2' }}>{students.length}</p>
        </div>
        <div style={{ backgroundColor: '#fff4f0', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #ffe1d6' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#8c2d04' }}>Grupos</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#d9480f' }}>{groups.length}</p>
        </div>
        <div style={{ backgroundColor: '#f4fce3', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #d8f5a2' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#3b5b05' }}>Créditos</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#5c940d' }}>{ramo.creditos ?? 'N/A'}</p>
        </div>
      </section>

      {/* EVALUATIONS SECTION */}
      <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>Evaluaciones</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setIsEvalModalOpen(true)}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#2b8a3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Crear Evaluación
            </button>
            {selectedEvalId && (
              <button 
                onClick={openCriteriosModal}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Configurar Criterios
              </button>
            )}
          </div>
        </div>

        {evaluaciones.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '1rem 0' }}>No hay evaluaciones creadadas aún.</p>
        ) : (
          <div style={{ display: 'flex', gap: '2rem', minHeight: '250px' }}>
            {/* Master: List of Evaluation Buttons */}
            <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRight: '1px solid #eee', paddingRight: '1rem' }}>
              {evaluaciones.map(e => (
                <button
                  key={e.id_evaluacion}
                  onClick={() => setSelectedEvalId(e.id_evaluacion)}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    backgroundColor: selectedEvalId === e.id_evaluacion ? '#e7f5ff' : 'transparent',
                    color: selectedEvalId === e.id_evaluacion ? '#1976d2' : '#333',
                    border: selectedEvalId === e.id_evaluacion ? '1px solid #a5d8ff' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: selectedEvalId === e.id_evaluacion ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {e.titulo}
                </button>
              ))}
            </div>

            {/* Detail: Evaluation Info */}
            <div style={{ flex: 1, padding: '0.5rem' }}>
              {selectedEval ? (
                <div>
                  <div style={{marginBottom: '0.5rem'}}>
                    <h3 style={{marginTop: 0,marginBottom: '0.5rem',color: '#333',fontSize: '1.5rem'}}>
                      {selectedEval.titulo}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <p style={{margin: 0,flex: 1, color: '#666',lineHeight: 1.5,whiteSpace: 'pre-wrap'}}>
                        {selectedEval.descripcion || 'Sin descripción detallada.'}
                      </p>
                      <div style={{backgroundColor: '#f1f3f5',padding: '0.25rem 0.75rem',borderRadius: '16px',fontSize: '0.85rem',color: '#495057',height: 'fit-content',whiteSpace: 'nowrap'}}>
                        <strong>Fecha:</strong>{" "}
                        {new Date(selectedEval.fecha_inicio).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fbff', padding: '1rem', borderRadius: '8px', border: '1px solid #d7e9ff', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#0b5394' }}>Criterios</h4>
                      <span style={{ fontSize: '0.85rem', color: '#4f6f8f', fontWeight: 'bold' }}>
                        {selectedEvalCriterios.length} configurados
                      </span>
                    </div>

                    {criteriosLoading ? (
                      <p style={{ margin: 0, color: '#666' }}>Cargando criterios...</p>
                    ) : selectedEvalCriterios.length === 0 ? (
                      <p style={{ margin: 0, color: '#666' }}>Esta evaluación aún no tiene criterios configurados.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                        {selectedEvalCriterios.map((criterio, index) => (
                          <li key={criterio.id_criterio} style={{ padding: '0.75rem', backgroundColor: 'white', border: '1px solid #e7f0fb', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                              <div>
                                <strong style={{ display: 'block', color: '#1f2937', marginBottom: '0.25rem' }}>
                                  {index + 1}. {criterio.nombre}
                                </strong>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', lineHeight: 1.4 }}>
                                  {criterio.descripcion || 'Sin descripción'}
                                </p>
                                {Array.isArray(criterio.subcriterios) && criterio.subcriterios.length > 0 && (
                                  <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, color: '#4b5563', fontSize: '0.9rem' }}>
                                    {criterio.subcriterios.map((sub, subIndex) => (
                                      <li key={`${criterio.id_criterio}-${subIndex}`}>
                                        {sub.nombre}: {sub.puntaje}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e7f5ff', color: '#1976d2', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                {Number(criterio.ponderacion).toFixed(2)}%
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {groups.map(g => (
                      <button
                        key={g.id_grupo}
                        onClick={() => navigate(`/profesor/evaluacion/${selectedEval.id_evaluacion}/grupo/${g.id_grupo}`)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#e67700', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                      >
                        Evaluar {g.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#999', marginTop: '2rem', textAlign: 'center' }}>Selecciona una evaluación de la lista</p>
              )}
            </div>
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* STUDENTS SECTION */}
        <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>Alumnos</h2>
            <button
              onClick={() => setIsImportModalOpen(true)}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#2b8a3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
            >
              📥 Importar Excel
            </button>
          </div>
          
          <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <select
              value={studentIdentifier}
              onChange={(e) => setStudentIdentifier(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white' }}
            >
              <option value="">-- Selecciona un alumno --</option>
              {availableStudents.map(u => (
                <option key={u.id} value={u.rut}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <button type="submit" disabled={!studentIdentifier} style={{ padding: '0.75rem 1.5rem', backgroundColor: studentIdentifier ? '#1976d2' : '#ccc', color: 'white', border: 'none', borderRadius: '6px', cursor: studentIdentifier ? 'pointer' : 'not-allowed' }}>
              Agregar
            </button>
          </form>
          {addStudentError && <p style={{ color: 'red', marginTop: '-1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>{addStudentError}</p>}
          {addStudentSuccess && <p style={{ color: 'green', marginTop: '-1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>{addStudentSuccess}</p>}

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {students.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>No hay alumnos inscritos.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {students.map(s => (
                  <li key={s.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{s.name}</strong>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>{s.email} | RUT: {s.rut}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* GROUPS SECTION */}
        <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Grupos</h2>
          
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="Nombre del grupo" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <input 
              type="text" 
              placeholder="Descripción (opcional)" 
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <input 
              type="number" 
              placeholder="Cant. alumnos (0 = sin límite)" 
              value={newGroupMaxAlumnos}
              onChange={(e) => setNewGroupMaxAlumnos(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
              min="0"
            />

            {groupableStudents.length > 0 ? (
              <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Seleccionar Alumnos (Sin grupo):</strong>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px', padding: '0.5rem' }}>
                  {groupableStudents.map(s => {
                    const isSelected = newGroupStudents.includes(s.id)
                    const isDisabled = !isSelected && isLimitReached
                    return (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => handleStudentCheckbox(s.id)}
                        />
                        <span style={{ fontSize: '0.9rem' }}>{s.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', marginBottom: '1rem' }}>Todos los alumnos del ramo ya tienen grupo.</p>
            )}

            <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#e67700', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Crear Grupo
            </button>
          </form>
          {addGroupError && <p style={{ color: 'red', marginTop: '-0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>{addGroupError}</p>}

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {groups.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>No hay grupos creados en este ramo.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                {groups.map(g => (
                  <li key={g.id_grupo} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#333' }}>{g.nombre}</strong>
                      <span style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem', backgroundColor: '#ffe8cc', color: '#d9480f', borderRadius: '12px', fontWeight: 'bold' }}>
                        {g.max_alumnos > 0 ? `Max: ${g.max_alumnos} alumnos` : 'Sin límite'}
                      </span>
                    </div>
                    {g.descripcion && <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.9rem' }}>{g.descripcion}</p>}
                    
                    {g.alumnos && g.alumnos.length > 0 && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #ccc' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#555' }}>Integrantes ({g.alumnos.length}):</strong>
                        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#444' }}>
                          {g.alumnos.map(a => (
                            <li key={a.id}>{a.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* CREATE EVALUATION MODAL */}
      {isEvalModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>Crear Evaluación</h2>
            <form onSubmit={handleCreateEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>Título</label>
                <input 
                  type="text" 
                  value={newEvalTitle}
                  onChange={(e) => setNewEvalTitle(e.target.value)}
                  placeholder="Ej: Presentación Final"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>Fecha</label>
                <input 
                  type="date" 
                  value={newEvalDate}
                  onChange={(e) => setNewEvalDate(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>Descripción</label>
                <textarea 
                  value={newEvalDesc}
                  onChange={(e) => setNewEvalDesc(e.target.value)}
                  placeholder="Instrucciones o detalles de la evaluación..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>Criterios de Evaluación</h3>
                    <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.9rem' }}>
                      Solo debes ingresar nombre y descripción. La ponderación será equitativa, escala por defecto y nota máxima 7.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addNewEvalCriterio}
                    style={{ padding: '0.5rem 0.75rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                  >
                    + Agregar
                  </button>
                </div>

                {newEvalCriterios.map((criterio, index) => (
                  <div key={index} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <strong>Criterio {index + 1}</strong>
                      {newEvalCriterios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeNewEvalCriterio(index)}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={criterio.nombre}
                        onChange={(e) => updateNewEvalCriterio(index, 'nombre', e.target.value)}
                        placeholder="Nombre del criterio (ej: Presentación correcta)"
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
                        required
                      />
                      <textarea
                        value={criterio.descripcion}
                        onChange={(e) => updateNewEvalCriterio(index, 'descripcion', e.target.value)}
                        placeholder="Descripción del criterio (opcional)"
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', minHeight: '70px', resize: 'vertical' }}
                      />
                      <input
                        type="number"
                        min="1"
                        value={criterio.valor_maximo}
                        onChange={(e) => updateNewEvalCriterio(index, 'valor_maximo', e.target.value)}
                        placeholder="Puntaje máximo del criterio"
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
                      />

                      <div style={{ padding: '0.75rem', border: '1px dashed #c7d2fe', borderRadius: '8px', backgroundColor: '#f8faff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#4338ca' }}>Subcriterios</strong>
                          <button
                            type="button"
                            onClick={() => addSubCriterio(index, true)}
                            style={{ padding: '0.35rem 0.6rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            + Agregar
                          </button>
                        </div>
                        {criterio.subcriterios.map((sub, subIndex) => (
                          <div key={`${index}-${subIndex}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                              type="text"
                              value={sub.nombre}
                              onChange={(e) => updateSubCriterio(index, subIndex, 'nombre', e.target.value, true)}
                              placeholder="Nombre del subcriterio"
                              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                            <input
                              type="number"
                              min="0"
                              value={sub.puntaje}
                              onChange={(e) => updateSubCriterio(index, subIndex, 'puntaje', e.target.value, true)}
                              placeholder="Puntaje"
                              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeSubCriterio(index, subIndex, true)}
                              style={{ padding: '0.6rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
               
              {addEvalError && <p style={{ color: 'red', margin: 0 }}>{addEvalError}</p>}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEvalModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2b8a3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURAR CRITERIOS MODAL */}
      {isCriteriosModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>Configurar Criterios de Evaluación</h2>
            <form onSubmit={handleSaveCriterios} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {criterios.map((criterio, index) => (
                <div key={index} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong>Criterio {index + 1}</strong>
                    {criterios.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeCriterio(index)}
                        style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={criterio.nombre}
                      onChange={(e) => updateCriterio(index, 'nombre', e.target.value)}
                      placeholder="Nombre del criterio (ej: Presentación correcta)"
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      required
                    />
                    <input 
                      type="text" 
                      value={criterio.descripcion}
                      onChange={(e) => updateCriterio(index, 'descripcion', e.target.value)}
                      placeholder="Descripción (opcional)"
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                      type="number"
                      min="1"
                      value={criterio.valor_maximo}
                      onChange={(e) => updateCriterio(index, 'valor_maximo', e.target.value)}
                      placeholder="Puntaje máximo del criterio"
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <div style={{ padding: '0.75rem', border: '1px dashed #c7d2fe', borderRadius: '8px', backgroundColor: '#f8faff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#4338ca' }}>Subcriterios</strong>
                        <button
                          type="button"
                          onClick={() => addSubCriterio(index, false)}
                          style={{ padding: '0.35rem 0.6rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          + Agregar
                        </button>
                      </div>
                      {criterio.subcriterios.map((sub, subIndex) => (
                        <div key={`${index}-${subIndex}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            value={sub.nombre}
                            onChange={(e) => updateSubCriterio(index, subIndex, 'nombre', e.target.value, false)}
                            placeholder="Nombre del subcriterio"
                            style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                          <input
                            type="number"
                            min="0"
                            value={sub.puntaje}
                            onChange={(e) => updateSubCriterio(index, subIndex, 'puntaje', e.target.value, false)}
                            placeholder="Puntaje"
                            style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeSubCriterio(index, subIndex, false)}
                            style={{ padding: '0.6rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                type="button"
                onClick={addCriterio}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + Agregar Criterio
              </button>

              <div style={{ padding: '1rem', backgroundColor: '#e7f5ff', borderRadius: '8px', border: '1px solid #a5d8ff', color: '#0b5394' }}>
                <strong>Configuración automática:</strong> el backend asigna ponderación equitativa entre criterios, escala por defecto y nota máxima 7.
              </div>
              
              {criteriosError && <p style={{ color: 'red', margin: 0 }}>{criteriosError}</p>}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsCriteriosModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Guardar Criterios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT STUDENTS MODAL */}
      <ImportStudentsModal
        ramoId={ramoId || ''}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          loadData()
        }}
      />

    </div>
  )
}
