// src/components/Map.js
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fetchAllVehicleLocations, fetchVehicleLocation } from '../services/SupabaseService';
import MapIcon from './MapIcon';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { getCurrentLocation } from '../services/GeoLocationService';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

const LeafletMap = (config) => {
  const { selectedVehicle, type, sosCallback, onChange, autoZoom } = config;

  const isAll = type === 'all';

  const [vehicleId, setVehicleId] = useState(null);
  const [location, setLocation] = useState();
  const [vehicleIcon, setVehicleIcon] = useState('pin');
  const [intervalId, setIntervalId] = useState(null);
  const mapRef = useRef();

  const { user, isAuthenticated, isLoading } = useKindeAuth();

  useEffect(() => {
    if (!selectedVehicle) {
      return;
    }
    const debouncedOnChange = debounce(() => {
      setVehicleId(() => {
        return selectedVehicle;
      });
    }, 800);
    debouncedOnChange();
  }, [selectedVehicle]);

  useEffect(() => {
    console.log(autoZoom)
    if (isAll) {
      if (mapRef.current && location && Array.isArray(location)) {
        let count = 0;
        let fullLat = 0;
        let fullLng = 0;
        location.forEach((item) => {
          count++;
          fullLat += item.lat;
          fullLng += item.lng;
        });
        if (count === 0) {
          return;
        }
        const avgLat = fullLat / count;
        const avgLng = fullLng / count;

        if (autoZoom) {
          mapRef.current.flyTo([avgLat, avgLng], 10);
        }
      }
      return;
    }
    if (location) {
      const { lat, lng, icon, sos } = location;

      setVehicleIcon(icon);

      if (sosCallback) {
        sosCallback(sos);
      }

      if (onChange) {
        onChange(lat, lng);
      }

      if (mapRef.current && autoZoom) {
        mapRef.current.flyTo([lat, lng], 16);
      }
    }

  }, [location]);

  const fetchByType = async () => {
    if (type === 'all') {
      const locationList = await fetchAllVehicleLocations(user.email);

      const listData = locationList.map((item) => {
        return { ...{ lat: item.lat, lng: item.lng, icon: item.icon, sos: item.sos, id: item.id, name: item.name } }
      })

      setLocation(listData);

    }
    else {
      let location = type === 'user' ? await getCurrentLocation() : await fetchVehicleLocation(selectedVehicle);
      const { id, lat: newLat, lng: newLng, icon, sos, name } = location;

      setLocation(() => {
        const data = { ...{ lat: newLat, lng: newLng, icon, sos, id, name } }
        return data;
      });
    }

  };

  const debouncedFetchByType = debounce(fetchByType, 1_000);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    if (vehicleId || type === 'user' || type === 'all') {

      intervalId && clearInterval(intervalId) && setIntervalId(null);
      debouncedFetchByType();

      const newIntervalId = setInterval(debouncedFetchByType, 10_000);
      setIntervalId(newIntervalId);

      return () => {
        clearInterval(intervalId);
        setIntervalId(null);
      };
    }

  }, [vehicleId, type, isLoading, isAuthenticated]);

  return (
    <MapContainer
      center={location ? [location.lat, location.lng] : [6.9271, 79.8612]}
      zoom={10}
      style={{ height: '500px', width: '100%', margin: 'auto' }}
      scrollWheelZoom={false}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {location && !isAll && !Array.isArray(location) && (
        <Marker
          position={[location.lat, location.lng]}
          icon={MapIcon({ type: vehicleIcon || 'pin' })}
        >
          <Popup>
            <span className='text-sm font-bold text-gray-700 text-center'>{location.name}</span>
          </Popup>
        </Marker>
      )}
      {isAll && location && Array.isArray(location) && (
        location.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={MapIcon({ type: item.icon || 'pin' })}
          >
            <Popup>
              <span className='text-sm font-bold text-gray-700 text-center'>{item.name}</span>
            </Popup>
          </Marker>
        ))

      )}
    </MapContainer>
  );
};

export default LeafletMap;

LeafletMap.propTypes = {
  config: PropTypes.shape({
    selectedVehicle: PropTypes.string,
    type: PropTypes.string,
    sosCallback: PropTypes.func,
    onChange: PropTypes.func
  }),
};