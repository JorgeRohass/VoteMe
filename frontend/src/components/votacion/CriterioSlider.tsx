interface CriterioSliderProps {
  nombre: string
  valor: number
  min: number
  max: number
  onChange: (valor: number) => void
}

export function CriterioSlider({ nombre, valor, min, max, onChange }: CriterioSliderProps) {
  const porcentaje = ((valor - min) / (max - min)) * 100

  return (
    <div className="criterio-slider">
      <div className="criterio-header">
        <span className="criterio-nombre">{nombre}</span>
        <span className="criterio-valor">{valor}</span>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min={min}
          max={max}
          value={valor}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input"
          style={{
            background: `linear-gradient(to right, #2596be ${porcentaje}%, #3A4C61 ${porcentaje}%)`
          }}
        />
        <div className="slider-labels">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  )
}