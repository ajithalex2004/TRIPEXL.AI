import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = `${res.status}: ${res.statusText}`;
    
    try {
      // First try to parse as JSON for structured error messages
      const errorData = await res.json();
      console.error('API Error Response (JSON):', errorData);
      
      if (errorData.error) {
        errorMessage = errorData.error;
        if (errorData.details) {
          // Handle different formats of details
          if (typeof errorData.details === 'string') {
            errorMessage += `: ${errorData.details}`;
          } else if (Array.isArray(errorData.details)) {
            errorMessage += `: ${errorData.details.join(', ')}`;
          } else if (typeof errorData.details === 'object') {
            errorMessage += `: ${JSON.stringify(errorData.details)}`;
          }
        }
      }
    } catch (jsonError) {
      // If JSON parsing fails, try to get text content
      try {
        const text = await res.clone().text();
        console.error('API Error Response (Text):', text);
        if (text) {
          errorMessage = `${res.status}: ${text}`;
        }
      } catch (textError) {
        console.error('Failed to parse error response:', textError);
      }
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
  
  // Enhanced debugging
  console.log(`🔍 API REQUEST: ${method} ${url}`);
  if (data) {
    console.log('Request Payload:', JSON.stringify(data, null, 2));
    
    // Special enhanced logging for booking API
    if (url.includes('/bookings') && method.toUpperCase() === 'POST') {
      console.log('⚠️ BOOKING REQUEST DETAILS ⚠️');
      
      // Ensure both ID fields are present in the request
      if (data.employee_id === undefined && data.employeeId !== undefined) {
        console.log('🔄 Adding missing employee_id field from employeeId');
        data.employee_id = Number(data.employeeId);
      } else if (data.employeeId === undefined && data.employee_id !== undefined) {
        console.log('🔄 Adding missing employeeId field from employee_id');
        data.employeeId = Number(data.employee_id);
      }
      
      // Validate and fix employee ID fields
      if (data.employee_id !== undefined) {
        if (typeof data.employee_id !== 'number') {
          data.employee_id = Number(data.employee_id);
          console.log('🔄 Converted employee_id to number:', data.employee_id);
        }
      }
      
      if (data.employeeId !== undefined) {
        if (typeof data.employeeId !== 'number') {
          data.employeeId = Number(data.employeeId);
          console.log('🔄 Converted employeeId to number:', data.employeeId);
        }
      }
      
      console.log('Employee ID:', data.employee_id, 'Type:', typeof data.employee_id);
      console.log('employeeId:', data.employeeId, 'Type:', typeof data.employeeId);
      console.log('ID fields comparison:', { 
        employee_id: data.employee_id, 
        employeeId: data.employeeId,
        equal: data.employee_id === data.employeeId
      });
      console.log('All keys in booking request:', Object.keys(data));
      console.log('⚠️ END BOOKING DETAILS ⚠️');
    }
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    // Log response details
    console.log(`📡 API RESPONSE: ${res.status} ${res.statusText}`);
    
    // Clone the response so we can log its content without consuming it
    const clonedRes = res.clone();
    try {
      const responseText = await clonedRes.text();
      if (responseText) {
        console.log('Response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      }
    } catch (e) {
      console.log('Could not log response body:', e);
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Enhanced debugging for specific endpoints
    const isBookingsEndpoint = url.includes('/bookings');
    if (isBookingsEndpoint) {
      console.log(`📊 Fetching data from bookings endpoint: ${url}`);
    }
    
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn(`⚠️ No auth token found for request to: ${url}`);
    }
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };

    try {
      const res = await fetch(url, {
        credentials: "include",
        headers
      });

      if (isBookingsEndpoint) {
        console.log(`📊 Bookings API response status: ${res.status} ${res.statusText}`);
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.warn(`🔒 Unauthorized access to ${url} - returning null as configured`);
        return null;
      }

      await throwIfResNotOk(res);
      
      const data = await res.json();
      
      // Enhanced debugging for bookings
      if (isBookingsEndpoint) {
        const hasData = Array.isArray(data) && data.length > 0;
        console.log(`📊 Bookings API returned ${hasData ? data.length : 0} records`);
        if (hasData) {
          console.log(`📊 First booking sample:`, data[0]);
        }
      }
      
      return data;
    } catch (error) {
      console.error(`🔥 Error fetching data from ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});