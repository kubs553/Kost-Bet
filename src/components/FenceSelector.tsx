import React, { useState } from 'react'
import { fenceCatalog, FenceConfig } from '../config/fenceConfigs'

interface FenceSelectorProps {
  onFenceSelect: (fence: FenceConfig | null) => void
  selectedFence?: FenceConfig
}

const FenceSelector: React.FC<FenceSelectorProps> = ({ onFenceSelect, selectedFence }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('gładkie')
  const [selectedSize, setSelectedSize] = useState<string>('all')
  const [selectedColor, setSelectedColor] = useState<string>('')

  // 🎯 INSTRUKCJA: Jak łatwo dodać nową wariację ogrodzenia:
  // 1. Edytuj plik src/config/fenceConfigs.ts
  // 2. Dodaj nową konfigurację używając createFenceConfig()
  // 3. Użyj createElementConfig() dla elementów
  // 4. Użyj createTextureConfig() dla tekstur
  // 
  // PRZYKŁAD:
  // createFenceConfig(
  //   'nowa_wariacja',
  //   'Nowa Wariacja',
  //   'kategoria',
  //   '100x50',
  //   ['Biały', 'Czarny'],
  //   '/sciezka/do/modelu.dae',
  //   '/sciezka/do/tekstur/',
  //   {
  //     post: createElementConfig(['0'], { 'group_0': createTextureConfig('wood', 'tekstura.jpg') }, 5, 0.7)
  //   }
  // )

  // Kategorie ogrodzeń
  const categories = [
    { id: 'gładkie', name: '🎨 Gładkie', icon: '🎨' },
    { id: 'slim', name: '🔲 Slim', icon: '🔲' },
    { id: 'royal', name: '👑 Royal', icon: '👑' },
    { id: 'łupane', name: '🧱 Łupane', icon: '🧱' },
    { id: 'płyty', name: '🏗️ Płyty', icon: '🏗️' },
    { id: 'gazon', name: '🌱 Gazon', icon: '🌱' },
    { id: 'daszki', name: '🏠 Daszki', icon: '🏠' },
    { id: 'vision', name: '👁️ Vision', icon: '👁️' }
  ]

  // Filtrowanie po wymiarach
  const sizeFilters = [
    { id: 'all', name: 'Wszystkie rozmiary' },
    { id: 'small', name: 'Małe (25x25 - 28x25)' },
    { id: 'medium', name: 'Średnie (80x25 - 100x30)' },
    { id: 'large', name: 'Duże (120x40)' }
  ]

  // Filtrowanie ogrodzeń
  const filteredFences = fenceCatalog.filter(fence => {
    const categoryMatch = selectedCategory === 'all' || fence.category === selectedCategory
    const sizeMatch = selectedSize === 'all' || 
      (selectedSize === 'small' && fence.dimensions.includes('25x')) ||
      (selectedSize === 'medium' && (fence.dimensions.includes('80x') || fence.dimensions.includes('100x'))) ||
      (selectedSize === 'large' && fence.dimensions.includes('120x'))
    
    return categoryMatch && sizeMatch
  })

  // Obsługa wyboru ogrodzenia
  const handleFenceSelect = (fence: FenceConfig) => {
    onFenceSelect(fence)
    setSelectedColor('') // Resetuj kolor przy zmianie ogrodzenia
  }

  // Obsługa wyboru koloru
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    if (selectedFence) {
      // Tutaj możesz dodać logikę zmiany koloru w 3D
      console.log(`🎨 Wybrano kolor: ${color} dla ${selectedFence.name}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">🏗️ Wybierz System Ogrodzenia</h2>
      
      {/* Filtry */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Kategoria */}
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2">📂 Kategoria:</h3>
          <div className="grid grid-cols-4 gap-1">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-1.5 rounded border-2 transition-all text-xs ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm mb-0.5">{category.icon}</div>
                <div className="font-medium text-xs">{category.name.split(' ')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Rozmiar */}
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2">📏 Rozmiar:</h3>
          <div className="flex gap-1">
            {sizeFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedSize(filter.id)}
                className={`px-2 py-1 text-xs rounded border transition-all ${
                  selectedSize === filter.id
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista ogrodzeń - Kompaktowo z lepszym wykorzystaniem przestrzeni */}
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">
          🎯 Ogrodzenia ({filteredFences.length}):
        </h3>
        <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
          {filteredFences.map(fence => (
            <div
              key={fence.id}
              className={`p-2 rounded border-2 cursor-pointer transition-all ${
                selectedFence?.id === fence.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-blue-25'
              }`}
              onClick={() => handleFenceSelect(fence)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-xs mb-1">{fence.name}</h4>
                  <p className="text-xs text-gray-600">📐 {fence.dimensions}</p>
                </div>
                <div className="text-xs text-blue-600 ml-2">
                  {fence.modelPath ? '✅' : '❌'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                🎨 {fence.colors.length} kolorów
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Wybór koloru - Kompaktowo */}
      {selectedFence && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">
            🎨 Kolor: {selectedFence.name}
          </h3>
          <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
            {selectedFence.colors.map(color => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`p-1.5 rounded border-2 transition-all text-xs ${
                  selectedColor === color
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={color}
              >
                <div className="font-medium truncate text-xs">{color}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Podsumowanie wyboru - Kompaktowo */}
      {selectedFence && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-xs font-semibold text-blue-800">✅ Wybrane:</h3>
            <button
              onClick={() => onFenceSelect(null)}
              className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="Zmień ogrodzenie"
            >
              🔄
            </button>
          </div>
          <div className="text-xs space-y-0.5">
            <div><span className="font-medium">Typ:</span> {selectedFence.name}</div>
            <div><span className="font-medium">Wymiary:</span> {selectedFence.dimensions}</div>
            <div><span className="font-medium">Kolor:</span> {selectedColor || 'Nie wybrano'}</div>
          </div>
          {selectedFence.modelPath && (
            <div className="mt-1 text-green-600 text-xs">
              🎯 Model 3D dostępny
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FenceSelector
