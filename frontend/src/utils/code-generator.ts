const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateAccessCode(size = 6): string {
  return Array.from({ length: size }, () => {
    const index = Math.floor(Math.random() * CODE_ALPHABET.length)
    return CODE_ALPHABET[index]
  }).join('')
}

export function getStartTime(): string {
  return new Date().toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
