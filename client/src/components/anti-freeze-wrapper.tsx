import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AntiFreezeWrapperProps {
  children: React.ReactNode;
  timeoutMs?: number;
  componentName?: string;
}

/**
 * A wrapper component that prevents UI freezing by monitoring responsiveness
 * and providing recovery options if a component causes the page to become unresponsive.
 */
export function AntiFreezeWrapper({
  children,
  timeoutMs = 3000,
  componentName = 'Component'
}: AntiFreezeWrapperProps) {
  const [isTimeout, setIsTimeout] = useState(false);
  const [showComponent, setShowComponent] = useState(true);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Check if UI is still responsive after timeout
      const startTime = Date.now();
      
      // Create a microtask to check responsiveness
      // This will only execute if the UI thread is responsive
      requestAnimationFrame(() => {
        const responseTime = Date.now() - startTime;
        
        // If response time is greater than 500ms, UI might be struggling
        if (responseTime > 500 && !recoveryAttempted) {
          setIsTimeout(true);
        }
      });
    }, timeoutMs);

    return () => clearTimeout(timeoutId);
  }, [timeoutMs, recoveryAttempted]);

  const handleContinueWithout = () => {
    setShowComponent(false);
    setIsTimeout(false);
    setRecoveryAttempted(true);
  };

  const handleRetry = () => {
    // Force a re-render and retry with component
    setIsTimeout(false);
    setRecoveryAttempted(true);
    
    // Add a small delay to allow React to clean up first
    setTimeout(() => {
      setShowComponent(true);
    }, 100);
  };

  // If there's a timeout warning and component is still shown
  if (isTimeout && showComponent) {
    return (
      <Card className="w-full shadow-md border-amber-200">
        <CardHeader className="bg-amber-50 border-b border-amber-100">
          <CardTitle className="text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Page Responsiveness Warning
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <p className="text-sm text-gray-600">
            The {componentName} is taking longer than expected to load and might be affecting page responsiveness.
          </p>
        </CardContent>
        <CardFooter className="bg-gray-50 p-3 flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleContinueWithout}
          >
            Continue Without {componentName}
          </Button>
          <Button 
            variant="default" 
            onClick={handleRetry}
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If user chose to continue without the component
  if (!showComponent) {
    return (
      <Card className="w-full p-4 bg-gray-50 border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          {componentName} has been disabled for better performance.
        </p>
        <Button 
          variant="link" 
          className="mt-2 p-0 h-auto text-sm" 
          onClick={() => setShowComponent(true)}
        >
          Re-enable {componentName}
        </Button>
      </Card>
    );
  }

  // Default: show the component
  return <>{children}</>;
}