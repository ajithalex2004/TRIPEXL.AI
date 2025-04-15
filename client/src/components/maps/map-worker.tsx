import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Worker timeout values (in milliseconds)
const WORKER_TIMEOUT = 3000; // If the map doesn't initialize in 3 seconds, we'll offer recovery options
const MAX_WAIT_TIME = 8000; // Maximum time to wait before automatically recovering

interface MapWorkerProps {
  children: React.ReactNode;
  timeout?: number;
  fallback?: React.ReactNode;
}

/**
 * MapWorker component
 * 
 * This component acts as a safety net around Google Maps to prevent it from
 * freezing the UI. It uses a timeout mechanism to detect if the map is taking
 * too long to load and offers recovery options.
 */
export function MapWorker({ 
  children, 
  timeout = WORKER_TIMEOUT,
  fallback
}: MapWorkerProps) {
  const [isResponsive, setIsResponsive] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingCountRef = useRef(0);
  const pingResponseRef = useRef(0);
  
  // Set up the worker monitoring
  useEffect(() => {
    const startMonitoring = () => {
      // Clear any existing timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      
      // Reset state
      setIsResponsive(true);
      setHasTimedOut(false);
      setIsRecovering(false);
      pingCountRef.current = 0;
      pingResponseRef.current = 0;
      
      // Start monitoring responsiveness with ping intervals
      pingIntervalRef.current = setInterval(() => {
        const currentPing = ++pingCountRef.current;
        
        // Check if UI is responsive
        requestAnimationFrame(() => {
          pingResponseRef.current = currentPing;
        });
      }, 200); // Check every 200ms
      
      // Set timeout to check for responsiveness issues
      timeoutRef.current = setTimeout(() => {
        // If ping count and response are different by more than 2, UI is not responsive
        if (pingCountRef.current - pingResponseRef.current > 2) {
          setIsResponsive(false);
          setHasTimedOut(true);
          
          // Clear the ping interval since we've detected an issue
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
        }
      }, timeout);
      
      // Set absolute maximum wait time
      maxTimeoutRef.current = setTimeout(() => {
        // Force recovery if we've waited too long
        if (!isResponsive || hasTimedOut) {
          handleRecover();
        }
      }, MAX_WAIT_TIME);
    };
    
    // Start monitoring
    startMonitoring();
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [timeout, isResponsive, hasTimedOut]);
  
  // Handle recovery action
  const handleRecover = () => {
    setIsRecovering(true);
    
    // Clear any existing monitoring
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    
    // Use setTimeout to give the browser a chance to recover
    setTimeout(() => {
      setIsResponsive(true);
      setHasTimedOut(false);
      setIsRecovering(false);
    }, 100);
  };
  
  // Handle refresh action
  const handleRefresh = () => {
    window.location.reload();
  };
  
  // If we have a timeout, show recovery UI
  if (hasTimedOut && !isResponsive) {
    // If there's a custom fallback, use it
    if (fallback) return <>{fallback}</>;
    
    // Otherwise show default recovery UI
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="bg-amber-50 border-b border-amber-100">
          <CardTitle className="text-amber-700 flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Map Taking Too Long
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-sm text-gray-600">
          <p>The map is taking longer than expected to load. This might be causing the page to become unresponsive.</p>
          <p className="mt-2">You can:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Wait for the map to finish loading</li>
            <li>Continue without the map</li>
            <li>Refresh the page</li>
          </ul>
        </CardContent>
        <CardFooter className="bg-gray-50 p-3 flex justify-between gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRecover}
            className="flex-1"
            disabled={isRecovering}
          >
            {isRecovering ? 'Recovering...' : 'Continue Without Map'}
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleRefresh}
            className="flex-1 gap-1"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Page
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // If everything is fine, render children
  return <>{children}</>;
}