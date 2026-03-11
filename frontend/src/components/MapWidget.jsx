import React, { useState, useCallback } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%'
}

// Default to NITK Surathkal
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
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  restriction: {
    latLngBounds: campusBounds,
    strictBounds: false
  }
}

export default function MapWidget() {
  const apiKey = import.meta.env.VITE_GOOGLEMAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || ''
  })

  const [map, setMap] = useState(null)

  const onLoad = useCallback((map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  if (!apiKey) {
    return <div>Google Maps API Key is missing. Check your .env file.</div>
  }

  if (loadError) {
    return <div>Error loading Google Maps: {loadError.message}</div>
  }

  if (!isLoaded) {
    return <div>Loading Map...</div>
  }

  return (
    <div className="w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      />
    </div>
  )
}