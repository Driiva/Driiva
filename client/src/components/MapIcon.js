import L from 'leaflet';
import PropTypes from 'prop-types';
import { airplaneIcon, boxTruckIcon, bicycleIcon, carIcon, cargoShipIcon, motorBikeIcon, vanIcon, pinIcon } from './Icons'

const iconProps = {
    shadowSize: null, // size of the shadow
    iconAnchor: null, // point of the icon which will correspond to marker's location
    shadowAnchor: null,  // the same for the shadow
    popupAnchor: [-3, -30], // point from which the popup should open relative to the iconAnchor
    iconSize: new L.Point(64, 64),
}

const MapIcon = ({ type }) => {
    let iconUrl = pinIcon;
    if (type === 'car') {
        iconUrl = carIcon;
    }else if (type === 'airplane') {
        iconUrl = airplaneIcon;
    } else if (type === 'bicycle') {
        iconUrl = bicycleIcon;
    } else if (type === 'boxtruck') {
        iconUrl = boxTruckIcon;
    } else if (type === 'cargoship') {
        iconUrl = cargoShipIcon;
    } else if (type === 'motorbike') {
        iconUrl = motorBikeIcon;
    } else if (type === 'van') {
        iconUrl = vanIcon;
    } else {
        iconUrl = pinIcon;
    }

    return L.icon({
        ...iconProps,
        iconUrl: iconUrl,
    });
};

MapIcon.propTypes = {
    type: PropTypes.string.isRequired,
};


export default MapIcon;
