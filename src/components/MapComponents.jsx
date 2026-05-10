import { useRef, useState, useEffect } from 'react'
import { useJsApiLoader, GoogleMap, Marker, Autocomplete, InfoWindow, OverlayView } from '@react-google-maps/api'

const LIBRARIES = ['places']

export function useMapsLoader() {
  return useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })
}

/* Location autocomplete + small map preview */
export function LocationPicker({ value, onChange }) {
  const { isLoaded, loadError } = useMapsLoader()
  const autocompleteRef = useRef(null)
  const [inputValue, setInputValue] = useState(value?.name || '')

  useEffect(() => { setInputValue(value?.name || '') }, [value?.name])

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
            options={{ disableDefaultUI: true, zoomControl: true, styles: SOFT_MAP_STYLES }}
          >
            <Marker position={{ lat: value.lat, lng: value.lng }} />
          </GoogleMap>
        </div>
      )}
    </div>
  )
}

/* Read-only single-location map */
export function MapDisplay({ lat, lng, height = 180 }) {
  const { isLoaded } = useMapsLoader()
  if (!isLoaded) return <div style={{ height, backgroundColor: '#eee', borderRadius: '12px' }} />
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
      <GoogleMap
        center={{ lat, lng }} zoom={9}
        mapContainerStyle={{ width: '100%', height: `${height}px` }}
        options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative', styles: SOFT_MAP_STYLES }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </div>
  )
}

/* Multi-trip map for home page — with photo pins, stats, and labels */
export function TripsMap({ trips, onPinClick }) {
  const { isLoaded } = useMapsLoader()
  const [activeTripId, setActiveTripId] = useState(null)
  const mapRef = useRef(null)

  if (!isLoaded) return <div style={{ height: 540, backgroundColor: '#eee', borderRadius: '12px' }} />

  const tripsWithLocation = trips.filter(t => t.location?.lat && t.location?.lng)

  if (tripsWithLocation.length === 0) {
    return (
      <div style={s.mapEmpty}>
        <div style={s.mapEmptyIcon}>🌍</div>
        <p style={s.mapEmptyTitle}>No trips on the map yet</p>
        <p style={s.mapEmptyHint}>Add a destination to your trips and they'll appear here</p>
      </div>
    )
  }

  // Stats
  const uniqueCountries = new Set(tripsWithLocation.map(t => t.location?.country).filter(Boolean))
  const totalDays = tripsWithLocation.reduce((sum, t) => {
    if (!t.startDate) return sum
    const start = new Date(t.startDate)
    const end = t.endDate ? new Date(t.endDate) : start
    return sum + Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
  }, 0)

  const center = {
    lat: tripsWithLocation.reduce((sum, t) => sum + t.location.lat, 0) / tripsWithLocation.length,
    lng: tripsWithLocation.reduce((sum, t) => sum + t.location.lng, 0) / tripsWithLocation.length,
  }

  const onMapLoad = (map) => {
    mapRef.current = map
    if (tripsWithLocation.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      tripsWithLocation.forEach(t => bounds.extend({ lat: t.location.lat, lng: t.location.lng }))
      map.fitBounds(bounds, 100)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const tripEra = (trip) => {
    const start = trip.startDate
    const end = trip.endDate || trip.startDate
    if (today < start) return 'upcoming'
    if (today > end && !trip.openEnded) return 'past'
    return 'current'
  }

  return (
    <div>
      {/* Stats bar */}
      <div style={s.statsBar}>
        <Stat number={tripsWithLocation.length} label={tripsWithLocation.length === 1 ? 'trip' : 'trips'} />
        <Stat number={uniqueCountries.size} label={uniqueCountries.size === 1 ? 'country' : 'countries'} />
        <Stat number={totalDays} label="days" />
      </div>

      {/* Legend */}
      <div style={s.legendRow}>
        <LegendItem color="#7a8a5a" label="Current" />
        <LegendItem color="#c89060" label="Upcoming" />
        <LegendItem color="#2d4a8a" label="Past" />
      </div>

      {/* Map */}
      <div style={s.mapWrap}>
        <GoogleMap
          center={center}
          zoom={tripsWithLocation.length === 1 ? 8 : 4}
          onLoad={onMapLoad}
          mapContainerStyle={{ width: '100%', height: '540px' }}
          options={{
            disableDefaultUI: true, zoomControl: true,
            mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
            styles: SOFT_MAP_STYLES,
            backgroundColor: '#dce6e6',
          }}
        >
          {tripsWithLocation.map(trip => (
            <OverlayView
              key={trip.id}
              position={{ lat: trip.location.lat, lng: trip.location.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h) })}
            >
              <PhotoPin
                trip={trip}
                era={tripEra(trip)}
                isActive={activeTripId === trip.id}
                onClick={() => setActiveTripId(activeTripId === trip.id ? null : trip.id)}
                onOpen={() => onPinClick(trip.id)}
              />
            </OverlayView>
          ))}
        </GoogleMap>
      </div>
    </div>
  )
}

