import { useState, useRef } from 'react'
import { apiUrl } from '../utils/api'

interface ImportRamoModalProps {
  ramoId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ImportStudentsModal({ ramoId, isOpen, onClose, onSuccess }: ImportRamoModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ]
      const validExtensions = ['.xlsx', '.xls']

      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      const isValidMime = validMimes.includes(selectedFile.type)
      const isValidExt = validExtensions.includes(fileExtension)

      if (!isValidMime && !isValidExt) {
        setError('Solo se aceptan archivos Excel (.xlsx, .xls)')
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Por favor selecciona un archivo')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('ramoId', ramoId)

    try {
      const response = await fetch(apiUrl(`/ramos/${ramoId}/import-students`), {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al procesar el archivo')
        return
      }

      const summary = data.summary
      setSuccess(`✓ Importación completada: ${summary.exitosos} exitosos, ${summary.fallidos} fallidos, ${summary.duplicados} duplicados`)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      }, 2000)
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1001
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Importar Estudiantes desde Excel</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#999',
              padding: 0
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>
              Selecciona archivo Excel
            </label>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#666' }}>
              El archivo debe contener las columnas: <strong>nombre</strong>, <strong>rut</strong>, <strong>correo</strong>
            </p>

            <div style={{
              position: 'relative',
              marginBottom: '1rem'
            }}>
              <input
                ref={fileInputRef}
                id="excel-file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                style={{ display: 'none' }}
              />
              <label htmlFor="excel-file-input" style={{
                display: 'block',
                padding: '1rem',
                border: '2px dashed #ccc',
                borderRadius: '6px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#fafafa',
                transition: 'all 0.3s ease',
                color: file ? '#1976d2' : '#666'
              }}>
                {file ? (
                  <>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>✓</span>
                    {file.name}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>📁</span>
                    Haz clic o arrastra un archivo Excel
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c00',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#efe',
              border: '1px solid #cfc',
              borderRadius: '6px',
              color: '#060',
              fontSize: '0.9rem'
            }}>
              {success}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: loading ? 0.5 : 1
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: file && !loading ? '#2b8a3e' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: file && !loading ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
