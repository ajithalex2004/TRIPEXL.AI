import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Play,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookingType, BookingPurpose, Priority } from '@shared/schema';

// Diagnostic test types
type DiagnosticTestType = 'auth' | 'payload' | 'db' | 'advanced';

// Test stage/step in the diagnostic process
interface TestStage {
  name: string;
  success: boolean;
  message: string;
  details: any;
}

// Test result type
interface DiagnosticResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  stages?: TestStage[];
}

export const BookingDiagnosticTool: React.FC = () => {
  // State for selected test type
  const [testType, setTestType] = useState<DiagnosticTestType>('auth');
  
  // Test configuration state
  const [configEmployeeId, setConfigEmployeeId] = useState<string>('');
  const [configBookingType, setConfigBookingType] = useState<string>('');
  const [configPurpose, setConfigPurpose] = useState<string>('');
  const [configPriority, setConfigPriority] = useState<string>('');
  const [configPickupAddress, setConfigPickupAddress] = useState<string>('');
  const [configDropoffAddress, setConfigDropoffAddress] = useState<string>('');
  const [configRemarks, setConfigRemarks] = useState<string>('');
  
  // Result state 
  const [testResult, setTestResult] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  
  // Token handling
  const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };
  
  // Toggle stage expansion
  const toggleStageExpansion = (stageName: string) => {
    if (expandedStages.includes(stageName)) {
      setExpandedStages(expandedStages.filter(name => name !== stageName));
    } else {
      setExpandedStages([...expandedStages, stageName]);
    }
  };
  
  // Format JSON for display
  const formatJson = (json: any): string => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };
  
  // Run the selected diagnostic test
  const runDiagnosticTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        setTestResult({
          status: 'error',
          message: 'No authentication token found. Please log in first.',
        });
        setIsLoading(false);
        return;
      }
      
      let endpoint = '';
      let method = 'GET';
      let payload = null;
      
      // Configure the test based on type
      switch (testType) {
        case 'auth':
          endpoint = '/api/booking-debug-trace/auth';
          break;
          
        case 'payload':
          endpoint = '/api/booking-debug-trace/payload';
          method = 'POST';
          payload = createTestPayload();
          break;
          
        case 'db':
          endpoint = '/api/booking-debug-trace/db';
          method = 'POST';
          payload = createTestPayload();
          break;
          
        case 'advanced':
          endpoint = '/api/booking-debug-advanced/test';
          method = 'POST';
          payload = createTestPayload();
          break;
          
        default:
          setTestResult({
            status: 'error',
            message: 'Invalid test type selected',
          });
          setIsLoading(false);
          return;
      }
      
      // Execute API request
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: method === 'POST' ? JSON.stringify(payload) : undefined,
      });
      
      const data = await response.json();
      
      setTestResult({
        status: data.status === 'success' ? 'success' : 'error',
        message: data.message,
        stages: data.stages || [],
      });
      
      // Auto-expand failed stages
      if (data.stages) {
        const failedStages = data.stages
          .filter((stage: TestStage) => !stage.success)
          .map((stage: TestStage) => stage.name);
          
        setExpandedStages(failedStages);
      }
      
    } catch (error) {
      console.error('Diagnostic test error:', error);
      setTestResult({
        status: 'error',
        message: `Failed to execute test: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a test payload based on configuration
  const createTestPayload = () => {
    const employeeId = configEmployeeId ? parseInt(configEmployeeId, 10) : 1; // Default to ID 1 if not specified
    
    return {
      employee_id: employeeId,
      booking_type: configBookingType || 'official',
      purpose: configPurpose || 'Hospital Visit',
      priority: configPriority || 'Normal',
      pickup_location: {
        address: configPickupAddress || 'Dubai Healthcare City',
        coordinates: { lat: 25.2307, lng: 55.3270 } // Default Dubai coordinates
      },
      dropoff_location: {
        address: configDropoffAddress || 'Dubai Mall',
        coordinates: { lat: 25.1972, lng: 55.2744 } // Default Dubai Mall coordinates
      },
      remarks: configRemarks || 'Diagnostic test payload',
    };
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">Run Test</TabsTrigger>
          <TabsTrigger value="configure">Configure Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Booking System Diagnostic Test</CardTitle>
              <CardDescription>
                Run tests to troubleshoot booking creation issues
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-type">Test Type</Label>
                  <Select 
                    value={testType} 
                    onValueChange={(value: string) => setTestType(value as DiagnosticTestType)}
                  >
                    <SelectTrigger id="test-type">
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auth">Authentication Test</SelectItem>
                      <SelectItem value="payload">Payload Validation Test</SelectItem>
                      <SelectItem value="db">Database Operation Test</SelectItem>
                      <SelectItem value="advanced">Advanced Diagnostic Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  {testType === 'auth' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Authentication Test</AlertTitle>
                      <AlertDescription>
                        Tests the authentication token validity and user permissions.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {testType === 'payload' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Payload Validation Test</AlertTitle>
                      <AlertDescription>
                        Tests if the booking payload meets all validation requirements.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {testType === 'db' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Database Test</AlertTitle>
                      <AlertDescription>
                        Tests if the booking can be properly formatted for database storage.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {testType === 'advanced' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Advanced Diagnostic Test</AlertTitle>
                      <AlertDescription>
                        Comprehensive test of authentication, payload validation, and database operations.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {testResult && (
                  <div className="mt-4">
                    <Alert variant={testResult.status === 'success' ? 'default' : 'destructive'}>
                      {testResult.status === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {testResult.status === 'success' ? 'Test Passed' : 'Test Failed'}
                      </AlertTitle>
                      <AlertDescription>{testResult.message}</AlertDescription>
                    </Alert>
                    
                    {testResult.stages && testResult.stages.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h3 className="text-lg font-medium">Test Stages</h3>
                        {testResult.stages.map((stage, index) => (
                          <div
                            key={`${stage.name}-${index}`}
                            className={cn(
                              "border rounded-md overflow-hidden",
                              stage.success ? "border-green-200" : "border-red-200"
                            )}
                          >
                            <div
                              className={cn(
                                "flex items-center justify-between p-3 cursor-pointer",
                                stage.success ? "bg-green-50" : "bg-red-50"
                              )}
                              onClick={() => toggleStageExpansion(stage.name)}
                            >
                              <div className="flex items-center gap-2">
                                {stage.success ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span className="font-medium">{stage.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm mr-2">{stage.message}</span>
                                {expandedStages.includes(stage.name) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                            
                            {expandedStages.includes(stage.name) && (
                              <div className="p-3 bg-background border-t">
                                <pre className="text-xs overflow-auto p-2 bg-muted rounded-md">
                                  {formatJson(stage.details)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                onClick={runDiagnosticTest}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Test...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Run {testType} Test
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="configure">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Configure test parameters for booking diagnostics
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="employee-id">Employee ID</Label>
                    <Input
                      id="employee-id"
                      value={configEmployeeId}
                      onChange={(e) => setConfigEmployeeId(e.target.value)}
                      placeholder="Enter employee ID (default: 1)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="booking-type">Booking Type</Label>
                      <Select 
                        value={configBookingType} 
                        onValueChange={setConfigBookingType}
                      >
                        <SelectTrigger id="booking-type">
                          <SelectValue placeholder="Select booking type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(BookingType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="purpose">Purpose</Label>
                      <Select 
                        value={configPurpose} 
                        onValueChange={setConfigPurpose}
                      >
                        <SelectTrigger id="purpose">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(BookingPurpose).map((purpose) => (
                            <SelectItem key={purpose} value={purpose}>
                              {purpose}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={configPriority} 
                      onValueChange={setConfigPriority}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Priority).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="pickup-address">Pickup Address</Label>
                    <Input
                      id="pickup-address"
                      value={configPickupAddress}
                      onChange={(e) => setConfigPickupAddress(e.target.value)}
                      placeholder="Enter pickup address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dropoff-address">Dropoff Address</Label>
                    <Input
                      id="dropoff-address"
                      value={configDropoffAddress}
                      onChange={(e) => setConfigDropoffAddress(e.target.value)}
                      placeholder="Enter dropoff address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={configRemarks}
                      onChange={(e) => setConfigRemarks(e.target.value)}
                      placeholder="Enter any additional remarks"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset all configuration fields
                  setConfigEmployeeId('');
                  setConfigBookingType('');
                  setConfigPurpose('');
                  setConfigPriority('');
                  setConfigPickupAddress('');
                  setConfigDropoffAddress('');
                  setConfigRemarks('');
                }}
              >
                Reset
              </Button>
              <Button onClick={() => runDiagnosticTest()}>
                Save & Run Test
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};