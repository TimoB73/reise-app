# Reise-App 🧭

Sightseeing-App für zwei Reisende als **Progressive Web App (PWA)**. Sie zeigt Sehenswürdigkeiten, Restaurants und die Geschichte der Region rund um euren Standort. Favoriten und Standort werden zwischen euren beiden Handys geteilt.

👉 **App öffnen:** https://timob73.github.io/reise-app/

## Funktionen

- 📍 **Standort** per GPS oder manuelle Ortssuche
- 🚶 **Highlights zu Fuß**: Sehenswürdigkeiten im Umkreis von 2 km mit Gehzeit, Kurzbeschreibung und Bild aus Wikipedia
- 🍽️ **Restaurants & Bars** im Umkreis von 2 km, Filter nach Art, Küche und „jetzt geöffnet“
- 🗺️ Umschaltbar zwischen **Liste und Karte**
- ☆ **Merken**, ✓ **Besucht** und ➜ **Route** (Apple Maps auf dem iPhone, sonst Google Maps)
- 👫 **Reise zu zweit**: Handys per 6-stelligem Code oder QR-Code koppeln, Merklisten und Besuche live teilen, Standort des Partners auf der Karte (abschaltbar, nur bei geöffneter App)
- ⭐ **Merkliste** mit eigenen und den Orten des Partners
- 🌙 Dunkelmodus nach Systemeinstellung, Offline-Grundfunktion

*In Arbeit: Ziele mit dem Auto, Geschichte der Region.*

## Reise zu zweit koppeln

1. Eine Person tippt auf der Startseite auf **„Zu zweit unterwegs?“** → **„Neue Reise anlegen“**, gibt Reisename, Daten und ihren Namen ein.
2. Die App zeigt einen **6-stelligen Code** und einen **QR-Code**.
3. Die zweite Person wählt **„Reise beitreten“** und scannt den QR-Code (📷) oder tippt den Code ein.
4. Fertig – ab jetzt seht ihr gegenseitig, was gemerkt oder besucht wurde.

Nach dem Enddatum wird die Reise archiviert: Alles bleibt lesbar, kann aber nicht mehr geändert werden.
Wurde die App auf einem Handy gelöscht, kann die Person, die die Reise angelegt hat, unter **„Reise“ → „Partner-Platz freigeben“** einen neuen Beitritt ermöglichen.

## App auf dem Handy installieren

Die App muss nicht aus einem App Store geladen werden. Man legt sie einfach auf den Home-Bildschirm.

### iPhone / iPad (Safari)
1. Link oben **in Safari** öffnen (nicht in Chrome oder einer In-App-Ansicht).
2. Unten auf das **Teilen**-Symbol tippen (Quadrat mit Pfeil nach oben).
3. Nach unten scrollen und **„Zum Home-Bildschirm“** wählen.
4. Auf **„Hinzufügen“** tippen. Das Reise-Symbol erscheint auf dem Home-Bildschirm.

> Wichtig: Öffnet die App danach immer über das Symbol auf dem Home-Bildschirm. Safari und die installierte App speichern ihre Daten getrennt.

### Android (Chrome)
1. Link oben in **Chrome** öffnen.
2. Oben rechts auf das **⋮-Menü** tippen.
3. **„App installieren“** bzw. **„Zum Startbildschirm hinzufügen“** wählen und bestätigen.

## Updates

Neue Versionen werden automatisch geladen. Falls etwas veraltet aussieht: App komplett schließen und neu öffnen.

## Datenquellen

Kartendaten © OpenStreetMap-Mitwirkende (ODbL) · Overpass API · Nominatim · openrouteservice (HeiGIT) · Wikipedia (CC BY-SA) · Wikidata (CC0) · Wikimedia Commons. Details im Info-Bereich der App (ⓘ).

---

## Für Entwickler

**Stack:** React, Vite, TypeScript, Tailwind CSS, vite-plugin-pwa, Leaflet, Supabase.

```bash
npm install
cp .env.example .env.local   # Werte eintragen (nur lokal, nie committen)
npm run dev                  # Entwicklungsserver
npm test                     # Vitest
npm run build                # Produktions-Build nach dist/
npm run icons                # PNG-Icons aus public/icon.svg neu erzeugen
```

**Deployment:** Jeder Push auf `main` baut die App per GitHub Actions (`.github/workflows/deploy.yml`) und veröffentlicht sie auf GitHub Pages. Die Keys kommen aus den Repository Secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` und `VITE_ORS_API_KEY`.

**Datenbank:** SQL-Migrationen liegen unter `supabase/migrations/` und werden in Reihenfolge im Supabase SQL Editor ausgeführt (jede Datei genau einmal). Voraussetzung in Supabase: *Authentication → Sign In / Providers → Anonymous sign-ins* aktiviert.

| Datei | Inhalt |
|---|---|
| `0001_init.sql` | Tabellen `trips`, `members`, `favorites`, `positions`, RLS-Regeln, Funktionen `create_trip`, `join_trip`, `remove_partner`, Realtime |
