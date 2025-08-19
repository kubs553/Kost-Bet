import React from 'react'
import { useFence } from '../contexts/FenceContext'
import { FenceElement } from '../contexts/FenceContext'
import { RotateCcw, Trash2 } from 'lucide-react'

interface ElementPropertiesProps {
  element: FenceElement
  onUpdate: (updates: Partial<FenceElement>) => void
  onDelete: () => void
}

const ElementProperties: React.FC<ElementPropertiesProps> = ({ element, onDelete }) => {
  const { updateElement, removeElement, rotateElement } = useFence()
  
  // 🎯 DEBUG: Sprawdź czy element jest poprawnie przekazany
  console.log(`🎯 ElementProperties: Otrzymano element:`, {
    id: element?.id,
    type: element?.type,
    position: element?.position,
    width: element?.width,
    height: element?.height
  })

  const handleWidthChange = (width: number) => {
    updateElement(element.id, { width, price: calculatePrice(width, element.height) })
  }

  const handleHeightChange = (height: number) => {
    updateElement(element.id, { height, price: calculatePrice(element.width, height) })
    
    // 🎯 DLA SŁUPKA: Zaktualizuj wysokość w scenie 3D
    if (element.type === 'post' && (window as any).updatePostHeight) {
      try {
        // Dla słupka wysokość jest już w blokach, przekaż bezpośrednio
        (window as any).updatePostHeight(element.id, height)
        console.log(`🏗️ Zaktualizowano wysokość słupka ${element.id} w 3D: ${height} bloków`)
      } catch (error) {
        console.error('❌ Błąd aktualizacji wysokości w 3D:', error)
      }
    }
  }

  const handleRotationChange = (rotation: number) => {
    // Użyj rotateElement z kontekstu (aktualizuje React state)
    rotateElement(element.id, rotation)
    
    // 🎯 ZAKTUALIZUJ ROTACJĘ W SCENIE 3D
    if ((window as any).updateElementRotation) {
      try {
        (window as any).updateElementRotation(element.id, rotation)
        console.log(`🔄 Zaktualizowano rotację elementu ${element.id} w 3D: ${rotation}°`)
      } catch (error) {
        console.error('❌ Błąd aktualizacji rotacji w 3D:', error)
      }
    }
  }

  const calculatePrice = (width: number, height: number): number => {
    const basePrice = element.type === 'post' ? 50 : 
                     element.type === 'gate' ? 1200 :
                     element.type === 'door' ? 600 : 100
    
    if (element.type === 'section') {
      return width * 100 // 100 zł za metr
    }
    
    return basePrice
  }

  const getElementIcon = () => {
    switch (element.type) {
      case 'post': return '🏗️'
      case 'gate': return '🚪'
      case 'door': return '🚶'
      case 'section': return '🔲'
      default: return '❓'
    }
  }

  const getElementName = () => {
    switch (element.type) {
      case 'post': return 'Słupek'
      case 'gate': return 'Brama'
      case 'door': return 'Furtka'
      case 'section': return 'Przęsło'
      default: return 'Element'
    }
  }

  // 🎯 DLA SŁUPKA: Konwertuj wysokość z metrów na bloki
  const getHeightInBlocks = (heightInMeters: number) => {
    if (element.type === 'post') {
      // Zakładamy że jeden blok to około 0.3m wysokości
      // Ale sprawdźmy czy wysokość jest już w blokach
      if (heightInMeters <= 8 && heightInMeters >= 3) {
        return Math.round(heightInMeters) // Już w blokach
      }
      return Math.round(heightInMeters / 0.3)
    }
    return heightInMeters
  }

  const getHeightFromBlocks = (blocks: number) => {
    if (element.type === 'post') {
      // Dla słupka zwracamy liczbę bloków (nie metrów)
      return blocks
    }
    return blocks
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Właściwości elementu
        </h3>
        <div className="text-2xl">{getElementIcon()}</div>
      </div>

      {/* Informacje o elemencie */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-900">{getElementName()}</p>
        <p className="text-xs text-gray-500">ID: {element.id}</p>
        <p className="text-xs text-gray-500">
          Pozycja: ({element.position.x.toFixed(1)}, {element.position.z.toFixed(1)})
        </p>
      </div>

      {/* Wymiary */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Długość (m)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={element.width}
            onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {element.type === 'post' ? 'Wysokość (bloki)' : 'Wysokość (m)'}: 
            {element.type === 'post' 
              ? `${getHeightInBlocks(element.height)} bloków` 
              : `${element.height.toFixed(1)}m`
            }
          </label>
          <input
            type="range"
            min={element.type === 'post' ? 3 : 1}
            max={element.type === 'post' ? 8 : 4}
            step={element.type === 'post' ? 1 : 0.1}
            value={element.type === 'post' ? getHeightInBlocks(element.height) : element.height}
            onChange={(e) => {
              if (element.type === 'post') {
                const blocks = parseInt(e.target.value)
                const heightInMeters = getHeightFromBlocks(blocks)
                handleHeightChange(heightInMeters)
              } else {
                handleHeightChange(parseFloat(e.target.value))
              }
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {element.type === 'post' ? (
              <>
                <span>3 bloki</span>
                <span>8 bloków</span>
              </>
            ) : (
              <>
                <span>1m</span>
                <span>4m</span>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rotacja: {element.rotation.toFixed(0)}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={element.rotation}
            onChange={(e) => handleRotationChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0°</span>
            <span>360°</span>
          </div>
        </div>
      </div>

      {/* Cena */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm font-medium text-green-800">
          Cena: {element.price.toFixed(2)} zł
        </p>
        <p className="text-xs text-green-600">
          {element.type === 'section' 
            ? `${element.width.toFixed(1)}m × 100 zł/m = ${element.price.toFixed(2)} zł`
            : 'Cena stała'
          }
        </p>
      </div>

      {/* Akcje */}
      <div className="flex space-x-2 mt-4">
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">Usuń</span>
        </button>
          
        <button
          onClick={() => handleRotationChange(0)}
          className="flex items-center justify-center space-x-2 p-2 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-sm">Resetuj rotację</span>
        </button>
      </div>
    </div>
  )
}

export default ElementProperties
