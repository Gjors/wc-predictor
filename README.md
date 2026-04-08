# 🏆 FIFA WM 2026 – Turnierbaum-Predictor

Ein moderner, interaktiver Turnierbaum-Simulator für die FIFA Weltmeisterschaft 2026 in den USA, Mexiko und Kanada. Erstellt mit React und Vite.

Dieses Tool erlaubt es, die komplette WM von der Gruppenphase bis zum Finale durchzutippen – unterstützt durch echte Daten wie Marktwerte und Formkurven. Das Projekt ist modular aufgebaut, um einfache Erweiterungen und optimale Wartbarkeit zu garantieren.

---

## ✨ Features (Aktuell)

* **Zwei-Tab Layout:** Nahtloser Wechsel zwischen "Gruppen & Analysen" und dem K.o.-"Turnierbaum".
* **Interaktive Gruppenphase:** Teams können per Drag & Drop (mit optimierter Touch-Unterstützung für Mobile) innerhalb ihrer Gruppen sortiert werden.
* **Daten & Analysen:** Anzeige von Länder-Marktwerten (inkl. visueller Balken) und der Formkurve der letzten 5 Spiele (Hover/Touch-Effekt).
* **Beste Drittplatzierte:** Eigener Bereich zur Auswahl der 8 besten Gruppendritten, berechnet durch einen komplexen Solver, der logisch entscheidet, wer in der K.o.-Runde wo platziert wird.
* **Dynamischer K.o.-Baum:** 48-Team-Modus ab dem Sechzehntelfinale. Klicke auf ein Team im Match-Feld, um es eine Runde weiter zu bringen.
* **Siegwahrscheinlichkeiten:** Jedes Matchup in der K.o.-Phase berechnet automatisch eine Siegwahrscheinlichkeit basierend auf den kumulierten Marktwerten beider Teams.

---

## 🚀 Roadmap (Geplant)

Folgende Features stehen im Backlog zur Umsetzung:
* **URL-Serialisierung (Share-Links):** Speicherung des Turnierbaums als Base64-String in der URL zum einfachen Teilen ohne Datenbank.
* **Auto-Fill / Simulation:** Automatische Berechnung von Gruppen und K.o.-Spielen via gewichtetem Zufall.
* **Head-to-Head (H2H) Modal:** Klick auf Partien öffnet ein Detail-Popup mit Stadion-Hintergrund, Anstoßzeit und Deep-Links (Transfermarkt & Google).
* **Live-Countdown:** Ein Timer im Header bis zum Eröffnungsspiel am 11. Juni 2026.

---

## 💻 Tech Stack

* **Framework:** React 18
* **Build Tool:** Vite
* **Styling:** Tailwind CSS & Custom CSS
* **Icons:** Native Emojis (Flags)

---

## 🛠️ Architektur & Dateistruktur (Dev Guide)

Das Projekt nutzt eine komponentenbasierte Architektur. Die Logik und die Daten sind strikt von der Benutzeroberfläche (UI) getrennt. 

### Wo passe ich Daten an? (`src/data/`)
* **`constants.js`:** Hier liegen alle statischen Daten. Passe hier die `MV` (Marktwerte in Mio. €), `FORM` (letzte 5 Spiele), `INIT_GROUPS` (Zusammensetzung der Vorrunde) oder die `FL` (Flaggen-Emojis) an.
* **`bracket.js`:** Definiert die Geometrie und die Spielansetzungen (`R32`, `R16`, etc.) des Turnierbaums.

### Wo finde ich die Logik? (`src/utils/`)
* **`helpers.js`:** Beinhaltet alle berechnenden Funktionen, die kein HTML rendern (z.B. Wahrscheinlichkeitsrechnung `calcProb`, Formatierungen `fmtMV` oder den `solveThirds` Algorithmus).

### Wo passe ich das Design an? (`src/components/`)
* **`GroupTable.jsx`:** Das UI für die Tabellen der Gruppenphase (inkl. Drag & Drop Logik).
* **`ThirdSel.jsx`:** Das UI-Panel zur Auswahl der besten Drittplatzierten.
* **`MCard.jsx`:** Das einzelne kleine "Match-Ticket" innerhalb des Turnierbaums.
* **`Bracket.jsx`:** Die Zusammensetzung der K.o.-Runde (inkl. SVG-Verbindungslinien und dem Weltmeister-Banner).

### Der Main Controller (`src/wm2026.jsx`)
Diese Datei hält alles zusammen. Sie verwaltet den globalen React-State (`groups`, `winners`, `selThirds`), rendert das Header-Layout und reicht die Daten an die Komponenten weiter.

---

## ⚙️ Lokale Entwicklung

1. Repository klonen
2. Abhängigkeiten installieren:
   ```bash
   npm install
