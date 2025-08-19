# Instrukcja instalacji i uruchomienia

## 🚀 Szybkie uruchomienie

### 1. Sprawdź wymagania
- Node.js 18+ (zalecane 20+)
- npm lub yarn
- Nowoczesna przeglądarka z obsługą WebGL

### 2. Instalacja zależności
```bash
npm install
```

### 3. Uruchomienie aplikacji
```bash
npm run dev
```

### 4. Otwórz przeglądarkę
```
http://localhost:3000
```

## 🔧 Szczegółowa instalacja

### Krok 1: Klonowanie repozytorium
```bash
git clone <repository-url>
cd Kost-Bet
```

### Krok 2: Instalacja zależności
```bash
# Instalacja wszystkich pakietów
npm install

# Lub używając yarn
yarn install
```

### Krok 3: Konfiguracja plików 3D
Upewnij się, że pliki 3D są w folderze `public/Ogrodzenie/`:
- `Ogrodzenei gładkie Medium - konfigurator.obj`
- `Ogrodzenei gładkie Medium - konfigurator.mtl`
- `_1.tif`

### Krok 4: Uruchomienie serwera deweloperskiego
```bash
npm run dev
```

### Krok 5: Uruchomienie serwera API (opcjonalnie)
```bash
npm start
```

## 🌐 Dostępne endpointy

### Frontend
- **Aplikacja główna**: http://localhost:3000
- **Hot reload**: Automatyczny przy zmianach kodu

### Backend API (port 3002)
- **Status**: http://localhost:3002/api/health
- **Systemy ogrodzeniowe**: http://localhost:3002/api/systems
- **Style domów**: http://localhost:3002/api/house-styles
- **Upload systemu**: POST http://localhost:3002/api/upload-system
- **Eksport PDF**: POST http://localhost:3002/api/export-pdf

## 📁 Struktura plików

```
Kost-Bet/
├── public/                    # Pliki statyczne
│   ├── Ogrodzenie/           # Pliki 3D systemów
│   ├── exports/              # Wyeksportowane projekty
│   └── demo-project.json     # Przykładowy projekt
├── src/                      # Kod źródłowy
│   ├── components/           # Komponenty React
│   ├── contexts/             # Konteksty React
│   ├── App.tsx              # Główna aplikacja
│   └── index.css            # Style globalne
├── server/                   # Serwer Express
│   └── index.js             # API endpoints
├── package.json              # Zależności i skrypty
├── vite.config.ts           # Konfiguracja Vite
├── tailwind.config.js       # Konfiguracja Tailwind
└── README.md                # Dokumentacja
```

## 🛠️ Skrypty npm

```bash
# Uruchomienie w trybie deweloperskim
npm run dev

# Budowanie produkcyjne
npm run build

# Podgląd produkcyjny
npm run preview

# Uruchomienie serwera API
npm start
```

## 🔍 Rozwiązywanie problemów

### Problem: Błąd PostCSS
```
SyntaxError: Unexpected token 'export'
```
**Rozwiązanie**: Upewnij się, że `postcss.config.js` używa składni CommonJS (`module.exports`)

### Problem: Błąd Three.js
```
Cannot resolve 'three/examples/jsm/controls/OrbitControls'
```
**Rozwiązanie**: Zaktualizuj wersję Three.js w `package.json`

### Problem: Błąd portu
```
Port 3000 is already in use
```
**Rozwiązanie**: Zmień port w `vite.config.ts` lub zatrzymaj inne aplikacje

### Problem: Błąd ikon lucide-react
```
Module '"lucide-react"' has no exported member 'Cube'
```
**Rozwiązanie**: Zastąp nieistniejące ikony dostępnymi (np. `Box3d` zamiast `Cube`)

### Problem: Pliki 3D nie ładują się
**Rozwiązanie**: 
1. Sprawdź czy pliki są w `public/Ogrodzenie/`
2. Sprawdź konsolę przeglądarki pod kątem błędów CORS
3. Uruchom serwer API: `npm start`

## 🎯 Funkcje do testowania

### 1. Podstawowe funkcje
- [ ] Wybór systemu ogrodzeniowego
- [ ] Przełączanie między widokami 2D/3D
- [ ] Dodawanie elementów (słupki, bramy, furtki, przęsła)

### 2. Edycja elementów
- [ ] Zmiana wymiarów (szerokość, wysokość)
- [ ] Rotacja elementów
- [ ] Usuwanie elementów

### 3. Kalkulacja cen
- [ ] Automatyczne przeliczanie cen
- [ ] Lista materiałowa
- [ ] Suma całkowita

### 4. Eksport
- [ ] Generowanie PDF
- [ ] Zapisywanie projektu

## 🚨 Ważne uwagi

1. **Pliki 3D**: Upewnij się, że pliki OBJ, MTL i TIF są dostępne
2. **WebGL**: Aplikacja wymaga obsługi WebGL w przeglądarce
3. **Porty**: Frontend na 3000, API na 3002
4. **Hot Reload**: Automatyczne odświeżanie przy zmianach kodu
5. **Ikony**: Używaj tylko dostępnych ikon z pakietu lucide-react

## 📞 Wsparcie

W przypadku problemów:
1. Sprawdź konsolę przeglądarki
2. Sprawdź logi serwera
3. Upewnij się, że wszystkie zależności są zainstalowane
4. Sprawdź wersje Node.js i npm
5. Sprawdź czy porty 3000 i 3002 są wolne

## 🔄 Aktualizacje

```bash
# Aktualizacja zależności
npm update

# Aktualizacja do najnowszych wersji
npm audit fix

# Sprawdzenie przestarzałych pakietów
npm outdated
```

---

**Gotowe!** 🎉 Aplikacja powinna działać na http://localhost:3000
