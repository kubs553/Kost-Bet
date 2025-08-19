import React, { useState } from 'react'
import { useFence } from '../contexts/FenceContext'
import { Fence, DoorOpen, User, Minus, RotateCcw } from 'lucide-react'

interface ElementToolbarProps {
  onElementSelect: (id: string | null) => void
  selectedFence?: any // Dodajemy props dla wybranego ogrodzenia
}

const ElementToolbar: React.FC<ElementToolbarProps> = ({ onElementSelect, selectedFence }) => {
  const { state, addPost, addGate, addDoor, addSection, updateElement, resetProject } = useFence()
  const [sectionWidth, setSectionWidth] = useState(2.0)
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [postHeight, setPostHeight] = useState(6) // 🎯 Wysokość słupka (domyślnie 6 bloków)

  const getNextPosition = (elementType: string) => {
    // Użyj funkcji z 3D komponentu jeśli jest dostępna
    if ((window as any).getNextElementPosition && selectedFence) {
      return (window as any).getNextElementPosition(selectedFence)
    }
    
    // Fallback: Oblicz następną pozycję na podstawie istniejących elementów 2D
    if (state.elements.length === 0) {
      return { x: -5, y: 0, z: 0 } // Start od lewej strony (widoczne w canvas)
    }
    
    // Znajdź najdalej wysunięty element w prawo
    const rightmostElement = state.elements.reduce((rightmost, element) => {
      return element.position.x > rightmost.position.x ? element : rightmost
    })
    
    // Dodaj nowy element na prawo od najdalej wysuniętego
    // Użyj szerokości elementu + mały odstęp
    const spacing = 1.0 // Zwiększony odstęp między elementami dla lepszej widoczności
    return { 
      x: rightmostElement.position.x + rightmostElement.width / 2 + spacing, 
      y: 0, 
      z: 0 
    }
  }

  const handleAddPost = async () => {
    if (!selectedFence) {
      alert('Najpierw wybierz system ogrodzenia!')
      return
    }

    const position = getNextPosition('post')
    console.log(`🏗️ Dodaję słupek o wysokości: ${postHeight} bloków`)
    
    // Dodaj element do kontekstu React (Canvas2D) i otrzymaj jego ID
    const elementId = addPost(position)
    console.log(`✅ Element dodany do React z ID: ${elementId}`)

    // Dodaj element do sceny 3D (jeśli funkcja jest dostępna)
    if ((window as any).addFenceElement) {
      try {
        await (window as any).addFenceElement(elementId, 'post', position, selectedFence, postHeight, // 🎯 Przekaż ID i wysokość słupka
          // Callback żeby dodać element do kontekstu React (Canvas2D)
          (receivedElementId: string, elementType: string, position: { x: number; y: number; z: number }, dimensions: { width: number; height: number }) => {
            console.log(`🔄 Callback z 3D: aktualizuję element ${receivedElementId}`, { position, dimensions })
            
            // Zaktualizuj wymiary elementu z rzeczywistymi wartościami z DAE
            updateElement(receivedElementId, {
              width: dimensions.width,
              height: dimensions.height
            })
            console.log(`📏 Zaktualizowano wymiary elementu ${receivedElementId}:`, dimensions)
          }
        )
      } catch (error) {
        console.error('❌ Błąd dodawania elementu 3D:', error)
      }
    }

    onElementSelect(null)
  }

  const handleAddGate = async () => {
    if (!selectedFence) {
      alert('Najpierw wybierz system ogrodzenia!')
      return
    }

    const position = getNextPosition('gate')
    
    // Dodaj element do kontekstu React (Canvas2D) i otrzymaj jego ID
    const elementId = addGate(position)
    console.log(`✅ Element dodany do React z ID: ${elementId}`)

    // Dodaj element do sceny 3D (jeśli funkcja jest dostępna)
    if ((window as any).addFenceElement) {
      try {
        await (window as any).addFenceElement(elementId, 'gate', position, selectedFence, undefined, // 🎯 Przekaż ID, brak wysokości dla bramy
          // Callback żeby dodać element do kontekstu React (Canvas2D)
          (receivedElementId: string, elementType: string, position: { x: number; y: number; z: number }, dimensions: { width: number; height: number }) => {
            console.log(`🔄 Callback z 3D: aktualizuję element ${receivedElementId}`, { position, dimensions })
            
            // Zaktualizuj wymiary elementu z rzeczywistymi wartościami z DAE
            updateElement(receivedElementId, {
              width: dimensions.width,
              height: dimensions.height
            })
            console.log(`📏 Zaktualizowano wymiary elementu ${receivedElementId}:`, dimensions)
          }
        )
      } catch (error) {
        console.error('❌ Błąd dodawania elementu 3D:', error)
      }
    }

    onElementSelect(null)
  }

  const handleAddDoor = async () => {
    if (!selectedFence) {
      alert('Najpierw wybierz system ogrodzenia!')
      return
    }

    const position = getNextPosition('door')
    
    // Dodaj element do kontekstu React (Canvas2D) i otrzymaj jego ID
    const elementId = addDoor(position)
    console.log(`✅ Element dodany do React z ID: ${elementId}`)

    // Dodaj element do sceny 3D (jeśli funkcja jest dostępna)
    if ((window as any).addFenceElement) {
      try {
        await (window as any).addFenceElement(elementId, 'door', position, selectedFence, undefined, // 🎯 Przekaż ID, brak wysokości dla drzwi
          // Callback żeby dodać element do kontekstu React (Canvas2D)
          (receivedElementId: string, elementType: string, position: { x: number; y: number; z: number }, dimensions: { width: number; height: number }) => {
            console.log(`🔄 Callback z 3D: aktualizuję element ${receivedElementId}`, { position, dimensions })
            
            // Zaktualizuj wymiary elementu z rzeczywistymi wartościami z DAE
            updateElement(receivedElementId, {
              width: dimensions.width,
              height: dimensions.height
            })
            console.log(`📏 Zaktualizowano wymiary elementu ${receivedElementId}:`, dimensions)
          }
        )
      } catch (error) {
        console.error('❌ Błąd dodawania elementu 3D:', error)
      }
    }

    onElementSelect(null)
  }

  const handleAddSection = async () => {
    if (!selectedFence) {
      alert('Najpierw wybierz system ogrodzenia!')
      return
    }

    const position = getNextPosition('section')
    const width = 2.0 // Domyślna szerokość sekcji
    
    // Dodaj element do kontekstu React (Canvas2D) i otrzymaj jego ID
    const elementId = addSection(position, width)
    console.log(`✅ Element dodany do React z ID: ${elementId}`)

    // Dodaj element do sceny 3D (jeśli funkcja jest dostępna)
    if ((window as any).addFenceElement) {
      try {
        await (window as any).addFenceElement(elementId, 'section', position, selectedFence, undefined, // 🎯 Przekaż ID, brak wysokości dla sekcji
          // Callback żeby dodać element do kontekstu React (Canvas2D)
          (receivedElementId: string, elementType: string, position: { x: number; y: number; z: number }, dimensions: { width: number; height: number }) => {
            console.log(`🔄 Callback z 3D: aktualizuję element ${receivedElementId}`, { position, dimensions })
            
            // Zaktualizuj wymiary elementu z rzeczywistymi wartościami z DAE
            updateElement(receivedElementId, {
              width: dimensions.width,
              height: dimensions.height
            })
            console.log(`📏 Zaktualizowano wymiary elementu ${receivedElementId}:`, dimensions)
          }
        )
      } catch (error) {
        console.error('❌ Błąd dodawania elementu 3D:', error)
      }
    }

    onElementSelect(null)
  }

  const handleReset = () => {
    if (window.confirm('Czy na pewno chcesz zresetować cały projekt?')) {
      if ((window as any).clearAllFenceElements && selectedFence) {
        ;(window as any).clearAllFenceElements(selectedFence)
      }
      resetProject()
      onElementSelect(null)
      setIsAddingSection(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        🛠️ Narzędzia
      </h3>
      
      {/* Status systemu - Kompaktowo */}
      {selectedFence && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="flex items-center space-x-2">
            <div className="text-lg">✅</div>
            <div>
              <p className="font-medium text-green-800">Ogrodzenie: {selectedFence.name}</p>
              <p className="text-green-600">Możesz dodawać elementy</p>
              <p className="text-green-500 text-xs">
                Elementy 3D: {selectedFence?.addedElements?.length || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Przyciski narzędzi - Kompaktowo */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={handleAddPost}
          disabled={!selectedFence}
          className="p-2 border rounded transition-all bg-blue-50 border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Dodaj słupek"
        >
          <div className="flex flex-col items-center space-y-1">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium">Słupek</span>
          </div>
        </button>
        
        {/* 🎯 WYSOKOŚĆ SŁUPKA */}
        <div className="col-span-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <label className="block text-xs font-medium text-blue-800 mb-1">
            🏗️ Wysokość słupka (bloki):
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="3"
              max="8"
              step="1"
              value={postHeight}
              onChange={(e) => setPostHeight(parseInt(e.target.value))}
              className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-medium text-blue-700 min-w-[2rem] text-center">
              {postHeight}
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {postHeight === 3 && 'Niski (3 bloki)'}
            {postHeight === 4 && 'Średni (4 bloki)'}
            {postHeight === 5 && 'Wysoki (5 bloki)'}
            {postHeight === 6 && 'Bardzo wysoki (6 bloki)'}
            {postHeight === 7 && 'Ekstra wysoki (7 bloki)'}
            {postHeight === 8 && 'Maksymalny (8 bloki)'}
          </div>
        </div>

        <button
          onClick={handleAddGate}
          disabled={!selectedFence}
          className="p-2 border rounded transition-all bg-green-50 border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Dodaj bramę"
        >
          <div className="flex flex-col items-center space-y-1">
            <Fence className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium">Brama</span>
          </div>
        </button>

        <button
          onClick={handleAddDoor}
          disabled={!selectedFence}
          className="p-2 border rounded transition-all bg-purple-50 border-purple-200 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Dodaj drzwi"
        >
          <div className="flex flex-col items-center space-y-1">
            <DoorOpen className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium">Drzwi</span>
          </div>
        </button>

        <button
          onClick={handleAddSection}
          disabled={!selectedFence}
          className={`p-2 border rounded transition-all ${
            isAddingSection 
              ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' 
              : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isAddingSection ? "Kliknij aby dodać sekcję" : "Dodaj sekcję"}
        >
          <div className="flex flex-col items-center space-y-1">
            <Minus className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium">
              {isAddingSection ? 'Dodaj' : 'Sekcja'}
            </span>
          </div>
        </button>
      </div>

      {/* Szerokość sekcji - Kompaktowo */}
      {isAddingSection && (
        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
          <label className="block text-xs font-medium text-orange-800 mb-1">
            Szerokość sekcji (m):
          </label>
          <input
            type="number"
            min="0.5"
            max="10"
            step="0.1"
            value={sectionWidth}
            onChange={(e) => setSectionWidth(parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-xs border border-orange-200 rounded"
          />
        </div>
      )}

      {/* Przycisk zamknij obwód */}
      <button
        onClick={() => {
          if ((window as any).closeFencePerimeter && selectedFence) {
            ;(window as any).closeFencePerimeter(selectedFence)
          }
        }}
        disabled={!selectedFence}
        className="w-full p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 hover:bg-blue-100 transition-colors text-xs mb-2"
        title="Zamknij obwód ogrodzenia"
      >
        🔗 Zamknij obwód
      </button>

      {/* Przycisk reset - Kompaktowo */}
      <button
        onClick={handleReset}
        className="w-full p-2 bg-red-50 border border-red-200 rounded text-red-700 hover:bg-red-100 transition-colors text-xs"
        title="Resetuj cały projekt"
      >
        🔄 Resetuj projekt
      </button>
    </div>
  )
}

export default ElementToolbar
