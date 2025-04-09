import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Bug,
  Check,
  ChevronRight,
  Clock,
  Filter,
  Info,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

interface DebugEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stackTrace?: string;
}

interface BookingDebugData {
  bookingId?: number;
  sessionId: string;
  entries: DebugEntry[];
  status: 'pending' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
}

function formatDebugData(data: any): string {
  if (!data) return '';
  
  try {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return String(data);
  }
}

function DebugEntryItem({ entry }: { entry: DebugEntry }) {
  const [expanded, setExpanded] = useState(false);

  const levelColors = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    debug: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const levelIcons = {
    info: <Info className="h-4 w-4" />,
    warn: <AlertCircle className="h-4 w-4" />,
    error: <X className="h-4 w-4" />,
    debug: <Bug className="h-4 w-4" />,
  };

  return (
    <div className="border rounded-md p-3 mb-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={levelColors[entry.level]}>
            <span className="flex items-center gap-1">
              {levelIcons[entry.level]}
              {entry.level.toUpperCase()}
            </span>
          </Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-6 w-6 p-0"
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </Button>
      </div>
      
      <div className="mt-2">
        <p className="text-sm font-medium">{entry.message}</p>
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t">
          {entry.data && (
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground mb-1 block">Data</Label>
              <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-96">
                {formatDebugData(entry.data)}
              </pre>
            </div>
          )}
          
          {entry.stackTrace && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Stack Trace</Label>
              <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-60">
                {entry.stackTrace}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionDetails({ sessionId }: { sessionId: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookingSession', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/debug/booking-sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }
      return response.json() as Promise<BookingDebugData>;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-muted-foreground text-sm">Failed to load session details</p>
          <Button onClick={() => refetch()} size="sm" variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  const statusColor = 
    data.status === 'completed' 
      ? 'bg-green-50 text-green-700 border-green-200' 
      : data.status === 'failed' 
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
  
  const statusIcon = 
    data.status === 'completed' 
      ? <Check className="h-4 w-4" />
      : data.status === 'failed' 
        ? <X className="h-4 w-4" />
        : <Clock className="h-4 w-4" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Session: {sessionId.substring(0, 8)}...</CardTitle>
            <CardDescription>
              Started: {new Date(data.startTime).toLocaleString()}
              {data.endTime && ` • Ended: ${new Date(data.endTime).toLocaleString()}`}
            </CardDescription>
          </div>
          <Badge variant="outline" className={statusColor}>
            <span className="flex items-center gap-1">
              {statusIcon}
              {data.status.toUpperCase()}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Booking ID:</Label>
            <span className="text-sm font-mono">
              {data.bookingId ? `#${data.bookingId}` : 'Not created'}
            </span>
          </div>
          <Button onClick={() => refetch()} size="sm" variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-2">
            <TabsTrigger value="all">All Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="warning">Warnings</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] border rounded-md p-4">
            <TabsContent value="all" className="mt-0">
              {data.entries.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No log entries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.entries.map((entry: DebugEntry, index: number) => (
                    <DebugEntryItem key={index} entry={entry} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="errors" className="mt-0">
              {data.entries.filter(e => e.level === 'error').length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No error entries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.entries
                    .filter(e => e.level === 'error')
                    .map((entry: DebugEntry, index: number) => (
                      <DebugEntryItem key={index} entry={entry} />
                    ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="warning" className="mt-0">
              {data.entries.filter(e => e.level === 'warn').length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No warning entries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.entries
                    .filter(e => e.level === 'warn')
                    .map((entry: DebugEntry, index: number) => (
                      <DebugEntryItem key={index} entry={entry} />
                    ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="info" className="mt-0">
              {data.entries.filter(e => e.level === 'info' || e.level === 'debug').length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No info entries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.entries
                    .filter(e => e.level === 'info' || e.level === 'debug')
                    .map((entry: DebugEntry, index: number) => (
                      <DebugEntryItem key={index} entry={entry} />
                    ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 bg-muted/50">
        <div className="text-xs text-muted-foreground w-full">
          <div className="flex justify-between w-full">
            <span>Session ID: {sessionId}</span>
            <span>Total Entries: {data.entries.length}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export function BookingDebugPanel() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'pending'>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookingSessions'],
    queryFn: async () => {
      const response = await fetch('/api/debug/booking-sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch debug sessions');
      }
      return response.json() as Promise<BookingDebugData[]>;
    },
  });

  const filteredData = data?.filter(session => {
    // Status filter
    if (statusFilter !== 'all' && session.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        session.sessionId.toLowerCase().includes(query) ||
        (session.bookingId?.toString().includes(query) || false) ||
        session.status.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  if (selectedSessionId) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSessionId(null)}
            className="mb-2"
          >
            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
            Back to Sessions
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <SessionDetails sessionId={selectedSessionId} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Booking Debug Sessions</CardTitle>
            <CardDescription>
              View and analyze booking creation sessions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by session ID or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center border rounded-md">
            <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
            <select
              className="bg-transparent px-2 py-2 text-sm outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading debug sessions...</p>
            </div>
          </div>
        ) : error || !data ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-muted-foreground">Failed to load debug sessions</p>
              <Button onClick={() => refetch()} size="sm" variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredData?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No debug sessions found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Session ID</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData?.map((session) => (
                <TableRow key={session.sessionId}>
                  <TableCell className="font-mono text-xs">
                    {session.sessionId.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {session.bookingId ? (
                      <span className="font-mono">#{session.bookingId}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not created</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(session.startTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        session.status === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : session.status === 'failed'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }
                    >
                      {session.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSessionSelect(session.sessionId)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}