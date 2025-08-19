// 🎯 KONFIGURACJA OGRODZEŃ - Wspólny plik dla FenceSelector i ThreeJSCanvas3D

export interface FenceElementConfig {
  groups: string[]
  textures: Record<string, {
    type: 'wood' | 'metal'
    diffuse: string
    normal?: string
    roughness?: string
    metalness?: string
    ao?: string
  }>
  defaultHeight?: number
  spacing?: number
  positioning?: Record<string, { y: number }>
  rotation?: { x: number; y: number; z: number }
}

export interface FenceConfig {
  id: string
  name: string
  category: string
  dimensions: string
  colors: string[]
  modelPath: string
  texturePath: string
  elements: {
    post?: FenceElementConfig
    section?: FenceElementConfig
    gate?: FenceElementConfig
    door?: FenceElementConfig
  }
  materials?: {
    wood: {
      roughness: number
      metalness: number
      envMapIntensity: number
      side: 'FrontSide' | 'DoubleSide'
      flatShading: boolean
    }
    metal: {
      roughness: number
      metalness: number
      envMapIntensity: number
      side: 'FrontSide' | 'DoubleSide'
      flatShading: boolean
    }
  }
  autoSection?: {
    enabled: boolean
    delay: number
    position: 'center' | 'left' | 'right'
  }
  camera?: {
    minDistance: number
    zoomSpeed: number
    minPolarAngle: number
    maxPolarAngle: number
  }
}

// 🎯 FUNKCJE POMOCNICZE: Tworzenie konfiguracji
export const createElementConfig = (
  groups: string[],
  textures: Record<string, any>,
  defaultHeight?: number,
  spacing?: number,
  positioning?: Record<string, { y: number }>,
  rotation?: { x: number; y: number; z: number }
): FenceElementConfig => ({
  groups,
  textures,
  ...(defaultHeight && { defaultHeight }),
  ...(spacing && { spacing }),
  ...(positioning && { positioning }),
  rotation: rotation || { x: 1.5708, y: 3.1416, z: 0 }
})

export const createTextureConfig = (
  type: 'wood' | 'metal',
  diffuse: string,
  normal?: string,
  roughness?: string,
  metalness?: string,
  ao?: string
) => ({
  type,
  diffuse,
  ...(normal && { normal }),
  ...(roughness && { roughness }),
  ...(metalness && { metalness }),
  ...(ao && { ao })
})

export const createFenceConfig = (
  id: string,
  name: string,
  category: string,
  dimensions: string,
  colors: string[],
  modelPath: string,
  texturePath: string,
  elements: any,
  materials?: any,
  autoSection?: any,
  camera?: any
): FenceConfig => ({
  id,
  name,
  category,
  dimensions,
  colors,
  modelPath,
  texturePath,
  elements,
  materials: materials || {
    wood: { roughness: 0.8, metalness: 0.1, envMapIntensity: 1.0, side: 'DoubleSide', flatShading: false },
    metal: { roughness: 0.3, metalness: 0.9, envMapIntensity: 1.2, side: 'DoubleSide', flatShading: false }
  },
  autoSection: autoSection || { enabled: true, delay: 200, position: 'center' },
  camera: camera || { minDistance: 2.0, zoomSpeed: 0.5, minPolarAngle: 0, maxPolarAngle: 1.5708 }
})

