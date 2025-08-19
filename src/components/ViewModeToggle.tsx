import React from 'react'
import { useFence } from '../contexts/FenceContext'
import { Square, Box } from 'lucide-react'

const ViewModeToggle: React.FC = () => {
  const { state, dispatch } = useFence()

  const handleViewModeChange = (mode: '2D' | '3D') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        👁️ Tryb widoku
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleViewModeChange('2D')}
          className={`p-2 border rounded transition-all ${
            state.viewMode === '2D'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex flex-col items-center space-y-1">
            <Square className="h-5 w-5" />
            <span className="font-medium text-xs">2D</span>
            <p className="text-xs text-center">
              Plan z góry
            </p>
          </div>
        </button>

        <button
          onClick={() => handleViewModeChange('3D')}
          className={`p-2 border rounded transition-all ${
            state.viewMode === '3D'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex flex-col items-center space-y-1">
            <Box className="h-5 w-5" />
            <span className="font-medium text-xs">3D</span>
            <p className="text-xs text-center">
              Perspektywa 3D
            </p>
          </div>
        </button>
      </div>

      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
        <p className="text-gray-600">
          <strong>Aktywny:</strong> {state.viewMode === '2D' ? '2D' : '3D'}
        </p>
      </div>
    </div>
  )
}

export default ViewModeToggle
