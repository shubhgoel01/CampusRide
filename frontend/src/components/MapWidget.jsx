import React, { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'


const containerStyle = {
  width: '100%',
  height: '100%'
}

// Default to NITK Surathkal if no user location
const defaultCenter = {
  lat: 13.0108,
  lng: 74.7937
}

// Approx campus bounds
const campusBounds = {
  north: 13.0170,
  south: 13.0045,
  east: 74.8010,
  west: 74.7860
}

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true, // Enable zoom control for better UX
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: true,
  restriction: {
    latLngBounds: campusBounds,
    strictBounds: false
  }
}

export default function MapWidget({ locations = [] }) {
  // 1. Safe API Key Retrieval
  const apiKey = import.meta.env.VITE_GOOGLEMAPS_API_KEY

  // 2. Load API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || ''
  })

  // 3. State
  const [map, setMap] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isLocating, setIsLocating] = useState(false)

  const hasCentered = useRef(false)

  // 4. Map Event Handlers
  const onLoad = useCallback((map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // 5. User Location Logic - Enhanced
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    // Try high accuracy first
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

    let watchId = null

    const handleSuccess = (position) => {
      // Validate coordinates
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const accuracy = position.coords.accuracy

      console.log(`Location found - Lat: ${lat}, Lng: ${lng}, Accuracy: ${accuracy}m`)

      // Check if coordinates are valid (not 0,0 or clearly wrong)
      if (lat === 0 && lng === 0) {
        setLocationError('Invalid location data. Please try again.')
        setIsLocating(false)
        if (watchId) navigator.geolocation.clearWatch(watchId)
        return
      }

      // Check if location is within reasonable bounds for India
      // India roughly: lat 8-35, lng 68-97
      if (lat < 5 || lat > 40 || lng < 65 || lng > 100) {
        console.warn('Location outside expected region:', { lat, lng })
      }

      const pos = { lat, lng }
      setUserPos(pos)
      setLocationError(null)
      setIsLocating(false)

      // Center map on user with appropriate zoom
      if (map) {
        map.panTo(pos)
        map.setZoom(16)
      }

      if (watchId) navigator.geolocation.clearWatch(watchId)
    }

    const handleError = (err) => {
      console.error('Geolocation error code:', err.code, 'Message:', err.message)

      let errorMsg = 'Could not get location'
      if (err.code === 1) {
        errorMsg = 'Location permission denied. Enable in browser settings.'
      } else if (err.code === 2) {
        errorMsg = 'Location service unavailable. Check GPS/WiFi.'
      } else if (err.code === 3) {
        errorMsg = 'Location request timed out. Try again.'
      }

      setLocationError(errorMsg)
      setIsLocating(false)

      if (watchId) navigator.geolocation.clearWatch(watchId)
    }

    // Use watchPosition for continuous updates to ensure accuracy
    watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options)

    // Clear watch after timeout
    const timeoutId = setTimeout(() => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }, 15000)

    return () => {
      clearTimeout(timeoutId)
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [map])

  // Auto-locate on load once
  useEffect(() => {
    if (isLoaded && !hasCentered.current) {
      hasCentered.current = true
      locateUser()
    }
  }, [isLoaded, locateUser])


  // 6. Access Check
  if (!apiKey) {
    return (
      <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-6 text-center border border-red-100 rounded-xl">
        <div className="text-red-500 mb-2">
          <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red-700">Map Configuration Error</h3>
        <p className="text-sm text-red-600 mt-1 max-w-xs">
          Google Maps API Key is missing. Please check your <code>.env</code> file.
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full h-full bg-red-50 flex items-center justify-center p-4 text-center border border-red-100 rounded-xl">
        <p className="text-sm text-red-600">Error loading Google Maps: {loadError.message}</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-2">
          {/* Fallback Icon */}
          <div className="w-8 h-8 rounded-full bg-slate-200"></div>
          <div className="text-slate-400 font-semibold text-sm">Loading Map...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userPos || defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* User Marker */}
        {userPos && (
          <Marker
            position={userPos}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            zIndex={999}
            title="You are here"
          />
        )}

        {/* Location Markers */}
        {locations.map((loc) => {
          // Robust Coordinate parsing logic
          let position = null

          try {
            // 1. Nested GeoJSON (Mongoose default)
            if (loc.coordinates?.coordinates && Array.isArray(loc.coordinates.coordinates)) {
              const [lng, lat] = loc.coordinates.coordinates
              position = { lat: Number(lat), lng: Number(lng) }
            }
            // 2. Direct GeoJSON-like object
            else if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
              const [lng, lat] = loc.coordinates
              position = { lat: Number(lat), lng: Number(lng) }
            }
            // 3. Flat properties
            else if (loc.lat !== undefined && loc.lng !== undefined) {
              position = { lat: Number(loc.lat), lng: Number(loc.lng) }
            }
            // 4. Alternative naming
            else if (loc.latitude !== undefined && loc.longitude !== undefined) {
              position = { lat: Number(loc.latitude), lng: Number(loc.longitude) }
            }
          } catch (e) {
            console.warn('Failed to parse location coordinates:', loc, e)
          }

          if (!position || isNaN(position.lat) || isNaN(position.lng)) return null

          return (
            <Marker
              key={loc._id || Math.random()}
              position={position}
              onClick={() => setSelectedLocation(loc)}
              title={loc.name || 'Cycle Station'}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
              }}
            />
          )
        })}

        {/* Info Window */}
        {selectedLocation && (() => {
          // Recalculate pos for info window
          let pos = null
          try {
            if (selectedLocation.coordinates?.coordinates && Array.isArray(selectedLocation.coordinates.coordinates)) {
              const [lng, lat] = selectedLocation.coordinates.coordinates
              pos = { lat: Number(lat), lng: Number(lng) }
            } else if (Array.isArray(selectedLocation.coordinates) && selectedLocation.coordinates.length >= 2) {
              const [lng, lat] = selectedLocation.coordinates
              pos = { lat: Number(lat), lng: Number(lng) }
            } else if (selectedLocation.lat !== undefined && selectedLocation.lng !== undefined) {
              pos = { lat: Number(selectedLocation.lat), lng: Number(selectedLocation.lng) }
            } else if (selectedLocation.latitude !== undefined && selectedLocation.longitude !== undefined) {
              pos = { lat: Number(selectedLocation.latitude), lng: Number(selectedLocation.longitude) }
            }
          } catch (e) { }

          if (!pos || isNaN(pos.lat) || isNaN(pos.lng)) return null

          return (
            <InfoWindow
              position={pos}
              onCloseClick={() => setSelectedLocation(null)}
            >
              <div className="p-2 min-w-[150px]">
                <h3 className="font-bold text-slate-800 text-sm mb-1">{selectedLocation.name || 'Unknown Station'}</h3>
                <p className="text-xs text-slate-500">{selectedLocation.address || 'Availability: Check List'}</p>
              </div>
            </InfoWindow>
          )
        })()}

      </GoogleMap>

      {/* Floating Controls */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-2">
        {/* Error Toast */}
        {locationError && (
          <div className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-lg shadow-sm border border-red-200 mb-2 animate-fade-in">
            {locationError}
          </div>
        )}

        <button
          onClick={locateUser}
          className={`p-3 rounded-full shadow-lg border border-slate-200 transition-all active:scale-95 flex items-center justify-center ${isLocating ? 'bg-slate-50 text-primary' : 'bg-white text-slate-600 hover:text-primary hover:border-primary'
            }`}
          title="Locate Me"
        >
          {isLocating ? (
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          )}
        </button>
      </div>

    </div>
  )
}
