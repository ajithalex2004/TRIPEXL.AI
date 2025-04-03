import { useState, useEffect } from 'react';

interface GoogleMapsHookResult {
  isLoaded: boolean;
  loadError: Error | null;
}

export function useGoogleMaps(apiKey: string): GoogleMapsHookResult {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setLoadError(new Error('Google Maps API key is required'));
      return;
    }

    // Check if the API is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Unique callback name to avoid conflicts
    const callbackName = `googleMapsCallback_${Math.round(Math.random() * 1000000)}`;
    window[callbackName] = () => {
      setIsLoaded(true);
      delete window[callbackName];
    };

    // Add the script to the page
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
      setLoadError(new Error('Failed to load Google Maps API script'));
      console.error('Google Maps API loading error:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Clean up on unmount
      if (window[callbackName]) {
        delete window[callbackName];
      }
      // Optionally remove the script tag
      const scriptElement = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js?key=${apiKey}"]`);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [apiKey]);

  return { isLoaded, loadError };
}