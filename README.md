# Kost-Bet Konfigurator Ogrodzeń

Profesjonalny konfigurator ogrodzeń 2D/3D z kalkulacją cen materiałów.

## 🚀 Funkcje

### Główne funkcje konfiguratora:
- **Wybór systemu ogrodzeniowego** - załączane pliki obj, tif, mtl
- **Tryb projektowania 2D/3D** z widokiem domu (nowoczesny / klasyczny / brak)
- **Dodawanie elementów**: Słupek, Brama, Furtka, Przerwa / Przęsło
- **Modyfikacja elementów**: Suwak wysokości i szerokości
- **Rotacja słupków** - pełna kontrola nad orientacją
- **Zarządzanie układem**: Usuwanie poszczególnych elementów
- **Zerowanie całego projektu** - szybki reset
- **Zamknięcie obwodu** - automatyczne łączenie elementów
- **Moduł przeliczania ceny materiałów** - kalkulacja w czasie rzeczywistym

### Kalkulacja cen:
- Działa dynamicznie podczas projektowania
- Uwzględnia liczbę i typy dodanych elementów
- Wysokość i rotację słupków
- Rodzaj wybranego systemu ogrodzeniowego
- Stawki materiałowe (słupek: 50 zł, furtka: 600 zł, brama: 1200 zł)

### Dane wyjściowe:
- **Wydruk PDF** z rysunkiem technicznym i listą elementów
- **Lista materiałowa** z cenami jednostkowymi i łącznymi
- **Sumaryczna długość** ogrodzenia i liczba przęseł

## 🛠️ Technologie

- **Frontend**: React 18 + TypeScript
- **3D Graphics**: Three.js + React Three Fiber
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Build Tool**: Vite
- **3D Models**: OBJ, MTL, TIF formaty
- **Icons**: Lucide React (zoptymalizowane)

## 📦 Instalacja

1. **Sklonuj repozytorium:**
```bash
git clone <repository-url>
cd Kost-Bet
```

2. **Zainstaluj zależności:**
```bash
npm install
```

3. **Uruchom aplikację w trybie deweloperskim:**
```bash
npm run dev
```

4. **Otwórz przeglądarkę:**
```
http://localhost:3000
```

5. **Opcjonalnie - uruchom serwer API:**
```bash
npm start
```

## 🌐 Dostępne serwisy

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **API Endpoints**: http://localhost:3002/api

## 🏗️ Struktura projektu

```
src/
├── components/          # Komponenty React
│   ├── Canvas2D.tsx    # Widok 2D z Canvas API
│   ├── Canvas3D.tsx    # Widok 3D z Three.js
│   ├── ElementProperties.tsx  # Edycja właściwości
│   ├── ElementToolbar.tsx     # Pasek narzędzi
│   ├── FenceConfigurator.tsx  # Główny komponent
│   ├── HouseStyleSelector.tsx # Wybór stylu domu
│   ├── Layout.tsx             # Layout aplikacji
│   ├── PriceCalculator.tsx    # Kalkulator cen
│   ├── ProjectSummary.tsx     # Podsumowanie projektu
│   ├── SystemSelector.tsx     # Wybór systemu
│   └── ViewModeToggle.tsx     # Przełącznik widoku
├── contexts/           # Konteksty React
│   └── FenceContext.tsx       # Stan ogrodzenia
├── App.tsx            # Główna aplikacja
├── main.tsx           # Entry point
└── index.css          # Style globalne
```

## 🎯 Użytkowanie

### 1. Wybór systemu ogrodzeniowego
- Kliknij na jeden z dostępnych systemów
- System automatycznie załaduje pliki 3D (obj, mtl, tif)

### 2. Wybór stylu domu
- **Nowoczesny**: Minimalistyczny design z płaskimi dachami
- **Klasyczny**: Tradycyjna architektura z dachówką
- **Brak**: Projektowanie bez kontekstu domu

### 3. Dodawanie elementów
- **Słupek**: Kliknij przycisk "Słupek" i kliknij na canvas
- **Brama**: Kliknij przycisk "Brama" i kliknij na canvas
- **Furtka**: Kliknij przycisk "Furtka" i kliknij na canvas
- **Przęsło**: Kliknij przycisk "Przęsło", ustaw szerokość, kliknij na canvas

### 4. Edycja elementów
- Kliknij na element aby go wybrać
- Użyj suwaków w panelu właściwości:
  - Szerokość (0.1m - 10m)
  - Wysokość (1m - 4m)
  - Rotacja (0° - 360°)

### 5. Zarządzanie projektem
- **Zamknij obwód**: Automatyczne łączenie elementów
- **Resetuj projekt**: Usuwa wszystkie elementy
- **Eksportuj PDF**: Generuje dokument techniczny

## 🎨 Tryby widoku

### Widok 2D
- Plan ogrodzenia z góry
- Szybkie projektowanie i edycja
- Siatka pomocnicza
- Zoom i przesuwanie

### Widok 3D
- Realistyczny podgląd
- Tekstury i materiały
- Oświetlenie i cienie
- Kontrola kamery (orbit, zoom)

## 💰 Kalkulacja cen

### Stawki materiałowe:
- **Słupek**: 50 zł/szt.
- **Brama**: 1200 zł/szt.
- **Furtka**: 600 zł/szt.
- **Przęsło**: 100 zł/m

### Kalkulacja automatyczna:
- Cena aktualizuje się w czasie rzeczywistym
- Uwzględnia wymiary elementów
- Suma całkowita z podziałem na kategorie

## 📊 Eksport PDF

PDF zawiera:
- Rysunek techniczny 2D
- Lista materiałowa z cenami
- Wymiary i specyfikacje
- Podsumowanie kosztów
- Informacje o systemie ogrodzeniowym

## 🔧 Rozwój

### Uruchomienie w trybie deweloperskim:
```bash
npm run dev
```

### Budowanie produkcyjne:
```bash
npm run build
```

### Podgląd produkcyjny:
```bash
npm run preview
```

### Serwer deweloperski:
```bash
npm start
```

## 📁 Pliki 3D

Aplikacja obsługuje pliki:
- **OBJ**: Geometria 3D
- **MTL**: Materiały i tekstury
- **TIF**: Mapy tekstur

Pliki powinny być umieszczone w folderze `public/Ogrodzenie/`

## 🚨 Rozwiązane problemy

- ✅ **Brakujący pakiet**: `react-router-dom` dodany i zainstalowany
- ✅ **Błędne ikony**: Zastąpione nieistniejące ikony dostępnymi z lucide-react
- ✅ **Konflikt portów**: Frontend na 3000, API na 3002
- ✅ **PostCSS config**: Poprawiona składnia CommonJS

## 🤝 Wsparcie

W przypadku problemów:
1. Sprawdź konsolę przeglądarki
2. Upewnij się, że wszystkie zależności są zainstalowane
3. Sprawdź format plików 3D
4. Sprawdź czy porty 3000 i 3002 są wolne
5. Zgłoś błąd w systemie issue tracking

## 📄 Licencja

MIT License - zobacz plik LICENSE dla szczegółów.

## 👥 Autor

Kost-Bet - Profesjonalne ogrodzenia i systemy ogrodzeniowe.

---

**Uwaga**: Aplikacja wymaga nowoczesnej przeglądarki z obsługą WebGL dla widoku 3D.
