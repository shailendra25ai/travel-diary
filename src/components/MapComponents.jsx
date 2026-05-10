import { useRef, useState, useEffect } from 'react'
import { useJsApiLoader, GoogleMap, Marker, Autocomplete, InfoWindow } from '@react-google-maps/api'

const LIBRARIES = ['places']

export function useMapsLoader() {
  return useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })
}

/* Location autocomplete input + small map preview */
export function LocationPicker({ value, onChange }) {
  const { isLoaded, loadError } = useMapsLoader()
  const autocompleteRef = useRef(null)
  const [inputValue, setInputValue] = useState(value?.name || '')

  useEffect(() => {
    setInputValue(value?.name || '')
  }, [value?.name])

  if (loadError) return <p style={{ color: '#e53e3e', fontSize: '0.9rem' }}>Maps failed to load. Check your internet.</p>
  if (!isLoaded) return <p style={{ color: '#999', fontSize: '0.9rem' }}>Loading map...</p>

  const onLoad = (autocomplete) => { autocompleteRef.current = autocomplete }

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace()
    if (!place || !place.geometry) return

    const country = place.address_components?.find(c => c.types.includes('country'))?.long_name || ''

    const location = {
      name: place.name || place.formatted_address,
      placeId: place.place_id,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      country,
      formattedAddress: place.formatted_address || '',
    }
    setInputValue(location.name)
    onChange(location)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Start typing a city, country, or place"
          style={{
            width: '100%', padding: '14px 16px', borderRadius: '10px',
            border: '1.5px solid #ddd', fontSize: '1rem',
            color: '#1a1a1a', backgroundColor: '#fff', outline: 'none',
          }}
        />
      </Autocomplete>

      {value?.lat && value?.lng && (
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
          <GoogleMap
            center={{ lat: value.lat, lng: value.lng }}
            zoom={9}
            mapContainerStyle={{ width: '100%', height: '180px' }}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: MAP_STYLES,
            }}
          >
            <Marker position={{ lat: value.lat, lng: value.lng }} />
          </GoogleMap>
        </div>
      )}
    </div>
  )
}

/* Small read-only map (for trip page, etc) */
export function MapDisplay({ lat, lng, height = 180 }) {
  const { isLoaded } = useMapsLoader()
  if (!isLoaded) return <div style={{ height, backgroundColor: '#eee', borderRadius: '12px' }} />

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
      <GoogleMap
        center={{ lat, lng }}
        zoom={9}
        mapContainerStyle={{ width: '100%', height: `${height}px` }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
          styles: MAP_STYLES,
        }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </div>
  )
}

/* Multi-trip map (for home page) */
export function TripsMap({ trips, onPinClick }) {
  const { isLoaded } = useMapsLoader()
  const [activeTrip, setActiveTrip] = useState(null)

  if (!isLoaded) return <div style={{ height: 480, backgroundColor: '#eee', borderRadius: '12px' }} />

  const tripsWithLocation = trips.filter(t => t.location?.lat && t.location?.lng)

  if (tripsWithLocation.length === 0) {
    return (
      <div style={{
        height: 320, backgroundColor: '#fff', borderRadius: '12px',
        border: '1px dashed #ddd', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '8px' }}>No trips on the map yet</p>
        <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Add a destination to your trips to see them here</p>
      </div>
    )
  }

  // Calculate center as average of all trip locations
  const center = {
    lat: tripsWithLocation.reduce((sum, t) => sum + t.location.lat, 0) / tripsWithLocation.length,
    lng: tripsWithLocation.reduce((sum, t) => sum + t.location.lng, 0) / tripsWithLocation.length,
  }

  const onMapLoad = (map) => {
    if (tripsWithLocation.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      tripsWithLocation.forEach(t => {
        bounds.extend({ lat: t.location.lat, lng: t.location.lng })
      })
      map.fitBounds(bounds, 80)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const getPinColor = (trip) => {
    const start = trip.startDate
    const end = trip.endDate || trip.startDate
    if (today < start) return '#c89060' // upcoming - terracotta
    if (today > end && !trip.openEnded) return '#2d4a8a' // past - navy
    return '#7a8a5a' // current - sage
  }

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <GoogleMap
        center={center}
        zoom={tripsWithLocation.length === 1 ? 8 : 4}
        mapContainerStyle={{ width: '100%', height: '480px' }}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: MAP_STYLES,
        }}
      >
        {tripsWithLocation.map(trip => (
          <Marker
            key={trip.id}
            position={{ lat: trip.location.lat, lng: trip.location.lng }}
            onClick={() => setActiveTrip(trip)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: getPinColor(trip),
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2.5,
            }}
          />
        ))}

        {activeTrip && (
          <InfoWindow
            position={{ lat: activeTrip.location.lat, lng: activeTrip.location.lng }}
            onCloseClick={() => setActiveTrip(null)}
          >
            <div style={{ padding: '4px', maxWidth: '220px' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px', fontFamily: 'Georgia, serif' }}>
                {activeTrip.title}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                {activeTrip.location.name} · {activeTrip.members?.length || 0} {(activeTrip.members?.length || 0) === 1 ? 'member' : 'members'}
              </p>
              <button
                onClick={() => onPinClick(activeTrip.id)}
                style={{
                  fontSize: '0.85rem', backgroundColor: '#1a1a1a', color: '#fff',
                  border: 'none', borderRadius: '6px', padding: '6px 12px',
                  cursor: 'pointer', fontWeight: '600',
                }}
              >
                Open trip →
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

/* Soft minimalist map style */
const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'water', stylers: [{ color: '#dce6e6' }] },
  { featureType: 'landscape', stylers: [{ color: '#f9f6f1' }] },
]
