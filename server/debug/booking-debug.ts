import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface DebugEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stackTrace?: string;
}

interface BookingDebugSession {
  sessionId: string;
  bookingId?: number;
  status: 'pending' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  entries: DebugEntry[];
}

class BookingDebugManager {
  private sessions: Map<string, BookingDebugSession>;
  private maxSessions: number;

  constructor(maxSessions = 20) {
    this.sessions = new Map();
    this.maxSessions = maxSessions;
  }

  createSession(): string {
    // Clean up old sessions if we exceed the maximum
    if (this.sessions.size >= this.maxSessions) {
      const sessionsArray = Array.from(this.sessions.entries());
      sessionsArray.sort((a, b) => {
        const timeA = new Date(a[1].startTime).getTime();
        const timeB = new Date(b[1].startTime).getTime();
        return timeA - timeB; // Sort oldest first
      });

      // Remove oldest session(s)
      const toRemove = Math.max(1, Math.floor(this.maxSessions * 0.2)); // Remove at least 1 or 20% of max
      for (let i = 0; i < toRemove && i < sessionsArray.length; i++) {
        this.sessions.delete(sessionsArray[i][0]);
      }
    }

    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      sessionId,
      status: 'pending',
      startTime: new Date().toISOString(),
      entries: []
    });

    return sessionId;
  }

  getSession(sessionId: string): BookingDebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  getAllSessions(): BookingDebugSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime(); // Newest first
    });
  }

  logInfo(sessionId: string, message: string, data?: any): void {
    this._addEntry(sessionId, 'info', message, data);
  }

  logDebug(sessionId: string, message: string, data?: any): void {
    this._addEntry(sessionId, 'debug', message, data);
  }

  logWarn(sessionId: string, message: string, data?: any): void {
    this._addEntry(sessionId, 'warn', message, data);
  }

  logError(sessionId: string, message: string, error?: any): void {
    let stackTrace: string | undefined;
    let errorData: any = undefined;
    
    if (error instanceof Error) {
      stackTrace = error.stack;
      errorData = {
        name: error.name,
        message: error.message
      };
    } else if (error) {
      errorData = error;
    }

    this._addEntry(sessionId, 'error', message, errorData, stackTrace);
  }

  setBookingId(sessionId: string, bookingId: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.bookingId = bookingId;
    }
  }

  completeSession(sessionId: string, success: boolean): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = success ? 'completed' : 'failed';
      session.endTime = new Date().toISOString();
    }
  }

  private _addEntry(
    sessionId: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: any,
    stackTrace?: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.entries.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stackTrace
    });
  }
}

export const bookingDebugManager = new BookingDebugManager();

// Middleware to initialize a debug session for booking operations
export function bookingDebugMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = bookingDebugManager.createSession();
  
  // Attach the session ID to the request for use in handlers
  (req as any).bookingDebugSessionId = sessionId;
  
  // Log initial request details
  bookingDebugManager.logInfo(sessionId, 'New booking request received', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  });
  
  // Override res.send to capture the response
  const originalSend = res.send;
  res.send = function(body): Response {
    bookingDebugManager.logInfo(sessionId, 'Response sent to client', {
      statusCode: res.statusCode,
      body: body && typeof body === 'string' ? 
        (body.length > 1000 ? body.substring(0, 1000) + '... (truncated)' : body) : 
        body
    });
    
    // Determine if the booking operation was successful based on status code
    const success = res.statusCode >= 200 && res.statusCode < 300;
    bookingDebugManager.completeSession(sessionId, success);
    
    return originalSend.call(this, body);
  };
  
  next();
}

// Utility function to log database operations related to bookings
export function logBookingDbOperation(
  operation: string,
  data: any
) {
  // Create a UUID-based session ID for this standalone log
  const sessionId = bookingDebugManager.createSession();
  
  // For backward compatibility, log through console
  console.log(`DB Operation [${operation}]:`, JSON.stringify(data, null, 2));
  
  // Also log to the debug manager
  bookingDebugManager.logDebug(
    sessionId,
    `Database operation: ${operation}`,
    data
  );
  
  // Complete the session
  bookingDebugManager.completeSession(sessionId, true);
}