import React, { useState, useRef, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { Loader2, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// UAE bounds to restrict autocomplete results
const UAE_BOUNDS = {
  north: 26.5,   // Northern boundary of UAE
  south: 22.0,   // Southern boundary of UAE
  west: 51.0,    // Western boundary of UAE
  east: 56.5     // Eastern boundary of UAE
};

// Type for location structure
export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
  district?: string;
  city?: string;
  area?: string;
  place_types?: string[];
}

interface UaeLocationSearchProps {
  apiKey: string;
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  containerClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function UaeLocationSearch({
  apiKey,
  onLocationSelect,
  placeholder = 'Search for a location in UAE...',
  containerClassName = '',
  inputClassName = '',
  disabled = false
}: UaeLocationSearchProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load the Google Maps API
  useEffect(() => {
    // Skip if API is already loaded
    if (window.google?.maps?.places || isApiLoaded) {
      setIsApiLoaded(true);
      return;
    }
    
    // Only load the API if we have a key
    if (!apiKey) {
      setError('Google Maps API key is missing');
      return;
    }
    
    // Create the script tag
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initializePlacesAPI`;
    script.async = true;
    script.defer = true;
    
    // Define the callback function
    window.initializePlacesAPI = () => {
      try {
        console.log('Places API loaded successfully');
        setIsApiLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing Places API:', err);
        setError('Failed to initialize location search. Please refresh the page.');
      }
    };
    
    // Handle script load error
    script.onerror = () => {
      setError('Failed to load Google Maps API. Please check your connection.');
    };
    
    // Add the script to the document
    document.head.appendChild(script);
    
    // Clean up
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.initializePlacesAPI;
    };
  }, [apiKey, isApiLoaded]);
  
  // Create a reference for the Places service element
  const placesElementDivRef = useRef<HTMLDivElement | null>(null);
  
  // Initialize services when API is loaded
  useEffect(() => {
    if (!isApiLoaded || !window.google?.maps?.places) return;
    
    try {
      // Create a hidden div element for PlacesService if it doesn't exist
      if (!placesElementDivRef.current) {
        const div = document.createElement('div');
        div.style.display = 'none';
        document.body.appendChild(div);
        placesElementDivRef.current = div;
      }
      
      // Initialize services
      setAutocompleteService(new google.maps.places.AutocompleteService());
      setPlacesService(new google.maps.places.PlacesService(placesElementDivRef.current));
    } catch (err) {
      console.error('Error initializing Places services:', err);
      setError('Failed to initialize location services.');
    }
    
    // Cleanup
    return () => {
      if (placesElementDivRef.current) {
        try {
          document.body.removeChild(placesElementDivRef.current);
          placesElementDivRef.current = null;
        } catch (e) {
          // Element may have already been removed
        }
      }
    };
  }, [isApiLoaded]);
  
  // Search for places as the user types
  const searchPlaces = useCallback(
    debounce((input: string) => {
      if (!input || input.length < 3 || !autocompleteService) {
        setPredictions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Get predictions from Google Places
      autocompleteService.getPlacePredictions(
        {
          input,
          bounds: UAE_BOUNDS,
          componentRestrictions: { country: 'ae' }
        },
        (results, status) => {
          setIsLoading(false);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
            if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setError('Error retrieving locations');
              console.error('Places API error:', status);
            }
          }
        }
      );
    }, 300),
    [autocompleteService]
  );
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 3) {
      searchPlaces(value);
    } else {
      setPredictions([]);
    }
  };
  
  // Handle selection of a place
  const handlePlaceSelect = (placeId: string) => {
    if (!placesService) {
      setError('Location service not available');
      return;
    }
    
    setIsLoading(true);
    
    // Get place details
    placesService.getDetails(
      {
        placeId,
        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'address_components']
      },
      (place, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          // Create a location object with UAE-specific fields
          const location: Location = {
            address: place.formatted_address || 'Unknown address',
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            district: '',
            city: '',
            area: ''
          };
          
          // Extract UAE-specific data from address components
          if (place.address_components) {
            place.address_components.forEach(component => {
              if (component.types.includes('sublocality_level_1') || component.types.includes('sublocality')) {
                location.district = component.long_name;
              } else if (component.types.includes('locality')) {
                location.city = component.long_name;
              } else if (component.types.includes('administrative_area_level_1')) {
                location.area = component.long_name;
              }
            });
          }
          
          // Pass the location to the parent component
          onLocationSelect(location);
          
          // Clear the input and predictions
          setQuery('');
          setPredictions([]);
        } else {
          setError('Could not retrieve location details');
        }
      }
    );
  };
  
  // Clear the input
  const handleClear = () => {
    setQuery('');
    setPredictions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // If the API is not available yet, show a loading state
  if (!isApiLoaded) {
    return (
      <div className={`relative ${containerClassName}`}>
        <Input
          disabled
          placeholder="Loading location search..."
          className={inputClassName}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative ${containerClassName}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          className={`pr-8 ${inputClassName}`}
          disabled={disabled || isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        {query && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {predictions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 p-0 shadow-md max-h-64 overflow-auto">
          <ul className="py-1">
            {predictions.map((prediction) => (
              <li
                key={prediction.place_id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-start gap-2"
                onClick={() => handlePlaceSelect(prediction.place_id)}
              >
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </div>
                  {prediction.structured_formatting?.secondary_text && (
                    <div className="text-xs text-gray-500">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}