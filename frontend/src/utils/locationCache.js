import { getLocations } from '../api'

const cache = {
  list: [],
  loaded: false
}

const coordsFrom = (loc) => {
  if (!loc) return null
  try {
    if (typeof loc === 'string') {
      const parts = loc.split(',').map(p => p.trim()).filter(Boolean)
      if (parts.length >= 2) { const a = Number(parts[0]); const b = Number(parts[1]); if (!isNaN(a) && !isNaN(b)) return [a, b] }
      return null
    }
    if (Array.isArray(loc)) {
      if (loc.length >= 2) { const a = Number(loc[0]); const b = Number(loc[1]); if (!isNaN(a) && !isNaN(b)) return [a, b] }
      return null
    }
    if (typeof loc === 'object') {
      // 1. Direct array [lng, lat] (rare for object but possible if array-is-object)
      if (Array.isArray(loc) && loc.length >= 2) return [Number(loc[0]), Number(loc[1])]

      // 2. Mongoose/GeoJSON with .coordinates
      if (loc.coordinates) {
        if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) return [Number(loc.coordinates[0]), Number(loc.coordinates[1])]
        // Nested GeoJSON: loc.coordinates.coordinates
        if (loc.coordinates.coordinates && Array.isArray(loc.coordinates.coordinates) && loc.coordinates.coordinates.length >= 2) {
          return [Number(loc.coordinates.coordinates[0]), Number(loc.coordinates.coordinates[1])]
        }
      }

      // 3. Flat properties
      if (loc.lat != null && loc.lng != null) return [Number(loc.lng), Number(loc.lat)]
      if (loc.latitude != null && loc.longitude != null) return [Number(loc.longitude), Number(loc.latitude)]
    }
  } catch (e) { }
  return null
}

const nearlyEqual = (a, b, tol = 0.0007) => {
  if (!a || !b) return false
  return Math.abs(Number(a[0]) - Number(b[0])) <= tol && Math.abs(Number(a[1]) - Number(b[1])) <= tol
}

export const setCachedLocations = (list) => {
  cache.list = Array.isArray(list) ? list : []
  cache.loaded = true
}

export const getCachedLocations = () => cache.list

export const ensureLocationsLoaded = async () => {
  if (cache.loaded) return cache.list
  try {
    const res = await getLocations()
    const list = res?.data?.data || []
    console.log('[LocationCache] Loaded locations:', list.length)
    setCachedLocations(list)
    return list
  } catch (e) {
    // swallow - leave cache empty
    cache.list = []
    cache.loaded = true
    return []
  }
}

export const findLocationName = (loc) => {
  if (!loc) return null
  // prefer direct name or id
  if (typeof loc === 'string') {
    const byName = cache.list.find(l => (l.name && l.name === loc) || (String(l._id) === loc))
    if (byName) return byName.name || byName.address || String(byName._id)
    // string might be coords - try coordsFrom
  }
  if (typeof loc === 'object') {
    if (loc.name) return loc.name
    if (loc.address) return loc.address
  }

  const c = coordsFrom(loc)
  if (!c) return null

  // try to match any cached location by coords (try both orders)
  for (const L of cache.list) {
    const lc = coordsFrom(L.coordinates || L.location || L.geo || L)
    if (!lc) continue
    if (nearlyEqual(lc, c) || nearlyEqual(lc, [c[1], c[0]])) {
      return L.name || L.address || String(L._id)
    }
  }

  return null
}

export const formatLocation = (loc) => {
  const name = findLocationName(loc)
  if (name) return name

  // Debugging: Log why we couldn't find it
  // console.log('[formatLocation] Failed to match:', JSON.stringify(loc), 'Cache size:', cache.list.length)

  if (loc) return 'Unknown Station'
  return '—'
}
