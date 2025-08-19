import React, { useState, useRef } from 'react'
import { useFence } from '../contexts/FenceContext'
import {
  HouseStyleSelector,
  ElementToolbar,
  Canvas2D,
  ThreeJSCanvas3D,
  ElementProperties,
  PriceCalculator,
  ProjectSummary,
  FenceSelector
} from '.'

const FenceConfigurator: React.FC = () => {
  const { state, dispatch } = useFence()
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [resetCounter, setResetCounter] = useState(0)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Debug - viewMode:', state.viewMode)
    console.log('🔍 Debug - renderuję komponent:', state.viewMode === '3D' ? 'ThreeJSCanvas3D' : 'Canvas2D')
  }, [state.viewMode])

  // Obsługa eventów z 3D canvas
  React.useEffect(() => {
    const handleToggleLeftSidebar = () => setShowLeftSidebar(!showLeftSidebar)
    const handleToggleRightSidebar = () => setShowRightSidebar(!showRightSidebar)
    const handleToggleViewMode = () => {
      dispatch({ type: 'SET_VIEW_MODE', payload: state.viewMode === '3D' ? '2D' : '3D' })
    }

    window.addEventListener('toggleLeftSidebar', handleToggleLeftSidebar)
    window.addEventListener('toggleRightSidebar', handleToggleRightSidebar)
    window.addEventListener('toggleViewMode', handleToggleViewMode)

    return () => {
      window.removeEventListener('toggleLeftSidebar', handleToggleLeftSidebar)
      window.removeEventListener('toggleRightSidebar', handleToggleRightSidebar)
      window.removeEventListener('toggleViewMode', handleToggleViewMode)
    }
  }, [showLeftSidebar, showRightSidebar, state.viewMode, dispatch])

  const handleReset = () => {
    dispatch({ type: 'RESET_PROJECT' })
    setSelectedElementId(null)
    setResetCounter(prev => prev + 1)
  }
  
  // 🎯 DEBUG: Handler dla wyboru elementu
  const handleElementSelect = (elementId: string) => {
    console.log(`🎯 FenceConfigurator: handleElementSelect wywołane z elementId: ${elementId}`)
    console.log(`🎯 Poprzedni selectedElementId: ${selectedElementId}`)
    setSelectedElementId(elementId)
    console.log(`🎯 Nowy selectedElementId: ${elementId}`)
  }

  const handleFenceSelect = (fence: any) => {
    dispatch({ type: 'SELECT_SYSTEM', payload: fence })
    console.log('🎯 Wybrano ogrodzenie:', fence)
    // Tutaj możesz dodać logikę ładowania odpowiedniego modelu 3D
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Full Screen Layout */}
      <div className="flex h-screen relative">
        {/* Overlay dla mobilnych sidebarów */}
        {((showLeftSidebar && window.innerWidth < 768) || (showRightSidebar && window.innerWidth < 1024)) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
            onClick={() => {
              setShowLeftSidebar(false)
              setShowRightSidebar(false)
            }}
          />
        )}

        {/* Left Sidebar - Fence Selection & Controls */}
        <div className={`${showLeftSidebar ? 'block' : 'hidden'} md:block w-80 lg:w-96 bg-white border-r border-gray-200 overflow-y-auto absolute md:relative z-10 h-full`}>
          <div className="p-4 space-y-4">
            {/* Fence Selector - Główny komponent */}
            <FenceSelector onFenceSelect={handleFenceSelect} selectedFence={state.selectedSystem} />
            
            {/* House Style */}
            <HouseStyleSelector />
            
            {/* Element Toolbar */}
            <ElementToolbar onElementSelect={setSelectedElementId} selectedFence={state.selectedSystem} />
          </div>
        </div>

        {/* Center - 3D Canvas */}
        <div className="flex-1 bg-gray-100">
          <div className="h-full">
            {state.viewMode === '3D' ? (
              <ThreeJSCanvas3D
                elements={state.elements}
                selectedElementId={selectedElementId}
                onElementSelect={handleElementSelect}
                fenceSystem={state.selectedSystem}
                houseStyle={state.selectedHouseStyle}
                onReset={() => handleReset()}
                selectedFence={state.selectedSystem}
                viewMode={state.viewMode}
                resetCounter={resetCounter}
              />
            ) : (
              <Canvas2D
                elements={state.elements}
                selectedElementId={selectedElementId}
                onElementSelect={setSelectedElementId}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties & Info */}
        <div className={`${showRightSidebar ? 'block' : 'hidden'} lg:block w-72 lg:w-80 bg-white border-l border-gray-200 overflow-y-auto absolute right-0 lg:relative z-10 h-full`}>
          <div className="p-4 space-y-3">
            {selectedElementId && (() => {
              console.log(`🎯 FenceConfigurator: Szukam elementu ${selectedElementId}`)
              console.log(`🎯 FenceConfigurator: Wszystkie elementy w stanie:`, state.elements)
              console.log(`🎯 FenceConfigurator: Typ selectedElementId:`, typeof selectedElementId)
              console.log(`🎯 FenceConfigurator: Typy ID elementów:`, state.elements.map(el => ({ id: el.id, idType: typeof el.id, type: el.type })))
              
              const selectedElement = state.elements.find(el => el.id === selectedElementId)
              console.log(`🎯 FenceConfigurator: Znaleziony element:`, selectedElement)
              
              return selectedElement ? (
                <ElementProperties
                  element={selectedElement}
                  onUpdate={(updates) => {
                    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElementId, updates } })
                  }}
                  onDelete={() => {
                    dispatch({ type: 'REMOVE_ELEMENT', payload: selectedElementId })
                    setSelectedElementId(null)
                  }}
                />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>Element nie został znaleziony</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Szukam: "{selectedElementId}"<br/>
                    Dostępne: {state.elements.map(el => `"${el.id}"`).join(', ')}
                  </p>
                  <button 
                    onClick={() => setSelectedElementId(null)}
                    className="mt-2 px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                  >
                    Wyczyść wybór
                  </button>
                </div>
              )
            })()}
            <PriceCalculator />
            <ProjectSummary onReset={handleReset} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FenceConfigurator
