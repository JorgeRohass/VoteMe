import { useState } from 'react'
import './sala-espera.css'

interface SalaEsperaFormProps {
  onAcceder: (codigo: string, nombre: string) => void
}

export function SalaEsperaForm({ onAcceder }: SalaEsperaFormProps) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [validating, setValidating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!codigo.trim() || !nombre.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    setValidating(true)

    try {
      // Validar código contra el backend
      const res = await fetch(`http://localhost:3000/api/evaluaciones/sesiones/${codigo.trim().toUpperCase()}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Código inválido o expirado')
        setValidating(false)
        return
      }

      // Verificar expiración
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('El código ha expirado')
        setValidating(false)
        return
      }

      onAcceder(codigo.trim().toUpperCase(), nombre.trim())
    } catch (err) {
      setError('Error de conexión al validar el código')
      setValidating(false)
    }
  }

  return (
    <div className="sala-espera-container">
      <div className="sala-espera-card">
        <h1 className="sala-espera-titulo">VoteMe</h1>
        <p className="sala-espera-subtitulo">Evaluación de presentaciones académicas</p>

        <form onSubmit={handleSubmit} className="sala-espera-form">
          <div className="form-group">
            <label htmlFor="codigo">Código de sesión</label>
            <input
              id="codigo"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ingresa el código"
            />
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Tu nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={validating}>
            {validating ? 'Validando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  )
}