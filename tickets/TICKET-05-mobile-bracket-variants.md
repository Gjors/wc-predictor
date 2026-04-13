# TICKET-05 — Mobile Turnierbaum-Redesign (Konzepte A/B/C)

## Hintergrund

Der aktuelle horizontale Turnierbaum (`FullBracket`) ist für Desktop optimiert:
vier Runden links, Finale in der Mitte, vier Runden rechts (insgesamt ~1.200 px
breit). Auf mobilen Geräten führt das zu zwei Problemen:

1. **Endloses Scrollen** — horizontal *und* vertikal, um an den eigenen Pick zu
   kommen.
2. **Orientierungsverlust** — das Auge verliert den Zusammenhang zwischen den
   Runden, weil immer nur ein kleiner Ausschnitt sichtbar ist.

Ziel dieses Tickets ist es, **drei alternative Darstellungen** parallel bereit-
zustellen, damit wir nach einem echten Praxistest entscheiden können, welche
Variante auf Mobile dauerhaft eingesetzt wird.

## User Story

> Als mobiler Nutzer möchte ich den K.o.-Baum auf meinem Smartphone komfortabel
> bedienen können, ohne mich im horizontalen Zoom-Chaos zu verlieren. Als
> Entwickler/Product-Owner möchte ich drei Alternativen live nebeneinander
> testen und anschließend anhand der Nutzung entscheiden, welche Variante
> Standard wird.

## Konzepte

### Konzept A — Vertikaler "Inverted Tree"

- Pokal/Champion-Banner steht ganz oben.
- Darunter sektionsweise von groß nach klein: **Finale → Halbfinale →
  Viertelfinale → Achtelfinale → Sechzehntelfinale**.
- Jede Runde erhält eine eigene Überschrift.
- Matches werden in einem vollflächigen 1- oder 2-Spalten-Grid gestapelt.
- **Vorteil:** Der Endzustand des Turniers ist auf einen Blick greifbar; der
  Nutzer arbeitet sich nach unten zur Basis vor.
- **Nachteil:** 16 R32-Matches bedeuten am Ende viel vertikales Scrollen.

### Konzept B — Runden-Tabs

- Segmentierte Tab-Leiste: **R32 | R16 | VF | HF | Finale**.
- Pro Runde wird nur die jeweilige Matches-Liste angezeigt.
- Jedes Match bekommt viel Platz (groß tippbar).
- Oben bleibt der Champion-Banner sichtbar.
- **Vorteil:** Kein Scroll-Marathon, immer nur eine Runde im Fokus, perfekt
  fürs Durchtippen von "unten nach oben".
- **Nachteil:** Verlorener Gesamtüberblick — die Runden-Verkettung muss man
  sich im Kopf zusammenbauen.

### Konzept C — Champion-Pfad

- Der Nutzer wählt oben per Dropdown eine Mannschaft (Standard: das Team mit
  dem höchsten Marktwert, bzw. der aktuell gepickte Weltmeister).
- Angezeigt wird ausschließlich der **Pfad dieses Teams** durch das Turnier:
  fünf Matches von R32 bis Finale.
- Gegner in späteren Runden ergeben sich aus den bereits getippten Siegern.
- **Vorteil:** Emotionaler "What if my team wins?"-Flow, sehr kurzer Screen.
- **Nachteil:** Der Rest des Turniers ist nicht sichtbar — eignet sich eher
  für Fan-Sharing als für das komplette Durchtippen.

## Akzeptanzkriterien

- [ ] In der K.o.-Ansicht erscheint ein Umschalter mit den Optionen
  **Klassisch / Vertikal / Tabs / Pfad**.
- [ ] Der Umschalter funktioniert auf Mobile und Desktop.
- [ ] Alle drei neuen Varianten sind **voll funktionsfähig**: Klicken auf ein
  Team wählt den Sieger, die Auswahl propagiert über `clearDown` durch den Baum
  und bleibt beim Variantenwechsel erhalten.
- [ ] Der bestehende horizontale Baum (`FullBracket`) bleibt als "Klassisch"
  unverändert verfügbar.
- [ ] Sprach-Umschaltung (DE/EN) greift in allen Varianten.
- [ ] Simulation (`simulateBracketFn`) und Reset funktionieren unverändert;
  die Ergebnisse werden in jeder Variante korrekt gerendert.
- [ ] URL-State-Sharing (Base64) enthält weiterhin nur `groups`, `selThirds`,
  `winners` — die gewählte Variante ist Session-lokal und wird **nicht** in
  der URL persistiert.
- [ ] Es wird keine bestehende Funktionalität entfernt.

## Technische Notizen

- Neue Komponente: `src/components/BracketVariants.jsx` mit drei Exports
  `BracketVertical`, `BracketTabs`, `BracketPath` + interner `FlowCard` und
  `ChampBanner` (die existierende `MCard` nutzt `position: absolute` und ist
  daher für Flow-Layouts ungeeignet).
- Neuer State in `wm2026.jsx`: `bracketVariant` (`"classic" | "vertical" |
  "tabs" | "path"`), Default `"classic"`.
- Zusätzliche Keys im `UI_DICT` (DE + EN):
  `bracketVariant`, `variantClassic`, `variantVertical`, `variantTabs`,
  `variantPath`, `selectTeam`, `noPath`.
- `BracketPath` nutzt `r32Team()` aus `helpers.js`, um die Startposition eines
  Teams zu finden, und wandert über die `a`/`b`-Referenzen der späteren
  Runden nach oben.

## Entscheidungsprozess

Nach einer Testphase entscheidet der Product-Owner (user), welche der drei
Varianten dauerhaft als Mobile-Default übernommen wird. Die nicht gewählten
Varianten werden in einem Folge-Ticket entfernt oder als versteckte Optionen
belassen.
