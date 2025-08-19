import React from 'react'
import { useFence } from '../contexts/FenceContext'
import { FenceSystem } from '../contexts/FenceContext'

const SystemSelector: React.FC = () => {
  const { state, dispatch } = useFence()

  const availableSystems: FenceSystem[] = [
    {
      id: 'smooth-medium',
      name: 'Ogrodzenie gładkie Medium',
      objFile: '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.obj',
      mtlFile: '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.mtl',
      textureFile: '/Ogrodzenie/_1.tif',
      daeFile: '/Ogrodzenie/gladkie_medium_dae/Ogrodzenei gładkie Medium - konfigurator.dae', // 🎯 Poprawiona ścieżka do folderu DAE
      texturePath: '/Ogrodzenie/gladkie_medium_dae', // 🎨 Ścieżka do tekstur w folderze DAE (tam gdzie są pliki .dae)
      basePrice: 150
    },
    {
      id: 'smooth-premium',
      name: 'Ogrodzenie gładkie Premium',
      objFile: '/Ogrodzenie/smooth-premium.obj',
      mtlFile: '/Ogrodzenie/smooth-premium.mtl',
      textureFile: '/Ogrodzenie/smooth-premium.tif',
      daeFile: '/Ogrodzenie/smooth-premium.dae', // 🎯 Dodaję plik DAE
      texturePath: '/Ogrodzenie/textures/smooth-premium', // 🎨 Ścieżka do tekstur
      basePrice: 200
    },
    {
      id: 'decorative-classic',
      name: 'Ogrodzenie dekoracyjne Klasyczne',
      objFile: '/Ogrodzenie/decorative-classic.obj',
      mtlFile: '/Ogrodzenie/decorative-classic.mtl',
      textureFile: '/Ogrodzenie/decorative-classic.tif',
      daeFile: '/Ogrodzenie/decorative-classic.dae', // 🎯 Dodaję plik DAE
      texturePath: '/Ogrodzenie/textures/decorative-classic', // 🎨 Ścieżka do tekstur
      basePrice: 250
    }
  ]

  const handleSystemSelect = (system: FenceSystem) => {
    dispatch({ type: 'SELECT_SYSTEM', payload: system })
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        System ogrodzeniowy
      </h3>
      
      {state.selectedSystem && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🎯</div>
            <div>
              <h4 className="font-medium text-blue-800">Wybrany system:</h4>
              <p className="text-sm text-blue-600">
                {state.selectedSystem.name} - {state.selectedSystem.basePrice} zł/m²
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {availableSystems.map((system) => (
          <div
            key={system.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              state.selectedSystem?.id === system.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleSystemSelect(system)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{system.name}</h4>
                <p className="text-sm text-gray-500">
                  Cena bazowa: {system.basePrice} zł/m²
                </p>
              </div>
              
              {state.selectedSystem?.id === system.id && (
                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            
            {state.selectedSystem?.id === system.id && (
              <div className="mt-3 pt-3 border-t border-primary-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Plik 3D: {system.objFile.split('/').pop()}</p>
                  <p>Materiał: {system.mtlFile.split('/').pop()}</p>
                  <p>Tekstura: {system.textureFile.split('/').pop()}</p>
                </div>
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-700">
                    ✅ System aktywny - możesz dodawać elementy ogrodzenia
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!state.selectedSystem && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-xl">⚠️</div>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Wybierz system ogrodzeniowy</strong> aby rozpocząć projektowanie
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Po wyborze systemu będziesz mógł dodawać słupki, bramy, furtki i przęsła
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemSelector
