# 🏆 FIFA WM 2026 – Turnierbaum-Predictor

Ein moderner, interaktiver Turnierbaum-Simulator für die FIFA Weltmeisterschaft 2026 in den USA, Mexiko und Kanada. Erstellt mit React und Vite.

Dieses Tool erlaubt es, die komplette WM von der Gruppenphase bis zum Finale durchzutippen – unterstützt durch echte Daten wie Marktwerte und Formkurven. Das Projekt ist modular aufgebaut, um einfache Erweiterungen und optimale Wartbarkeit zu garantieren.

---

## ✨ Features (Aktuell)

* **Zwei-Tab Layout:** Nahtloser Wechsel zwischen "Gruppen & Analysen" und dem K.o.-"Turnierbaum".
* **Interaktive Gruppenphase:** Teams können per Drag & Drop (mit optimierter Touch-Unterstützung für Mobile) innerhalb ihrer Gruppen sortiert werden.
* **Auto-Fill & Simulation:** Automatische Berechnung der Gruppenphase und K.o.-Spiele per Knopfdruck. Jeder Durchlauf generiert einen neuen, einzigartigen Turnierverlauf mit realistischen Überraschungen (Details siehe "Der Simulations-Algorithmus").
* **Daten & Analysen:** Anzeige von Länder-Marktwerten (inkl. visueller Balken) und der Formkurve der letzten 5 Spiele (Hover/Touch-Effekt).
* **Beste Drittplatzierte:** Eigener Bereich zur Auswahl der 8 besten Gruppendritten, berechnet durch einen komplexen Solver, der logisch entscheidet, wer in der K.o.-Runde wo platziert wird.
* **Dynamischer K.o.-Baum:** 48-Team-Modus ab dem Sechzehntelfinale. Klicke auf ein Team im Match-Feld, um es manuell eine Runde weiter zu bringen.

---

## 🎲 Der Simulations-Algorithmus (Gewichteter Zufall)

Die integrierte Auto-Fill-Funktion entscheidet Spiele nicht rein nach Favoritenrolle, sondern nutzt einen gewichteten Zufall basierend auf den Transfermarkt-Kaderwerten. Das sorgt für realistische "Upsets" (Überraschungssiege).

1. **Gruppenphase:** Für jede Gruppe werden die 4 Teams nacheinander "gezogen". Je höher der Marktwert (MV), desto wahrscheinlicher wird ein Team früher gezogen. 
   * *Formel:* `Wahrscheinlichkeit = MV_Team / Summe_MV_verbleibende_Teams`
   * *Beispiel:* Deutschland (773 Mio.) hat eine deutlich höhere Chance auf Platz 1 als Curaçao (14 Mio.), ein Patzer ist aber mathematisch möglich.
2. **Beste Drittplatzierte:** Die drittplatzierten Teams aller 12 Gruppen erhalten einen Score: `MV * Zufallsfaktor (0.5 bis 1.5)`. Die Top 8 dieses Scores kommen weiter. Starke Dritte haben so bessere Chancen, schwächere können sich durch Losglück aber ebenfalls durchsetzen.
3. **K.o.-Runde:** Für jedes direkte Duell wird die Siegwahrscheinlichkeit berechnet. 
   * *Formel:* `Gewinnwahrscheinlichkeit Team A = MV_A / (MV_A + MV_B)`
   * *Beispiele:* England (1.620 Mio.) gewinnt gegen Panama (22 Mio.) in ~99% der Fälle. Ein Giganten-Duell wie Frankreich (1.360 Mio.) gegen Spanien (1.310 Mio.) ist hingegen ein 51/49 Münzwurf.

---

## 🚀 Roadmap (Geplant)

Folgende Features stehen im Backlog zur Umsetzung:
* **URL-Serialisierung (Share-Links):** Speicherung des Turnierbaums als Base64-String in der URL zum einfachen Teilen ohne Datenbank.
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
* **`helpers.js`:** Beinhaltet alle berechnenden Funktionen (z.B. Simulations-Wahrscheinlichkeitsrechnung `calcProb`, Formatierungen `fmtMV` oder den `solveThirds` Algorithmus).

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
