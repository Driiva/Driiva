import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  lat: number;
  lng: number;
  label?: string;
}

interface LeafletMapProps {
  /** If provided, the map centres on this fixed location (e.g. trip start point).
   *  If omitted the map will request and track the device's real GPS position. */
  location?: LocationData;
  onLocationChange?: (lat: number, lng: number) => void;
  className?: string;
}

function MapUpdater({ location }: { location: LocationData }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, { duration: 1.5 });
    }
  }, [location, map]);

  return null;
}

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const LeafletMap = ({ location, onLocationChange, className }: LeafletMapProps) => {
  // Resolved location shown on the map
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(location ?? null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unavailable'>('idle');

  // If a fixed location prop was passed, always use it
  useEffect(() => {
    if (location) {
      setCurrentLocation(location);
    }
  }, [location]);

  // If no fixed location prop, request the device's real GPS position
  useEffect(() => {
    if (location) return; // Prop takes priority

    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      return;
    }

    setGeoStatus('loading');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const resolved: LocationData = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Your Location',
        };
        setCurrentLocation(resolved);
        setGeoStatus('granted');
        onLocationChange?.(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setGeoStatus('denied');
        } else {
          setGeoStatus('unavailable');
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [location, onLocationChange]);

  // Still waiting for first GPS fix
  if (!currentLocation) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1a1a2e]/50 rounded-xl ${className}`}
        style={{ height: '300px' }}
      >
        {geoStatus === 'denied' ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <span className="text-3xl">📍</span>
            <p className="text-white/70 text-sm font-medium">Location access denied</p>
            <p className="text-white/40 text-xs">
              Enable location in your browser settings so the map can show your position.
            </p>
          </div>
        ) : geoStatus === 'unavailable' ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <span className="text-3xl">🗺️</span>
            <p className="text-white/70 text-sm font-medium">GPS unavailable</p>
            <p className="text-white/40 text-xs">Your device doesn't support location services.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Finding your location…</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <MapContainer
        center={[currentLocation.lat, currentLocation.lng]}
        zoom={14}
        style={{ height: '300px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapUpdater location={currentLocation} />
        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={customIcon}>
          <Popup>
            <span className="text-sm font-bold text-gray-700">
              {currentLocation.label || 'Your Location'}
            </span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
