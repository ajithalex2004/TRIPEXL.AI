import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, VolumeX, Settings } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Slider
} from '@/components/ui/slider';
import VoiceGuidance from './voice-guidance';

// Types for the component props
interface AccessibilityToggleProps {
  className?: string;
  onToggle?: (enabled: boolean) => void;
}

// Key for storing accessibility preferences in localStorage
const ACCESSIBILITY_SETTINGS_KEY = 'tripxl_accessibility_settings';

// Default settings
const defaultSettings = {
  enabled: false,
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0,
  language: 'en-US'
};

// Available languages
const availableLanguages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'ar-AE', name: 'Arabic (UAE)' }
];

const AccessibilityToggle: React.FC<AccessibilityToggleProps> = ({ 
  className = '', 
  onToggle 
}) => {
  // State for accessibility settings
  const [settings, setSettings] = useState(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(ACCESSIBILITY_SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        
        // Notify parent component of initial state
        if (onToggle) {
          onToggle(parsedSettings.enabled);
        }
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }
  }, [onToggle]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(ACCESSIBILITY_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    const newSettings = { ...settings, enabled: checked };
    setSettings(newSettings);
    
    // Provide feedback when accessibility is toggled
    if (checked && VoiceGuidance.isSpeechAvailable()) {
      VoiceGuidance.speak('Accessibility features enabled. Voice guidance is now active.');
    } else if (VoiceGuidance.isSpeechAvailable()) {
      VoiceGuidance.speak('Accessibility features disabled.');
      // Stop any ongoing speech
      setTimeout(() => VoiceGuidance.stopSpeaking(), 1000);
    }
    
    // Notify parent component
    if (onToggle) {
      onToggle(checked);
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setSettings({ ...settings, volume: value[0] });
  };

  // Handle speech rate change
  const handleRateChange = (value: number[]) => {
    setSettings({ ...settings, rate: value[0] });
  };

  // Handle pitch change
  const handlePitchChange = (value: number[]) => {
    setSettings({ ...settings, pitch: value[0] });
  };

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, language: e.target.value });
  };

  // Test current settings
  const testVoice = () => {
    if (!VoiceGuidance.isSpeechAvailable()) {
      alert('Speech synthesis is not available in your browser.');
      return;
    }

    VoiceGuidance.speak(
      'This is a test of the voice guidance system. Your current settings will be used for all voice announcements.',
      {
        volume: settings.volume,
        rate: settings.rate,
        pitch: settings.pitch,
        lang: settings.language
      }
    );
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Switch
          id="accessibility-mode"
          checked={settings.enabled}
          onCheckedChange={handleToggleChange}
          aria-label="Toggle accessibility mode"
        />
        <Label 
          htmlFor="accessibility-mode" 
          className="cursor-pointer"
        >
          Accessibility
          {settings.enabled ? <Mic className="inline-block ml-2 h-4 w-4" /> : <VolumeX className="inline-block ml-2 h-4 w-4" />}
        </Label>
      </div>

      {settings.enabled && (
        <Popover open={showSettings} onOpenChange={setShowSettings}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              aria-label="Accessibility Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h3 className="font-medium">Voice Guidance Settings</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="volume">Volume</Label>
                  <span className="text-xs">{Math.round(settings.volume * 100)}%</span>
                </div>
                <Slider
                  id="volume"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[settings.volume]}
                  onValueChange={handleVolumeChange}
                  aria-label="Adjust voice volume"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="rate">Speech Rate</Label>
                  <span className="text-xs">{settings.rate}x</span>
                </div>
                <Slider
                  id="rate"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[settings.rate]}
                  onValueChange={handleRateChange}
                  aria-label="Adjust speech rate"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="pitch">Pitch</Label>
                  <span className="text-xs">{settings.pitch}</span>
                </div>
                <Slider
                  id="pitch"
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={[settings.pitch]}
                  onValueChange={handlePitchChange}
                  aria-label="Adjust speech pitch"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={settings.language}
                  onChange={handleLanguageChange}
                  aria-label="Select voice language"
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button 
                className="w-full flex items-center justify-center gap-2" 
                onClick={testVoice}
                aria-label="Test voice settings"
              >
                <Volume2 className="h-4 w-4" /> Test Voice
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default AccessibilityToggle;