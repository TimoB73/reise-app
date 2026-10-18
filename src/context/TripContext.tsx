import type { RealtimeChannel } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { applyRemoteRecord, localFavorites, switchToLocal, switchToRemote, type FavoriteRecord } from '../lib/favorites'
import type { LatLng } from '../lib/geo'
import { ensureUserId, supabase, toAppError } from '../lib/supabase'
import {
  isArchived,
  pickCurrentTrip,
  POSITION_HEARTBEAT_MS,
  shouldSendPosition,
  type Member,
  type PositionRow,
  type Trip,
} from '../lib/trip'
import { useLocation } from './LocationContext'

interface TripState {
  configured: boolean
  loading: boolean
  userId: string | null
  trips: Trip[]
  trip: Trip | null
  archived: boolean
  members: Member[]
  me: Member | null
  partner: Member | null
  partnerPosition: PositionRow | null
  sharePosition: boolean
  setSharePosition: (on: boolean) => void
  createTrip: (input: { name: string; start: string; end: string; displayName: string }) => Promise<Trip>
  joinTrip: (code: string, displayName: string) => Promise<Trip>
  selectTrip: (id: string) => void
  leaveTrip: () => Promise<void>
  removePartner: () => Promise<void>
}

const TripContext = createContext<TripState | null>(null)

const TRIP_KEY = 'reise-app:trip-id'
const SHARE_KEY = 'reise-app:share-position'

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k)
      else localStorage.setItem(k, v)
    } catch {
      // ignorieren
    }
  },
}

interface FavoriteRow {
  trip_id: string
  user_id: string
  poi_id: string
  name: string
  kind: FavoriteRecord['kind']
  lat: number
  lng: number
  saved: boolean
  visited: boolean
  updated_at: string
}

const fromRow = (r: FavoriteRow): FavoriteRecord => ({
  poiId: r.poi_id,
  userId: r.user_id,
  name: r.name,
  kind: r.kind,
  lat: r.lat,
  lng: r.lng,
  saved: r.saved,
  visited: r.visited,
  updatedAt: r.updated_at,
})

const toRow = (tripId: string, r: FavoriteRecord) => ({
  trip_id: tripId,
  user_id: r.userId,
  poi_id: r.poiId,
  name: r.name.slice(0, 200),
  kind: r.kind,
  lat: r.lat,
  lng: r.lng,
  saved: r.saved,
  visited: r.visited,
})