function Stat({ number, label }) {
  return (
    <div style={s.stat}>
      <p style={s.statNumber}>{number}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div style={s.legend}>
      <span style={{ ...s.legendDot, backgroundColor: color }} />
      <span style={s.legendLabel}>{label}</span>
    </div>
  )
}

function PhotoPin({ trip, era, isActive, onClick, onOpen }) {
  const colors = {
    upcoming: '#c89060',
    current: '#7a8a5a',
    past: '#2d4a8a',
  }
  const color = colors[era] || '#1a1a1a'

  const formatYear = (d) => d ? new Date(d).getFullYear() : ''

  return (
    <div style={s.pinContainer} onClick={onClick}>
      {isActive && (
        <div style={s.pinCard}>
          <p style={s.pinCardTitle}>{trip.title}</p>
          {trip.location?.name && <p style={s.pinCardLocation}>📍 {trip.location.name}</p>}
          {trip.startDate && (
            <p style={s.pinCardDates}>
              {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {trip.endDate && ` → ${new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          )}
          <button onClick={(e) => { e.stopPropagation(); onOpen() }} style={s.pinCardBtn}>Open trip →</button>
        </div>
      )}

      <div style={{ ...s.pin, ...(isActive ? s.pinActive : {}), borderColor: color }}>
        {trip.coverPhotoURL ? (
          <img src={trip.coverPhotoURL} alt={trip.title} style={s.pinImg} />
        ) : (
          <div style={{ ...s.pinFallback, backgroundColor: color }}>
            {trip.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ ...s.pinTail, borderTopColor: color }} />
      </div>

      <div style={{ ...s.pinLabel, borderColor: color }}>
        <span style={s.pinLabelText}>{trip.title.length > 18 ? trip.title.slice(0, 18) + '…' : trip.title}</span>
        {trip.startDate && <span style={s.pinLabelYear}>· {formatYear(trip.startDate)}</span>}
      </div>
    </div>
  )
}

const SOFT_MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'water', stylers: [{ color: '#cfdde0' }] },
  { featureType: 'landscape', stylers: [{ color: '#f4ede0' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#c0b8a8' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#7a6a55' }] },
]

const s = {
  /* Stats bar */
  statsBar: {
    display: 'flex', gap: '12px', marginBottom: '14px',
  },
  stat: {
    flex: 1, backgroundColor: '#fff', borderRadius: '12px',
    padding: '14px 16px', textAlign: 'center', border: '1px solid #ebe5dc',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  },
  statNumber: { fontSize: '1.8rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: '1' },
  statLabel: { fontSize: '0.78rem', color: '#999', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

  /* Legend */
  legendRow: { display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' },
  legend: { display: 'flex', alignItems: 'center', gap: '6px' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 0 2px #fff' },
  legendLabel: { fontSize: '0.78rem', color: '#777', fontWeight: '500' },

  /* Map */
  mapWrap: {
    borderRadius: '14px', overflow: 'hidden',
    border: '1px solid #ebe5dc', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },

  /* Photo pin */
  pinContainer: { position: 'relative', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },

  pin: {
    width: '52px', height: '52px', borderRadius: '50%',
    backgroundColor: '#fff', border: '3px solid',
    boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
    overflow: 'hidden', position: 'relative',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  pinActive: {
    transform: 'scale(1.15)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
  },
  pinImg: { width: '100%', height: '100%', objectFit: 'cover' },
  pinFallback: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Georgia, serif',
  },
  pinTail: {
    position: 'absolute', bottom: '-9px', left: '50%', transform: 'translateX(-50%)',
    width: 0, height: 0, borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent', borderTop: '8px solid',
  },

  pinLabel: {
    marginTop: '12px', backgroundColor: '#fff', padding: '4px 10px',
    borderRadius: '14px', border: '1.5px solid', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px',
  },
  pinLabelText: { fontSize: '0.78rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif' },
  pinLabelYear: { fontSize: '0.72rem', color: '#999', fontWeight: '600' },

  pinCard: {
    position: 'absolute', bottom: '85px', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: '#fff', borderRadius: '12px', padding: '14px 16px',
    minWidth: '220px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    zIndex: 10, textAlign: 'left',
  },
  pinCardTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: '4px' },
  pinCardLocation: { fontSize: '0.85rem', color: '#666', marginBottom: '4px' },
  pinCardDates: { fontSize: '0.8rem', color: '#999', marginBottom: '10px' },
  pinCardBtn: {
    fontSize: '0.85rem', backgroundColor: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: '6px', padding: '6px 12px',
    cursor: 'pointer', fontWeight: '600',
  },

  /* Empty state */
  mapEmpty: {
    height: 320, backgroundColor: '#fff', borderRadius: '14px',
    border: '1px dashed #ddd', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center',
  },
  mapEmptyIcon: { fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 },
  mapEmptyTitle: { fontSize: '1rem', color: '#666', marginBottom: '6px', fontWeight: '600' },
  mapEmptyHint: { fontSize: '0.85rem', color: '#aaa' },
}
