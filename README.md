# 🏆 FIFA WM 2026 – Turnierbaum-Predictor

Ein moderner, interaktiver Turnierbaum-Simulator für die FIFA Weltmeisterschaft 2026 in den USA, Mexiko und Kanada. Erstellt mit React und Vite.

Dieses Tool erlaubt es, die komplette WM von der Gruppenphase bis zum Finale durchzutippen – unterstützt durch echte Daten wie Marktwerte und Formkurven.

---

## ✨ Features (Aktuell)

* **Zwei-Tab Layout:** Nahtloser Wechsel zwischen "Gruppen & Analysen" und dem K.o.-"Turnierbaum".
* **Interaktive Gruppenphase:** Teams können per Drag & Drop innerhalb ihrer Gruppen (A bis L) sortiert werden.
* **Daten & Analysen:** Anzeige von Länder-Marktwerten (inkl. visueller Balken) und der Formkurve der letzten 5 Spiele (Hover-Effekt).
* **Beste Drittplatzierte:** Eigener Bereich zur Auswahl der 8 besten Gruppendritten, berechnet durch einen komplexen Solver, der entscheidet, wer gegen wen in der K.o.-Runde spielt (`solveThirds` Funktion).
* **Dynamischer K.o.-Baum:** 48-Team-Modus ab dem Sechzehntelfinale. Klicke auf ein Team im Match-Feld, um es eine Runde weiter zu bringen.
* **Siegwahrscheinlichkeiten:** Jedes Matchup in der K.o.-Phase berechnet automatisch eine Siegwahrscheinlichkeit basierend auf den kumulierten Marktwerten beider Teams (`calcProb` Funktion).

---

## 🚀 Roadmap (Geplant)

Folgende Features stehen im Backlog zur Umsetzung:
* **URL-Serialisierung (Share-Links):** Speicherung des Turnierbaums als Base64-String in der URL zum einfachen Teilen.
* **Auto-Fill / Simulation:** Automatische Berechnung von Gruppen und K.o.-Spielen via gewichtetem Zufall (basiert auf Marktwerten).
* **Head-to-Head (H2H) Modal:** Klick auf Partien öffnet ein Detail-Popup mit Stadion-Hintergrund, Anstoßzeit und Deep-Links (Transfermarkt & Google).
* **Live-Countdown:** Ein Timer im Header bis zum Eröffnungsspiel am 11. Juni 2026.

---

## 💻 Tech Stack

* **Framework:** React 18 (Strict Mode)
* **Build Tool:** Vite
* **Styling:** Tailwind CSS & Custom CSS
* **Icons:** Native Emojis (Flags)

---

## 🛠️ Architektur & Anpassung (Dev Guide)

Das gesamte Herzstück der Applikation liegt in der Datei `src/wm2026.jsx`. Hier ist ein kurzer Guide, wo Daten aktualisiert werden können:

### 1. Teams & Daten aktualisieren
Ganz oben in `wm2026.jsx` befinden sich die Konstanten:
* `FL`: Flaggen-Emojis der jeweiligen Länder.
* `MV`: Die Marktwerte in Millionen Euro. Einfach hier die Zahl anpassen (z.B. `"Mexiko": 165.8`).
* `FORM`: Array mit den letzten 5 Spielen im Format `"S/U/N Ergebnis vs Gegner"`.
* `INIT_GROUPS`: Die Zusammensetzung der Gruppen A bis L.

### 2. Turnierbaum & Spielorte anpassen
Die K.o.-Spiele sind in Arrays wie `R32`, `R16`, `QF` etc. definiert. 
* Jedes Objekt enthält eine ID (`id`), die Zuweisung der Teams (`a` und `b`) sowie den Austragungsort (`v`: z.B. "Los Angeles", "New York").

### 3. Styling
Viele Styles sind direkt via Tailwind (`className`) oder als Inline-Styles im JSX verankert. Globale Resets laufen über `index.css` (Tailwind Import).

---

## ⚙️ Lokale Entwicklung

1. Repository klonen
2. Abhängigkeiten installieren:
   ```bash
   npm install
