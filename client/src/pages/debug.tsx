import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingDebugPanel } from "@/components/debug/booking-debug-panel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  RefreshCcw, 
  Clock,
  AlertTriangle
} from "lucide-react";

interface ServerInfo {
  version: string;
  uptime: number;
  startTime: string;
  environment: string;
  memory: {
    used: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    total: number;
  };
  cpu: number;
  platform: string;
  arch: string;
  nodeVersion: string;
}

interface DBStatus {
  connected: boolean;
  database: string;
  error?: string;
  version?: string;
}

interface WorkflowStatus {
  workflows: Array<{
    id: string;
    name: string;
    status: string;
    startedAt: string;
    uptime: number;
  }>;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function ServerInfoPanel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['serverInfo'],
    queryFn: async () => {
      const response = await fetch('/api/debug/server-info');
      if (!response.ok) {
        throw new Error('Failed to fetch server information');
      }
      return response.json() as Promise<ServerInfo>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { 
    data: dbStatus, 
    isLoading: isDbLoading,
    refetch: refetchDb
  } = useQuery({
    queryKey: ['dbStatus'],
    queryFn: async () => {
      const response = await fetch('/api/debug/db-status');
      if (!response.ok) {
        throw new Error('Failed to fetch database status');
      }
      return response.json() as Promise<DBStatus>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { 
    data: workflowStatus, 
    isLoading: isWorkflowLoading,
    refetch: refetchWorkflow
  } = useQuery({
    queryKey: ['workflowStatus'],
    queryFn: async () => {
      const response = await fetch('/api/debug/workflows');
      if (!response.ok) {
        throw new Error('Failed to fetch workflow status');
      }
      return response.json() as Promise<WorkflowStatus>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
    refetchDb();
    refetchWorkflow();
  };

  if (isLoading || isDbLoading || isWorkflowLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading system information...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-muted-foreground">Failed to load system information</p>
          <Button onClick={handleRefresh} size="sm" variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const memoryUsagePercent = (data.memory.used / data.memory.total) * 100;
  const heapUsagePercent = (data.memory.heapUsed / data.memory.heapTotal) * 100;
  const cpuUsagePercent = data.cpu * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">System Diagnostics</h2>
        <Button onClick={handleRefresh} size="sm" variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Server Information Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Server Info</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>System details and uptime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Environment</span>
                <Badge variant="outline">{data.environment}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Version</span>
                <span className="text-sm font-mono">{data.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{formatUptime(data.uptime)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Platform</span>
                <span className="text-sm">{data.platform} ({data.arch})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Node.js</span>
                <span className="text-sm">{data.nodeVersion}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Resource Usage</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Memory and CPU metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm">{formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}</span>
                </div>
                <Progress value={memoryUsagePercent} 
                  className={`h-2 ${memoryUsagePercent > 80 ? 'bg-red-200' : memoryUsagePercent > 60 ? 'bg-amber-200' : 'bg-muted'}`}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Heap Usage</span>
                  <span className="text-sm">{formatBytes(data.memory.heapUsed)} / {formatBytes(data.memory.heapTotal)}</span>
                </div>
                <Progress value={heapUsagePercent} 
                  className={`h-2 ${heapUsagePercent > 80 ? 'bg-red-200' : heapUsagePercent > 60 ? 'bg-amber-200' : 'bg-muted'}`}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm">{cpuUsagePercent.toFixed(1)}%</span>
                </div>
                <Progress value={cpuUsagePercent} 
                  className={`h-2 ${cpuUsagePercent > 80 ? 'bg-red-200' : cpuUsagePercent > 60 ? 'bg-amber-200' : 'bg-muted'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Connection status and info</CardDescription>
          </CardHeader>
          <CardContent>
            {dbStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {dbStatus.connected ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Disconnected
                    </Badge>
                  )}
                </div>
                
                {dbStatus.connected ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Type</span>
                      <span className="text-sm">{dbStatus.database}</span>
                    </div>
                    {dbStatus.version && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Version</span>
                        <span className="text-sm">{dbStatus.version}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-red-500">{dbStatus.error || "Connection failed"}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-24">
                <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflows Status Card */}
      {workflowStatus && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Active Workflows</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Running services and processes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflowStatus.workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={
                        workflow.status === "running" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : workflow.status === "pending" 
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {workflow.status}
                    </Badge>
                    <div>
                      <h4 className="font-medium">{workflow.name}</h4>
                      <p className="text-xs text-muted-foreground">ID: {workflow.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatUptime(workflow.uptime)}</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DebugPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8 space-y-8">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Diagnostics</h1>
            <p className="text-muted-foreground">
              System monitoring and debugging tools
            </p>
          </div>

          <Tabs defaultValue="bookings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="bookings">Booking Debug</TabsTrigger>
              <TabsTrigger value="system">System Info</TabsTrigger>
            </TabsList>
            <TabsContent value="bookings" className="space-y-4">
              <BookingDebugPanel />
            </TabsContent>
            <TabsContent value="system" className="space-y-4">
              <ServerInfoPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}