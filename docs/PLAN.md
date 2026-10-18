# Umsetzungsplan

## Entscheidungen
- Jede Person gibt beim Anlegen/Beitreten einen eigenen **Anzeigenamen** ein.
- „Gemerkt“ und „Besucht“ gelten **pro Person** (jeder hat eigene Favoriten, sieht aber die des Partners).
- QR-Scanner direkt in der App (iOS trennt Safari- und PWA-Speicher).
- Gehzeit wird lokal geschätzt (Luftlinie × 1,3 bei 4,8 km/h), Fahrzeiten über die ORS-Matrix.
- Hash-Routing (`#/…`), damit GitHub Pages keine 404-Fehler liefert.
- Ortssuche (Nominatim) nur per „Suchen“-Knopf, keine Autovervollständigung (Nutzungsregeln von Nominatim).
- Cache pro ~500-m-Rasterzelle: POIs 24 h, Ortsnamen 7 Tage, Wikipedia 14 Tage (IndexedDB).

## Phasen
1. Gerüst, PWA, Deployment auf GitHub Pages
2. Ortserkennung + Kategorien 1 (Highlights zu Fuß) und 5 (Restaurants & Bars)
3. Supabase-Pairing + geteilte Favoriten + Partnerposition
4. Isochronen (Kategorien 2 und 3) inkl. Wikidata-Ranking
5. Geschichte der Region inkl. Edge Function (Claude-Zusammenfassung)

## Datenmodell (Phase 3)
- `trips`: id, name, start_date, end_date, code (6-stellig), created_by
- `members`: trip_id, user_id, display_name (max. 2 pro Reise, Beitritt über RPC `join_trip`)
- `favorites`: trip_id, user_id, poi_id, name, kind, lat, lng, saved (bool), visited (bool) – „Gemerkt“ und „Besucht“ unabhängig voneinander
- `positions`: trip_id, user_id, lat, lng, updated_at
- RLS: nur Mitglieder lesen; Schreiben nur bis einschließlich Enddatum (1 Tag Puffer für Zeitzonen).
- Code: 6 Zeichen aus `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (ohne 0/O/1/I/L), ~1 Mrd. Kombinationen.
- Favoriten werden nie gelöscht, nur auf saved=false/visited=false gesetzt (Realtime liefert DELETE-Ereignisse ohne RLS-Filter).
- Position: Senden bei ≥ 25 m Bewegung (min. alle 10 s) und als Herzschlag alle 60 s; älter als 3 min = „App geschlossen“ → nicht angezeigt.
- Karte: Farblegende; Blau = du, Orange = Partner, gelber Rand = gemerkt.
