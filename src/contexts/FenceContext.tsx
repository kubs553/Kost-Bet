import React, { createContext, useContext, useReducer, ReactNode } from 'react'

export interface FenceElement {
  id: string
  type: 'post' | 'gate' | 'door' | 'section'
  position: { x: number; y: number; z: number }
  rotation: number
  width: number
  height: number
  material: string
  price: number
}

export interface FenceSystem {
  id: string
  name: string
  objFile: string
  mtlFile: string
  textureFile: string
  daeFile: string // 🎯 Dodaję właściwość daeFile
  texturePath: string // 🎨 Ścieżka do folderu z teksturami
  basePrice: number
}

export interface HouseStyle {
  id: string
  name: string
  model: string
}

export interface FenceState {
  selectedSystem: FenceSystem | null
  selectedHouseStyle: HouseStyle | null
  elements: FenceElement[]
  viewMode: '2D' | '3D'
  totalLength: number
  totalPrice: number
  isClosed: boolean
}

type FenceAction =
  | { type: 'SELECT_SYSTEM'; payload: FenceSystem }
  | { type: 'SELECT_HOUSE_STYLE'; payload: HouseStyle | null }
  | { type: 'SET_VIEW_MODE'; payload: '2D' | '3D' }
  | { type: 'ADD_ELEMENT'; payload: FenceElement }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; updates: Partial<FenceElement> } }
  | { type: 'REMOVE_ELEMENT'; payload: string }
  | { type: 'ROTATE_ELEMENT'; payload: { id: string; rotation: number } }
  | { type: 'RESET_PROJECT' }
  | { type: 'CLOSE_PERIMETER' }
  | { type: 'UPDATE_TOTALS' }

const initialState: FenceState = {
  selectedSystem: null,
  selectedHouseStyle: null,
  elements: [],
  viewMode: '2D',
  totalLength: 0,
  totalPrice: 0,
  isClosed: false,
}

function fenceReducer(state: FenceState, action: FenceAction): FenceState {
  switch (action.type) {
    case 'SELECT_SYSTEM':
      return { ...state, selectedSystem: action.payload }
    
    case 'SELECT_HOUSE_STYLE':
      return { ...state, selectedHouseStyle: action.payload }
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    
    case 'ADD_ELEMENT':
      const newState = { 
        ...state, 
        elements: [...state.elements, action.payload],
        isClosed: false
      }
      // Automatycznie aktualizuj totala
      const newTotalLength = newState.elements.reduce((sum, el) => sum + el.width, 0)
      const newTotalPrice = newState.elements.reduce((sum, el) => sum + el.price, 0)
      return { 
        ...newState, 
        totalLength: newTotalLength, 
        totalPrice: newTotalPrice 
      }
    
    case 'UPDATE_ELEMENT':
      const updatedState = {
        ...state,
        elements: state.elements.map(el =>
          el.id === action.payload.id ? { ...el, ...action.payload.updates } : el
        )
      }
      // Automatycznie aktualizuj totala
      const updatedTotalLength = updatedState.elements.reduce((sum, el) => sum + el.width, 0)
      const updatedTotalPrice = updatedState.elements.reduce((sum, el) => sum + el.price, 0)
      return { 
        ...updatedState, 
        totalLength: updatedTotalLength, 
        totalPrice: updatedTotalPrice 
      }
    
    case 'REMOVE_ELEMENT':
      const removedState = {
        ...state,
        elements: state.elements.filter(el => el.id !== action.payload),
        isClosed: false
      }
      // Automatycznie aktualizuj totala
      const removedTotalLength = removedState.elements.reduce((sum, el) => sum + el.width, 0)
      const removedTotalPrice = removedState.elements.reduce((sum, el) => sum + el.price, 0)
      return { 
        ...removedState, 
        totalLength: removedTotalLength, 
        totalPrice: removedTotalPrice 
      }
    
    case 'ROTATE_ELEMENT':
      return {
        ...state,
        elements: state.elements.map(el =>
          el.id === action.payload.id ? { ...el, rotation: action.payload.rotation } : el
        )
      }
    
    case 'RESET_PROJECT':
      return {
        ...state,
        elements: [],
        totalLength: 0,
        totalPrice: 0,
        isClosed: false
      }
    
    case 'CLOSE_PERIMETER':
      return { ...state, isClosed: true }
    
    case 'UPDATE_TOTALS':
      const totalLength = state.elements.reduce((sum, el) => sum + el.width, 0)
      const totalPrice = state.elements.reduce((sum, el) => sum + el.price, 0)
      return { ...state, totalLength, totalPrice }
    
    default:
      return state
  }
}

