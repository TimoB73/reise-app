# Reise-App 🧭

Sightseeing-App für zwei Reisende als **Progressive Web App (PWA)**. Sie zeigt Sehenswürdigkeiten, Restaurants und die Geschichte der Region rund um euren Standort. Favoriten und Standort werden zwischen euren beiden Handys geteilt.

👉 **App öffnen:** https://timob73.github.io/reise-app/

## Funktionen

- 📍 **Standort** per GPS oder manuelle Ortssuche
- 🚶 **Highlights zu Fuß**: Sehenswürdigkeiten im Umkreis von 2 km mit Gehzeit, Kurzbeschreibung und Bild aus Wikipedia
- 🍽️ **Restaurants & Bars** im Umkreis von 2 km, Filter nach Art, Küche und „jetzt geöffnet“
- 🗺️ Umschaltbar zwischen **Liste und Karte**
- ☆ **Merken**, ✓ **Besucht** und ➜ **Route** (Apple Maps auf dem iPhone, sonst Google Maps)
- 🌙 Dunkelmodus nach Systemeinstellung, Offline-Grundfunktion

*In Arbeit: Kopplung zu zweit, Ziele mit dem Auto, Geschichte der Region.*

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

**Datenbank:** SQL-Migrationen liegen unter `supabase/migrations/` und werden im Supabase SQL Editor ausgeführt.
