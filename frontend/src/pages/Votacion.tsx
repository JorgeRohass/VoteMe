import { useLocation, useNavigate } from 'react-router-dom'
import { VotacionForm } from '../components/votacion/VotacionForm'

interface Criterio {
  id: string
  nombre: string
}

const CRITERIOS_EJEMPLO: Criterio[] = [
  { id: 'claridad', nombre: 'Claridad' },
  { id: 'contenido', nombre: 'Contenido' },
  { id: 'dominio', nombre: 'Dominio del tema' },
]

const RANGO_MIN = 1
const RANGO_MAX = 5

export function Votacion() {
  const location = useLocation()
  const navigate = useNavigate()
  const nombre = (location.state as { nombre?: string })?.nombre || 'Invitado'

  const handleEnviar = (votos: Record<string, number>, comentarios: string) => {
    console.log('Votos:', votos)
    console.log('Comentarios:', comentarios)
    alert('¡Voto enviado con éxito!')
    navigate('/')
  }

  return (
    <VotacionForm
      criterios={CRITERIOS_EJEMPLO}
      rangoMin={RANGO_MIN}
      rangoMax={RANGO_MAX}
      nombreUsuario={nombre}
      onEnviar={handleEnviar}
    />
  )
}