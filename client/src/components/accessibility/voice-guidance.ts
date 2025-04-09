/**
 * Voice Guidance Utility for Accessibility
 * 
 * This module provides voice synthesis functions for improving
 * the accessibility of the map and location selection components.
 */

// Configuration options for speech synthesis
interface SpeechOptions {
  rate?: number;       // Speech rate (0.1 to 10)
  pitch?: number;      // Speech pitch (0 to 2)
  volume?: number;     // Speech volume (0 to 1)
  lang?: string;       // Language code (e.g., 'en-US', 'ar-AE')
  voice?: string;      // Voice name to use (if available)
}

// Default options for speech
const defaultOptions: SpeechOptions = {
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: 'en-US'
};

/**
 * Check if speech synthesis is available in the browser
 */
export const isSpeechAvailable = (): boolean => {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

/**
 * Get available voices for speech synthesis
 */
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechAvailable()) return [];
  return window.speechSynthesis.getVoices();
};

// Keep track of the last message for debouncing
let lastSpokenMessage = '';
let lastSpeakTime = 0;
const DEBOUNCE_TIME_MS = 800; // Prevent duplicate messages within 800ms

/**
 * Speak a text message using speech synthesis with optimizations to prevent flickering
 */
export const speak = (text: string, options: SpeechOptions = {}): void => {
  if (!isSpeechAvailable()) {
    console.warn('Speech synthesis is not available in this browser');
    return;
  }

  // Skip identical repeated messages within the debounce time to prevent unnecessary speech
  const now = Date.now();
  if (text === lastSpokenMessage && (now - lastSpeakTime) < DEBOUNCE_TIME_MS) {
    console.log('Skipping duplicate speech message within debounce window');
    return;
  }
  
  // Update our tracking variables
  lastSpokenMessage = text;
  lastSpeakTime = now;

  // Combine default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };

  // Create a new utterance with memory optimization
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Apply the options
  utterance.rate = mergedOptions.rate || 1;
  utterance.pitch = mergedOptions.pitch || 1;
  utterance.volume = mergedOptions.volume || 1;
  utterance.lang = mergedOptions.lang || 'en-US';
  
  // Only look up voices if specifically requested (performance optimization)
  if (mergedOptions.voice) {
    const voices = getAvailableVoices();
    const requestedVoice = voices.find(v => v.name === mergedOptions.voice);
    if (requestedVoice) {
      utterance.voice = requestedVoice;
    }
  }

  // Cancel any previous speech
  window.speechSynthesis.cancel();
  
  // Add event handlers to manage memory and performance
  utterance.onend = () => {
    // Help garbage collection by removing references
    utterance.onend = null;
    utterance.onerror = null;
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    utterance.onend = null;
    utterance.onerror = null;
  };
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
};

/**
 * Stop any current speech
 */
export const stopSpeaking = (): void => {
  if (isSpeechAvailable()) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Format a location for speech
 */
export const formatLocationForSpeech = (
  typeText: string,
  address: string
): void => {
  speak(`${typeText} set to: ${address}`);
};

/**
 * Announce a location selection
 */
export const announceLocationSelection = (
  location: { address?: string; coordinates?: { lat: number; lng: number }; formatted_address?: string },
  type: 'pickup' | 'dropoff' | 'waypoint'
): void => {
  const address = location.formatted_address || location.address || 'selected location';
  const typeText = type === 'pickup' 
    ? 'Pickup location' 
    : type === 'dropoff' 
      ? 'Dropoff location' 
      : 'Waypoint';
  
  speak(`${typeText} set to: ${address}`);
};

/**
 * Announce map interaction guidance
 */
export const announceMapGuidance = (): void => {
  speak(
    'Map navigation active. Click on the map to select a location. ' +
    'You can then set it as a pickup or dropoff point. ' +
    'Use the search box above to find specific locations.'
  );
};

/**
 * Announce when a route is calculated
 */
export const announceRouteCalculation = (
  distance: string,
  duration: string
): void => {
  speak(`Route calculated. Distance: ${distance}. Estimated time: ${duration}.`);
};

export default {
  isSpeechAvailable,
  getAvailableVoices,
  speak,
  stopSpeaking,
  formatLocationForSpeech,
  announceLocationSelection,
  announceMapGuidance,
  announceRouteCalculation
};