interface FenceContextType {
  state: FenceState
  dispatch: React.Dispatch<FenceAction>
  addPost: (position: { x: number; y: number; z: number }, dimensions?: { width: number; height: number }) => string
  addGate: (position: { x: number; y: number; z: number }, dimensions?: { width: number; height: number }) => string
  addDoor: (position: { x: number; y: number; z: number }, dimensions?: { width: number; height: number }) => string
  addSection: (position: { x: number; y: number; z: number }, width: number, height?: number) => string
  removeElement: (id: string) => void
  updateElement: (id: string, updates: Partial<FenceElement>) => void
  rotateElement: (id: string, rotation: number) => void
  resetProject: () => void
  closePerimeter: () => void
  updateTotals: () => void
  onReset?: () => void // Callback dla resetowania sceny
}

const FenceContext = createContext<FenceContextType | undefined>(undefined)

export function FenceProvider({ children, onReset }: { children: ReactNode, onReset?: () => void }) {
  const [state, dispatch] = useReducer(fenceReducer, initialState)

  const addPost = (position: { x: number; y: number; z: number }, dimensions?: { width: number; height: number }): string => {
    const element: FenceElement = {
      id: `post-${Date.now()}`,
      type: 'post',
      position,
      rotation: 0,
      width: dimensions?.width || 0.2, // Użyj wymiarów z DAE lub domyślnych
      height: dimensions?.height || 2.0, // Użyj wymiarów z DAE lub domyślnych
      material: state.selectedSystem?.id || 'default',
      price: 50
    }
    dispatch({ type: 'ADD_ELEMENT', payload: element })
    return element.id
  }

  const addGate = (position: { x: number; y: number; z: number }, dimensions?: { width: number; height: number }): string => {
    const element: FenceElement = {
      id: `gate-${Date.now()}`,
      type: 'gate',
      position,
      rotation: 0,
      width: dimensions?.width || 3.0, // Użyj wymiarów z DAE lub domyślnych
      height: dimensions?.height || 2.0, // Użyj wymiarów z DAE lub domyślnych
      material: state.selectedSystem?.id || 'default',
      price: 1200
    }
    dispatch({ type: 'ADD_ELEMENT', payload: element })
    return element.id
  }

  const addDoor = (position: { x: number; y: number; z: number }, dimensions?: { width: number; height: number }): string => {
    const element: FenceElement = {
      id: `door-${Date.now()}`,
      type: 'door',
      position,
      rotation: 0,
      width: dimensions?.width || 1.0, // Użyj wymiarów z DAE lub domyślnych
      height: dimensions?.height || 2.0, // Użyj wymiarów z DAE lub domyślnych
      material: state.selectedSystem?.id || 'default',
      price: 600
    }
    dispatch({ type: 'ADD_ELEMENT', payload: element })
    return element.id
  }

  const addSection = (position: { x: number; y: number; z: number }, width: number, height?: number): string => {
    const element: FenceElement = {
      id: `section-${Date.now()}`,
      type: 'section',
      position,
      rotation: 0,
      width,
      height: height || 1.5, // Użyj wysokości z DAE lub domyślnej
      material: state.selectedSystem?.id || 'default',
      price: width * 100 // 100 zł za metr
    }
    dispatch({ type: 'ADD_ELEMENT', payload: element })
    return element.id
  }

  const removeElement = (id: string) => {
    dispatch({ type: 'REMOVE_ELEMENT', payload: id })
  }

  const updateElement = (id: string, updates: Partial<FenceElement>) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id, updates } })
  }

  const rotateElement = (id: string, rotation: number) => {
    dispatch({ type: 'ROTATE_ELEMENT', payload: { id, rotation } })
  }

  const resetProject = () => {
    dispatch({ type: 'RESET_PROJECT' })
    // Wywołaj callback jeśli istnieje
    if (onReset) {
      onReset()
    }
  }

  const closePerimeter = () => {
    dispatch({ type: 'CLOSE_PERIMETER' })
  }

  const updateTotals = () => {
    const totalLength = state.elements.reduce((sum, el) => sum + el.width, 0)
    const totalPrice = state.elements.reduce((sum, el) => sum + el.price, 0)
    dispatch({ type: 'UPDATE_TOTALS' })
  }

  const value: FenceContextType = {
    state,
    dispatch,
    addPost,
    addGate,
    addDoor,
    addSection,
    removeElement,
    updateElement,
    rotateElement,
    resetProject,
    closePerimeter,
    updateTotals,
    onReset
  }

  return (
    <FenceContext.Provider value={value}>
      {children}
    </FenceContext.Provider>
  )
}

export function useFence() {
  const context = useContext(FenceContext)
  if (context === undefined) {
    throw new Error('useFence must be used within a FenceProvider')
  }
  return context
}
