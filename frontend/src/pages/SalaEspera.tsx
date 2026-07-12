import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SalaEsperaForm } from '../components/sala-espera/SalaEsperaForm'

export function SalaEspera() {
  const navigate = useNavigate()
  const [_, setNombre] = useState('')

  const handleAcceder = (codigo: string, nombreUsuario: string) => {
    setNombre(nombreUsuario)
    // Navegar a la página de evaluación con el código
    navigate(`/evaluar/${codigo}`)
  }

  return <SalaEsperaForm onAcceder={handleAcceder} />
}