// 🎯 KATALOG OGRODZEŃ
export const fenceCatalog: FenceConfig[] = [
  // GŁADKIE
  createFenceConfig(
    'gładkie_max',
    'Gładkie Max',
    'gładkie',
    '120x40',
    ['Biały', 'Szary', 'Grafit', 'A12 Frappe'],
    '/Ogrodzenie/gladkie_max_dae/',
    '/Ogrodzenie/textures/gladkie_max/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        6,
        0.65
      ),
      section: createElementConfig(
        ['group_13', 'group_14', 'group_15', 'group_16'],
        {
          'group_13': createTextureConfig('metal', 'Aluminum.jpg'),
          'group_14': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_15': createTextureConfig('wood', 'material_1.jpg'),
          'group_16': createTextureConfig('wood', 'material_1_0.jpg')
        },
        undefined,
        undefined,
        {
          'group_13': { y: 0.09 },
          'group_14': { y: 0.0 },
          'group_15': { y: 0.1 },
          'group_16': { y: 0.2 }
        }
      )
    }
  ),
  
  createFenceConfig(
    'gładkie_long',
    'Gładkie Long',
    'gładkie',
    '100x30',
    ['Biały', 'Szary', 'Grafit A6 Marago', 'A12 Frappe'],
    '/Ogrodzenie/gladkie_long_dae/',
    '/Ogrodzenie/textures/gladkie_long/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        6,
        0.65
      ),
      section: createElementConfig(
        ['group_13', 'group_14', 'group_15', 'group_16'],
        {
          'group_13': createTextureConfig('metal', 'Aluminum.jpg'),
          'group_14': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_15': createTextureConfig('wood', 'material_1.jpg'),
          'group_16': createTextureConfig('wood', 'material_1_0.jpg')
        },
        undefined,
        undefined,
        {
          'group_13': { y: 0.09 },
          'group_14': { y: 0.0 },
          'group_15': { y: 0.1 },
          'group_16': { y: 0.2 }
        }
      )
    }
  ),
  
  // 🎯 GLADKIE MEDIUM - PEŁNA KONFIGURACJA (przykład)
  createFenceConfig(
    'gładkie_medium',
    'Gładkie Medium',
    'gładkie',
    '80x25',
    ['Biały', 'Szary', 'Grafit', 'Latte', 'A6 Marago', 'A12 Frappe'],
    '/Ogrodzenie/gladkie_medium_dae/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/gladkie_medium_dae',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        6,
        0.65
      ),
      section: createElementConfig(
        ['group_13', 'group_14', 'group_15', 'group_16'],
        {
          'group_13': createTextureConfig('metal', 'Aluminum.jpg'),
          'group_14': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_15': createTextureConfig('wood', 'material_1.jpg'),
          'group_16': createTextureConfig('wood', 'material_1_0.jpg')
        },
        undefined,
        undefined,
        {
          'group_13': { y: 0.09 },
          'group_14': { y: 0.0 },
          'group_15': { y: 0.1 },
          'group_16': { y: 0.2 }
        }
      ),
      gate: createElementConfig(
        ['group_18', 'group_19'],
        {
          'group_18': createTextureConfig('metal', 'Aluminum.jpg'),
          'group_19': createTextureConfig('metal', 'Aluminum.jpg')
        }
      ),
      door: createElementConfig(
        ['group_17'],
        {
          'group_17': createTextureConfig('wood', 'material_1.jpg')
        }
      )
    }
  ),
  
  // SLIM
  createFenceConfig(
    'slim_3d',
    'Slim 3D',
    'slim',
    '25x25, 26,5x25, 28x25, 25x27, 26,5x37,5, 28x75, 26,5x75',
    ['Biały', 'Grafit', 'A6 Marago', 'A12 Frappe'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/slim_3d/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        4, // Slim ma mniejszą wysokość
        0.5 // Mniejszy odstęp dla slim
      ),
      section: createElementConfig(
        ['group_13', 'group_14', 'group_15'],
        {
          'group_13': createTextureConfig('metal', 'Aluminum.jpg'),
          'group_14': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_15': createTextureConfig('wood', 'material_1.jpg')
        },
        undefined,
        undefined,
        {
          'group_13': { y: 0.08 },
          'group_14': { y: 0.0 },
          'group_15': { y: 0.08 }
        }
      )
    }
  ),
  
  createFenceConfig(
    'slim',
    'Slim',
    'slim',
    '25x60',
    ['Biały', 'Grafit', 'Latte', 'Lungo', 'Espresso', 'A4 Czekolada', 'A5 Toffi', 'A6 Marago', 'A6 S', 'A7 Wanilia', 'A8 Mocca', 'A11 Cappucino', 'A12 Frappe'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/slim/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        4,
        0.5
      ),
      section: createElementConfig(
        ['group_13', 'group_14', 'group_15'],
        {
          'group_13': createTextureConfig('metal', 'Aluminum.jpg'),
          'group_14': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_15': createTextureConfig('wood', 'material_1.jpg')
        },
        undefined,
        undefined,
        {
          'group_13': { y: 0.08 },
          'group_14': { y: 0.0 },
          'group_15': { y: 0.08 }
        }
      )
    }
  ),
  
  // ROYAL
  createFenceConfig(
    'royal',
    'Royal',
    'royal',
    '20x25, 20x50, 40x50',
    ['Biały', 'Grafit', 'Latte', 'Lungo', 'Espresso', 'A4 Czekolada', 'A5 Toffi', 'A6 Marago', 'A6 S', 'A7 Wanilia', 'A8 Mocca', 'A10 Romano', 'A12 Frappe'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/royal/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        5,
        0.6
      )
    }
  ),
  
  // ŁUPANE MURO
  createFenceConfig(
    'łupane_muro',
    'Łupane Muro',
    'łupane',
    '22x38x8, 22x38x12, 22x38x16, 38x38x8, 38x38x12, 38x38x16',
    ['Biały Forte', 'Biały', 'Fredo', 'Grafit', 'Latte', 'Lungo', 'A1 Złota Jesień', 'A3 Złota Jesień', 'A4 Czekolada', 'A5 Toffi', 'A6 Marago', 'A7 Wanilia', 'A8 Mocca', 'A11 Cappucino', 'A12 Frappe'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/łupane_muro/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        6,
        0.7
      )
    }
  ),
  
  // PŁYTY ELEWACYJNE
  createFenceConfig(
    'płyta_elewacyjna',
    'Płyta Elewacyjna',
    'płyty',
    '8x38, 12x38, 16x38',
    ['Biały Forte', 'Biały', 'Fredo', 'Grafit', 'Lungo', 'Latte', 'A4 Czekolada', 'A5 Toffi', 'A6 Marago', 'A7 Wanilia', 'A8 Mocca', 'A11 Cappucino', 'A12 Frappe'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/płyta_elewacyjna/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        3,
        0.4
      )
    }
  ),
  
  // GAZON
  createFenceConfig(
    'gazon',
    'Gazon',
    'gazon',
    '34,5x27,8, 50x39,5',
    ['Szary', 'Grafit', 'Brąz', 'Czerwony', 'A1 Złota Jesień', 'A4 Czekolada', 'A5 Toffi', 'A6 Marago', 'A8 Mocca'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/gazon/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        4,
        0.5
      )
    }
  ),
  
  // DASZKI
  createFenceConfig(
    'daszek_gładki_royal',
    'Daszek Gładki Royal',
    'daszki',
    '40x50, 20x50',
    ['Biały', 'Grafit', 'Latte', 'Lungo', 'Espresso', 'A4 Czekolada', 'A5 Toffi', 'A6 Marago', 'A6 S', 'A7 Wanilia', 'A8 Mocca', 'A10 Romano', 'A11 Cappucino', 'A12 Frappe'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/daszek_royal/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        3,
        0.4
      )
    }
  ),
  
  // VISION
  createFenceConfig(
    'long_vision',
    'Long Vision',
    'vision',
    '100x30',
    ['25 kolorów'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/long_vision/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        6,
        0.65
      )
    }
  ),
  
  createFenceConfig(
    'max_vision',
    'Max Vision',
    'vision',
    '120x40',
    ['25 kolorów'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/max_vision/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        7,
        0.8
      )
    }
  ),
  
  createFenceConfig(
    'medium_vision',
    'Medium Vision',
    'vision',
    '80x25',
    ['25 kolorów'],
    '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.dae',
    '/Ogrodzenie/textures/medium_vision/',
    {
      post: createElementConfig(
        ['group_0', 'group_1'],
        {
          'group_0': createTextureConfig('wood', 'material_1_0.jpg'),
          'group_1': createTextureConfig('wood', 'material_1.jpg')
        },
        6,
        0.65
      )
    }
  )
]

// 🎯 FUNKCJA: Pobieranie konfiguracji po ID
export const getFenceConfig = (fenceId: string): FenceConfig | undefined => {
  return fenceCatalog.find(f => f.id === fenceId)
}

// 🎯 FUNKCJA: Pobieranie konfiguracji po ID i kolorze
export const getFenceConfigWithColor = (fenceId: string, color?: string): FenceConfig | undefined => {
  const config = getFenceConfig(fenceId)
  if (!config) return undefined
  
  // W przyszłości można dodać logikę dla różnych kolorów
  return config
}
