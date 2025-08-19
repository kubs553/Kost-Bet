import React from 'react'
import { useFence } from '../contexts/FenceContext'
import { HouseStyle } from '../contexts/FenceContext'
import { Home, Building2, X } from 'lucide-react'

const HouseStyleSelector: React.FC = () => {
  const { state, dispatch } = useFence()

  const availableStyles: HouseStyle[] = [
    {
      id: 'modern',
      name: 'Nowoczesny',
      model: '/models/house-modern.glb'
    },
    {
      id: 'classic',
      name: 'Klasyczny',
      model: '/models/house-classic.glb'
    }
  ]

  const handleStyleSelect = (style: HouseStyle | null) => {
    dispatch({ type: 'SELECT_HOUSE_STYLE', payload: style })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        🏠 Styl domu
      </h3>
      
      <div className="space-y-2">
        {/* Brak domu */}
        <div
          className={`p-2 border rounded cursor-pointer transition-all ${
            !state.selectedHouseStyle
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleStyleSelect(null)}
        >
          <div className="flex items-center space-x-2">
            <X className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">Brak domu</h4>
              <p className="text-xs text-gray-500">Projektowanie bez kontekstu</p>
            </div>
            
            {!state.selectedHouseStyle && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Dostępne style */}
        {availableStyles.map((style) => (
          <div
            key={style.id}
            className={`p-2 border rounded cursor-pointer transition-all ${
              state.selectedHouseStyle?.id === style.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleStyleSelect(style)}
          >
            <div className="flex items-center space-x-2">
              {style.id === 'modern' ? (
                <Building2 className="h-4 w-4 text-blue-500" />
              ) : (
                <Home className="h-4 w-4 text-amber-500" />
              )}
              
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{style.name}</h4>
                <p className="text-xs text-gray-500">
                  {style.id === 'modern' ? 'Minimalistyczny' : 'Tradycyjny'}
                </p>
              </div>
              
              {state.selectedHouseStyle?.id === style.id && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HouseStyleSelector
