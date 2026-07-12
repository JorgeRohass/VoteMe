import { useState, useRef } from 'react'
import './StudentImportForm.css'

interface ImportResult {
  successful: Array<{ rut: string; nombre: string; correo: string }>
  failed: Array<{ fila: number; datos: any; error: string }>
  duplicates: Array<{ fila: number; rut: string; nombre: string; error: string }>
}

interface StudentImportProps {
  groupId: string
  onImportSuccess?: () => void
}

export function StudentImportForm({ groupId, onImportSuccess }: StudentImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar que sea un archivo Excel
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
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('idGrupo', groupId)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students/import`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al procesar el archivo')
        return
      }

      setResult(data.results)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-import-form">
      <div className="import-container">
        <h3>Importar Estudiantes desde Excel</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="file-input">Selecciona archivo Excel:</label>
            <p className="helper-text">
              El archivo debe contener las columnas: <strong>nombre</strong>, <strong>rut</strong>, <strong>correo</strong>
            </p>

            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                {file ? file.name : 'Haz clic para seleccionar archivo'}
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={!file || loading}
            className="btn-import"
          >
            {loading ? 'Importando...' : 'Importar Estudiantes'}
          </button>
        </form>

        {result && (
          <div className="import-results">
            <div className="results-summary">
              <h4>Resultados de la Importación</h4>
              <div className="summary-stats">
                <div className="stat">
                  <span className="label">Total procesados:</span>
                  <span className="value">{result.successful.length + result.failed.length + result.duplicates.length}</span>
                </div>
                <div className="stat success">
                  <span className="label">✓ Exitosos:</span>
                  <span className="value">{result.successful.length}</span>
                </div>
                {result.failed.length > 0 && (
                  <div className="stat error">
                    <span className="label">✗ Fallidos:</span>
                    <span className="value">{result.failed.length}</span>
                  </div>
                )}
                {result.duplicates.length > 0 && (
                  <div className="stat warning">
                    <span className="label">⚠ Duplicados:</span>
                    <span className="value">{result.duplicates.length}</span>
                  </div>
                )}
              </div>
            </div>

            {result.successful.length > 0 && (
              <div className="results-section success">
                <h5>Estudiantes Importados ({result.successful.length})</h5>
                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>RUT</th>
                        <th>Correo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.successful.map((student, idx) => (
                        <tr key={idx}>
                          <td>{student.nombre}</td>
                          <td>{student.rut}</td>
                          <td>{student.correo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.failed.length > 0 && (
              <div className="results-section error">
                <h5>Errores ({result.failed.length})</h5>
                <div className="results-list">
                  {result.failed.map((item, idx) => (
                    <div key={idx} className="error-item">
                      <span className="fila">Fila {item.fila}:</span>
                      <span className="error-text">{item.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.duplicates.length > 0 && (
              <div className="results-section warning">
                <h5>Duplicados No Importados ({result.duplicates.length})</h5>
                <div className="results-list">
                  {result.duplicates.map((item, idx) => (
                    <div key={idx} className="warning-item">
                      <span className="fila">Fila {item.fila}:</span>
                      <span className="text">
                        {item.nombre} ({item.rut}) - {item.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
