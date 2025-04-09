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
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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