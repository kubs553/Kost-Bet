# Tekstury dla Three.js 3D

## 📁 Struktura katalogu

```
public/textures/
├── grass.jpg          # Tekstura trawy dla podłoża
├── brick.jpg          # Tekstura cegły dla domu
├── wood.jpg           # Tekstura drewna dla ogrodzeń
├── metal.jpg          # Tekstura metalu dla bram
└── concrete.jpg       # Tekstura betonu dla słupków
```

## 🎨 Jak dodać tekstury

### 1. **Format plików**
- **Zalecane**: JPG, PNG
- **Rozmiar**: 512x512px lub 1024x1024px
- **Waga**: Maksymalnie 1MB na plik

### 2. **Nazewnictwo**
- Używaj małych liter
- Bez spacji (używaj `-` lub `_`)
- Rozszerzenie `.jpg` lub `.png`

### 3. **Przykładowe tekstury**
Możesz pobrać darmowe tekstury z:
- [Pixabay](https://pixabay.com/textures/)
- [Unsplash](https://unsplash.com/s/photos/texture)
- [Pexels](https://www.pexels.com/search/texture/)

## 🔧 Jak używać w kodzie

```typescript
// Załaduj teksturę
const texture = new THREE.TextureLoader().load('/textures/grass.jpg')

// Zastosuj do materiału
const material = new THREE.MeshLambertMaterial({ 
  map: texture,
  color: 0x4a7c59 
})
```

## 📱 Optymalizacja

- **Kompresuj** tekstury przed dodaniem
- **Używaj** mniejszych rozmiarów dla mobilnych
- **Testuj** na różnych urządzeniach

## 🚀 Gotowe tekstury

Po dodaniu tekstur do tego katalogu, będą automatycznie używane w scenie 3D:

- **grass.jpg** → Podłoże (trawa)
- **brick.jpg** → Dom (cegły)
- **wood.jpg** → Elementy ogrodzeniowe
- **metal.jpg** → Bramy i drzwi
- **concrete.jpg** → Słupki

## 💡 Wskazówki

1. **Trawa**: Użyj tekstury z powtarzalnym wzorem
2. **Cegły**: Tekstura powinna być realistyczna
3. **Drewno**: Naturalne kolory i wzory
4. **Metal**: Odpowiedni połysk i kolor
5. **Beton**: Neutralne kolory i faktura

