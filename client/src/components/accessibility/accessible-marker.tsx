import React, { useEffect, useState } from 'react';
import { Marker } from '@react-google-maps/api';
import VoiceGuidance from './voice-guidance';

interface AccessibleMarkerProps {
  position: google.maps.LatLngLiteral;
  label?: string;
  type: 'pickup' | 'dropoff' | 'waypoint' | 'selected';
  address?: string;
  onClick?: () => void;
  accessibilityEnabled?: boolean;
}

/**
 * An accessible marker component that provides voice feedback
 * when focused or clicked, suitable for users with visual impairments.
 */
const AccessibleMarker: React.FC<AccessibleMarkerProps> = ({
  position,
  label,
  type,
  address,
  onClick,
  accessibilityEnabled = false
}) => {
  const [markerRef, setMarkerRef] = useState<google.maps.Marker | null>(null);

  // Get marker color and icon based on type
  const getMarkerConfig = () => {
    switch (type) {
      case 'pickup':
        return {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          color: '#1e3a8a',
          announcement: 'Pickup location marker'
        };
      case 'dropoff':
        return {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          color: '#7f1d1d',
          announcement: 'Dropoff location marker'
        };
      case 'waypoint':
        return {
          url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          color: '#854d0e',
          announcement: `Waypoint ${label || ''} marker`
        };
      case 'selected':
      default:
        return {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          color: '#1d4ed8',
          announcement: 'Selected location marker'
        };
    }
  };

  const { url, color, announcement } = getMarkerConfig();

  // Announce marker when it's added to the map
  useEffect(() => {
    if (accessibilityEnabled && markerRef) {
      const addressText = address ? `at ${address}` : '';
      VoiceGuidance.speak(`${announcement} ${addressText} added to map.`);
    }
  }, [markerRef, accessibilityEnabled, announcement, address]);

  // Handle marker load
  const handleMarkerLoad = (marker: google.maps.Marker) => {
    setMarkerRef(marker);
    
    // Add event listener for mouseover for accessibility
    if (accessibilityEnabled) {
      marker.addListener('mouseover', () => {
        const addressText = address ? `at ${address}` : '';
        VoiceGuidance.speak(`${announcement} ${addressText}. Click to select.`);
      });
    }
  };

  // Handle marker click with voice feedback
  const handleMarkerClick = () => {
    if (accessibilityEnabled) {
      const addressText = address ? `at ${address}` : '';
      VoiceGuidance.speak(`${announcement} ${addressText} selected.`);
    }
    
    if (onClick) onClick();
  };

  return (
    <Marker
      position={position}
      onClick={handleMarkerClick}
      onLoad={handleMarkerLoad}
      icon={{
        url,
        scaledSize: typeof google !== 'undefined' && google.maps ? new google.maps.Size(32, 32) : undefined,
        labelOrigin: typeof google !== 'undefined' && google.maps ? new google.maps.Point(16, -10) : undefined
      }}
      label={label ? {
        text: label,
        color,
        fontWeight: 'bold',
        fontSize: '12px'
      } : undefined}
      // Add ARIA attributes for accessibility
      options={{
        clickable: true,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} location${address ? ': ' + address : ''}`,
      }}
    />
  );
};

export default AccessibleMarker;