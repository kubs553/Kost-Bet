import React, { useRef, useEffect, useState } from 'react'
import { FenceElement } from '../contexts/FenceContext'

interface Canvas2DProps {
  elements: FenceElement[]
  selectedElementId: string | null
  onElementSelect: (id: string | null) => void
}

const Canvas2D: React.FC<Canvas2DProps> = ({ elements, selectedElementId, onElementSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragElement, setDragElement] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    drawCanvas()
  }, [elements, selectedElementId, scale, pan])

  // Automatyczne centrowanie na elementach gdy są dodawane (tylko przy pierwszym elemencie)
  useEffect(() => {
    if (elements.length === 1) {
      // Automatycznie wycentruj widok tylko przy pierwszym elemencie
      setTimeout(() => handleZoomToFit(), 100)
    }
  }, [elements.length])

  // Obsługa skrótów klawiszowych
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sprawdź czy nie jesteśmy w polu tekstowym
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            handleZoomIn()
            break
          case '-':
            e.preventDefault()
            handleZoomOut()
            break
          case '0':
            e.preventDefault()
            handleZoomReset()
            break
          case 'f':
          case 'F':
            e.preventDefault()
            handleZoomToFit()
            break
          case 'e':
          case 'E':
            e.preventDefault()
            handleZoomToElement()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(scale, scale)

    // Draw grid
    drawGrid(ctx)

    // Draw elements
    elements.forEach(element => {
      drawElement(ctx, element, element.id === selectedElementId)
    })

    // Draw connections if perimeter is closed
    if (elements.length > 2) {
      drawPerimeter(ctx)
    }

    ctx.restore()
  }

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = 50
    const gridColor = '#f0f0f0'
    
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1

    // Oblicz zakres siatki na podstawie elementów i pozycji kamery
    let gridMinX = -200, gridMaxX = 200, gridMinY = -200, gridMaxY = 200
    
    if (elements.length > 0) {
      // Rozszerz siatkę o pozycje elementów
      elements.forEach(element => {
        gridMinX = Math.min(gridMinX, element.position.x - 100)
        gridMaxX = Math.max(gridMaxX, element.position.x + 100)
        gridMinY = Math.min(gridMinY, element.position.y - 100)
        gridMaxY = Math.max(gridMaxY, element.position.y + 100)
      })
    }
    
    // Dodaj margines do siatki
    const margin = 200
    gridMinX -= margin
    gridMaxX += margin
    gridMinY -= margin
    gridMaxY += margin

    // Vertical lines
    for (let x = Math.floor(gridMinX / gridSize) * gridSize; x <= gridMaxX; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, gridMinY)
      ctx.lineTo(x, gridMaxY)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = Math.floor(gridMinY / gridSize) * gridSize; y <= gridMaxY; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(gridMinX, y)
      ctx.lineTo(gridMaxX, y)
      ctx.stroke()
    }

    // Center lines (jeśli są w widoku)
    if (gridMinX <= 0 && gridMaxX >= 0) {
      ctx.strokeStyle = '#d0d0d0'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, gridMinY)
      ctx.lineTo(0, gridMaxY)
      ctx.stroke()
    }
    
    if (gridMinY <= 0 && gridMaxY >= 0) {
      ctx.strokeStyle = '#d0d0d0'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(gridMinX, 0)
      ctx.lineTo(gridMaxX, 0)
      ctx.stroke()
    }
  }

  const drawElement = (ctx: CanvasRenderingContext2D, element: FenceElement, isSelected: boolean) => {
    const { position, width, height, rotation, type } = element

    // DEBUG: Sprawdź wymiary elementu
    console.log(`🎨 Rysuję element ${type}:`, {
      position: { x: position.x, y: position.y },
      width,
      height,
      rotation,
      totalRotation: rotation + 90,
      scale: scale,
      elementScale: 20,
      finalWidth: width * 20,
      finalHeight: height * 20
    })

    ctx.save()
    ctx.translate(position.x, position.y) // Używaj position.y zamiast position.z
    
    // Dodaj rotację o 90 stopni żeby elementy stały w pionie (jak w DAE)
    const totalRotation = (rotation + 90) * Math.PI / 180
    ctx.rotate(totalRotation)
    
    // Skaluj elementy żeby były widoczne (metry na piksele)
    const elementScale = 20 // Zmniejszone z 50 na 20 - 1 metr = 20 pikseli
    ctx.scale(elementScale, elementScale)

    // Set colors based on selection and type
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    } else {
      ctx.strokeStyle = getElementColor(type)
      ctx.lineWidth = 2
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    }

    // Draw element based on type
    switch (type) {
      case 'post':
        drawPost(ctx, width, height)
        break
      case 'gate':
        drawGate(ctx, width, height)
        break
      case 'door':
        drawDoor(ctx, width, height)
        break
      case 'section':
        drawSection(ctx, width, height)
        break
    }

    // Draw element info
    drawElementInfo(ctx, element)

    ctx.restore()
  }

  const drawPost = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const x = -width / 2
    const y = -height / 2
    
    // DEBUG: Sprawdź jak jest rysowany słupek
    console.log(`🏗️ Rysuję słupek:`, {
      width,
      height,
      x,
      y,
      rect: { x, y, width, height }
    })
    
    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)
  }

  const drawGate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const x = -width / 2
    const y = -height / 2
    
    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)
    
    // Draw gate details
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + width / 2, y)
    ctx.lineTo(x + width / 2, y + height)
    ctx.stroke()
  }

  const drawDoor = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const x = -width / 2
    const y = -height / 2
    
    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)
    
    // Draw door handle
    ctx.fillStyle = '#d97706'
    ctx.beginPath()
    ctx.arc(x + width * 0.8, y + height / 2, 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  const drawSection = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const x = -width / 2
    const y = -height / 2
    
    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)
    
    // Draw section pattern
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      const lineY = y + (height * i) / 3
      ctx.beginPath()
      ctx.moveTo(x, lineY)
      ctx.lineTo(x + width, lineY)
      ctx.stroke()
    }
  }

  const drawElementInfo = (ctx: CanvasRenderingContext2D, element: FenceElement) => {
    ctx.fillStyle = '#374151'
    ctx.font = '12px Inter'
    ctx.textAlign = 'center'
    
    const info = `${element.type === 'section' ? element.width.toFixed(1) + 'm' : element.type}`
    ctx.fillText(info, 0, element.height / 2 + 20)
  }

  const drawPerimeter = (ctx: CanvasRenderingContext2D) => {
    if (elements.length < 3) return

    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    ctx.beginPath()
    ctx.moveTo(elements[0].position.x, elements[0].position.y)
    
    for (let i = 1; i < elements.length; i++) {
      ctx.lineTo(elements[i].position.x, elements[i].position.y)
    }
    
    // Close the perimeter
    ctx.lineTo(elements[0].position.x, elements[0].position.y)
    ctx.stroke()
    
    ctx.setLineDash([])
  }

  const getElementColor = (type: string): string => {
    switch (type) {
      case 'post': return '#3b82f6'
      case 'gate': return '#059669'
      case 'door': return '#d97706'
      case 'section': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / scale
    const y = (e.clientY - rect.top - pan.y) / scale

    if (e.button === 2) { // Prawy przycisk myszy - pan kamery
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      return
    }

    // Check if clicking on an element
    const clickedElement = elements.find(element => {
      const dx = x - element.position.x
      const dy = y - element.position.y
      return Math.abs(dx) <= element.width / 2 && Math.abs(dy) <= element.height / 2
    })

    if (clickedElement) {
      setDragElement(clickedElement.id)
      setDragOffset({ x: x - clickedElement.position.x, y: y - clickedElement.position.y })
      onElementSelect(clickedElement.id)
      setIsDragging(true)
    } else {
      onElementSelect(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Pan kamery (prawy przycisk myszy)
    if (isPanning) {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setPanStart({ x: e.clientX, y: e.clientY })
      return
    }

    // Przeciąganie elementu
    if (!isDragging || !dragElement) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / scale
    const y = (e.clientY - rect.top - pan.y) / scale

    // Update element position
    const element = elements.find(el => el.id === dragElement)
    if (element) {
      element.position.x = x - dragOffset.x
      element.position.y = y - dragOffset.y
      drawCanvas()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragElement(null)
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    
    // Sprawdź czy użytkownik trzyma Ctrl (dla większego przybliżenia)
    const zoomMultiplier = e.ctrlKey ? 1.3 : 1.1
    const delta = e.deltaY > 0 ? 1 / zoomMultiplier : zoomMultiplier
    
    setScale(prev => {
      const newScale = prev * delta
      // Pozwól na większe przybliżenie (do 50x)
      return Math.max(0.01, Math.min(50, newScale))
    })
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(50, prev * 1.5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.01, prev / 1.5))
  }

  const handleZoomReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  const handleZoomToFit = () => {
    if (elements.length === 0) return
    
    // Oblicz bounding box wszystkich elementów
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    
    elements.forEach(element => {
      minX = Math.min(minX, element.position.x - element.width / 2)
      maxX = Math.max(maxX, element.position.x + element.width / 2)
      minY = Math.min(minY, element.position.y - element.height / 2)
      maxY = Math.max(maxY, element.position.y + element.height / 2)
    })
    
    // Dodaj margines (większy dla lepszej widoczności)
    const margin = Math.max(100, Math.max(maxX - minX, maxY - minY) * 0.5)
    minX -= margin
    maxX += margin
    minY -= margin
    maxY += margin
    
    // Oblicz wymiary canvas
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const canvasWidth = rect.width
    const canvasHeight = rect.height
    
    // Oblicz optymalny zoom
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    // Sprawdź czy elementy nie są zbyt małe
    if (contentWidth < 10 || contentHeight < 10) {
      // Jeśli elementy są bardzo małe, użyj większego zoomu
      setScale(15)
      setPan({
        x: canvasWidth / 2,
        y: canvasHeight / 2
      })
      return
    }
    
    const scaleX = canvasWidth / contentWidth
    const scaleY = canvasHeight / contentHeight
    const optimalScale = Math.min(scaleX, scaleY, 50) // Maksymalny zoom to 50
    
    // Oblicz pozycję centrum
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    // Ustaw zoom i pozycję
    setScale(optimalScale)
    setPan({
      x: canvasWidth / 2 - centerX * optimalScale,
      y: canvasHeight / 2 - centerY * optimalScale
    })
    
    console.log('🔍 Zoom to fit:', {
      elements: elements.length,
      boundingBox: { minX, maxX, minY, maxY },
      contentSize: { contentWidth, contentHeight },
      optimalScale,
      pan: { x: canvasWidth / 2 - centerX * optimalScale, y: canvasHeight / 2 - centerY * optimalScale }
    })
  }

  const handleZoomToElement = () => {
    if (!selectedElementId) return
    
    const selectedElement = elements.find(el => el.id === selectedElementId)
    if (!selectedElement) return
    
    // Przybliż się do wybranego elementu
    const element = selectedElement
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const canvasWidth = rect.width
    const canvasHeight = rect.height
    
    // Ustaw duży zoom na element
    const zoomLevel = 25 // Duży zoom na element
    setScale(zoomLevel)
    
    // Wycentruj na elemencie
    setPan({
      x: canvasWidth / 2 - element.position.x * zoomLevel,
      y: canvasHeight / 2 - element.position.y * zoomLevel
    })
    
    console.log('🔍 Zoom to element:', {
      elementId: selectedElementId,
      elementType: element.type,
      position: element.position,
      zoomLevel
    })
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full border border-gray-300 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()} // Wyłącz domyślne menu kontekstowe
      />
      
      {/* Kontrolki */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {/* Kontrolki zoomu */}
        <div className="flex flex-col space-y-1">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Przybliż (Ctrl + +)"
          >
            🔍+
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Oddal (Ctrl + -)"
          >
            🔍-
          </button>
          <button
            onClick={handleZoomReset}
            className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Resetuj zoom (Ctrl + 0)"
          >
            🎯
          </button>
          <button
            onClick={handleZoomToFit}
            className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Dopasuj do widoku (Ctrl + F)"
          >
            📐
          </button>
          <button
            onClick={handleZoomToElement}
            disabled={!selectedElementId}
            className={`p-2 border rounded-lg shadow-sm transition-colors ${
              selectedElementId 
                ? 'bg-blue-500/90 text-white hover:bg-blue-400' 
                : 'bg-gray-300/90 text-gray-500 cursor-not-allowed'
            }`}
            title="Przybliż do wybranego elementu (Ctrl + E)"
          >
            🎯
          </button>
        </div>
        
        {/* Przełącznik 2D/3D */}
        <button
          onClick={() => {
            // Emituj event do parenta żeby zmienić tryb widoku
            window.dispatchEvent(new CustomEvent('toggleViewMode'))
          }}
          className="px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white transition-colors flex items-center space-x-2"
          title="Przełącz na 3D"
        >
          <span className="text-lg">🎨</span>
          <span className="text-sm font-medium text-gray-700">3D</span>
        </button>
      </div>

      {/* Informacje */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          📐 Canvas 2D | Elementy: {elements.length} | Zoom: {(scale * 100).toFixed(0)}%
        </p>
        <p className="text-xs text-gray-500 mt-1">
          💡 Kliknij element aby wybrać, przeciągnij aby przesunąć, kółko myszy aby przybliżyć
        </p>
        <p className="text-xs text-purple-500 mt-1">
          🔍 Ctrl + kółko myszy = szybsze przybliżanie (maksymalnie 50x)
        </p>
        <p className="text-xs text-blue-500 mt-1">
          ⌨️ Skróty: Ctrl++ (przybliż), Ctrl+- (oddal), Ctrl+0 (reset), Ctrl+F (dopasuj), Ctrl+E (do elementu)
        </p>
        <p className="text-xs text-green-500 mt-1">
          🖱️ Prawy przycisk myszy + przeciągnij = przesuń kamerę
        </p>
      </div>
    </div>
  )
}

export default Canvas2D