export function TripProvider({ children }: { children: ReactNode }) {
  const configured = Boolean(supabase)
  const location = useLocation()
  const [loading, setLoading] = useState(configured)
  const [userId, setUserId] = useState<string | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripId, setTripId] = useState<string | null>(() => store.get(TRIP_KEY))
  const [members, setMembers] = useState<Member[]>([])
  const [positions, setPositions] = useState<PositionRow[]>([])
  const [sharePosition, setShareState] = useState(() => store.get(SHARE_KEY) !== 'false')

  const trip = useMemo(() => pickCurrentTrip(trips, tripId), [trips, tripId])
  const archived = trip ? isArchived(trip) : false

  const loadTrips = useCallback(async () => {
    if (!supabase) return []
    const { data, error } = await supabase.from('trips').select('*').order('start_date', { ascending: false })
    if (error) throw toAppError(error)
    setTrips(data as Trip[])
    return data as Trip[]
  }, [])

  // Beim Start: vorhandene Sitzung übernehmen (ohne neue anonyme Anmeldung)
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const uid = data.session?.user.id ?? null
        if (cancelled) return
        setUserId(uid)
        if (uid) await loadTrips()
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [loadTrips])

  // Daten der aktuellen Reise laden und live mithören
  const currentTripId = trip?.id ?? null
  const refreshTripData = useCallback(async () => {
    if (!supabase || !currentTripId || !userId) return
    const [m, f, p] = await Promise.all([
      supabase.from('members').select('*').eq('trip_id', currentTripId),
      supabase.from('favorites').select('*').eq('trip_id', currentTripId),
      supabase.from('positions').select('*').eq('trip_id', currentTripId),
    ])
    if (m.data) {
      setMembers(m.data as Member[])
      // Platz wurde freigegeben → Reise ist für dieses Gerät weg
      if (!(m.data as Member[]).some((x) => x.user_id === userId)) {
        await loadTrips()
        return
      }
    }
    if (f.data) {
      const t = trips.find((x) => x.id === currentTripId)
      switchToRemote(
        {
          userId,
          readOnly: t ? isArchived(t) : false,
          save: async (rec) => {
            const { error } = await supabase!.from('favorites').upsert(toRow(currentTripId, rec))
            if (error) throw toAppError(error)
          },
        },
        (f.data as FavoriteRow[]).map(fromRow),
      )
    }
    if (p.data) setPositions(p.data as PositionRow[])
  }, [currentTripId, userId, trips, loadTrips])

  // Echtzeit-Callbacks rufen immer die aktuelle Version auf (ohne das Abo neu aufzubauen)
  const refreshRef = useRef(refreshTripData)
  refreshRef.current = refreshTripData

  useEffect(() => {
    if (!supabase || !currentTripId || !userId) {
      switchToLocal()
      setMembers([])
      setPositions([])
      return
    }
    void refreshRef.current()
    const channel: RealtimeChannel = supabase
      .channel(`trip:${currentTripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites', filter: `trip_id=eq.${currentTripId}` }, (payload) => {
        if (payload.new && 'poi_id' in payload.new) applyRemoteRecord(fromRow(payload.new as FavoriteRow))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions', filter: `trip_id=eq.${currentTripId}` }, (payload) => {
        const row = payload.new as PositionRow
        if (!row?.user_id) return
        setPositions((prev) => [...prev.filter((x) => x.user_id !== row.user_id), row])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter: `trip_id=eq.${currentTripId}` }, () => {
        void refreshRef.current()
      })
      .subscribe()

    // Nach dem Aufwachen (App war im Hintergrund) neu laden – Echtzeit-Verbindungen brechen dabei oft ab
    const onVisible = () => document.visibilityState === 'visible' && void refreshRef.current()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void supabase!.removeChannel(channel)
    }
  }, [currentTripId, userId])

  // Eigene Position teilen – nur bei geöffneter App, GPS-Standort und eingeschalteter Freigabe
  const lastSent = useRef<{ pos: LatLng; at: number } | null>(null)
  const canShare = Boolean(supabase && trip && userId && !archived && sharePosition && location.source === 'gps')
  const sendPosition = useCallback(
    async (pos: LatLng | null, accuracy: number | null) => {
      if (!supabase || !currentTripId || !userId) return
      await supabase.from('positions').upsert({
        trip_id: currentTripId,
        user_id: userId,
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
        accuracy,
      })
    },
    [currentTripId, userId],
  )

  useEffect(() => {
    if (!canShare || !location.position || document.visibilityState !== 'visible') return
    const now = Date.now()
    if (!shouldSendPosition(lastSent.current, location.position, now)) return
    lastSent.current = { pos: location.position, at: now }
    void sendPosition(location.position, location.accuracy)
  }, [canShare, location.position, location.accuracy, sendPosition])

  // Herzschlag: auch ohne Bewegung regelmäßig senden, damit der Partner sieht, dass die App offen ist
  useEffect(() => {
    if (!canShare) return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible' || !location.position) return
      lastSent.current = { pos: location.position, at: Date.now() }
      void sendPosition(location.position, location.accuracy)
    }, POSITION_HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [canShare, location.position, location.accuracy, sendPosition])

  // Freigabe aus / manueller Ort → Position löschen
  const wasSharing = useRef(false)
  useEffect(() => {
    if (wasSharing.current && !canShare && trip && !archived) void sendPosition(null, null)
    if (!canShare) lastSent.current = null
    wasSharing.current = canShare
  }, [canShare, trip, archived, sendPosition])

  const setSharePosition = useCallback((on: boolean) => {
    store.set(SHARE_KEY, on ? 'true' : 'false')
    setShareState(on)
  }, [])

  const selectTrip = useCallback((id: string) => {
    store.set(TRIP_KEY, id)
    setTripId(id)
  }, [])

  /** Bisher lokal gemerkte Orte in die Reise übernehmen. */
  const uploadLocalFavorites = useCallback(async (tid: string, uid: string) => {
    const local = localFavorites()
    if (!supabase || local.length === 0) return
    await supabase.from('favorites').upsert(local.map((r) => toRow(tid, { ...r, userId: uid })), { ignoreDuplicates: true })
  }, [])

  const createTrip = useCallback<TripState['createTrip']>(
    async ({ name, start, end, displayName }) => {
      try {
        const uid = await ensureUserId()
        setUserId(uid)
        const { data, error } = await supabase!.rpc('create_trip', { p_name: name, p_start: start, p_end: end, p_display_name: displayName })
        if (error) throw error
        const t = data as Trip
        await uploadLocalFavorites(t.id, uid)
        await loadTrips()
        selectTrip(t.id)
        return t
      } catch (err) {
        throw toAppError(err)
      }
    },
    [loadTrips, selectTrip, uploadLocalFavorites],
  )

  const joinTrip = useCallback<TripState['joinTrip']>(
    async (code, displayName) => {
      try {
        const uid = await ensureUserId()
        setUserId(uid)
        const { data, error } = await supabase!.rpc('join_trip', { p_code: code, p_display_name: displayName })
        if (error) throw error
        const t = data as Trip
        if (!isArchived(t)) await uploadLocalFavorites(t.id, uid)
        await loadTrips()
        selectTrip(t.id)
        return t
      } catch (err) {
        throw toAppError(err)
      }
    },
    [loadTrips, selectTrip, uploadLocalFavorites],
  )

  const leaveTrip = useCallback(async () => {
    if (!supabase || !trip || !userId) return
    const { error } = await supabase.from('members').delete().eq('trip_id', trip.id).eq('user_id', userId)
    if (error) throw toAppError(error)
    store.set(TRIP_KEY, null)
    setTripId(null)
    await loadTrips()
  }, [trip, userId, loadTrips])

  const removePartner = useCallback(async () => {
    if (!supabase || !trip) return
    const { error } = await supabase.rpc('remove_partner', { p_trip: trip.id })
    if (error) throw toAppError(error)
    await refreshTripData()
  }, [trip, refreshTripData])

  const me = members.find((m) => m.user_id === userId) ?? null
  const partner = members.find((m) => m.user_id !== userId) ?? null
  const partnerPosition = partner ? (positions.find((p) => p.user_id === partner.user_id) ?? null) : null

  const value: TripState = {
    configured,
    loading,
    userId,
    trips,
    trip,
    archived,
    members,
    me,
    partner,
    partnerPosition,
    sharePosition,
    setSharePosition,
    createTrip,
    joinTrip,
    selectTrip,
    leaveTrip,
    removePartner,
  }

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTrip(): TripState {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip muss innerhalb von TripProvider verwendet werden')
  return ctx
}
