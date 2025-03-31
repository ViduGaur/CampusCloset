import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): Promise<any> {
  // Add current user ID from localStorage if it exists
  const userId = localStorage.getItem('userId');
  const defaultHeaders: Record<string, string> = {};
  
  if (userId) {
    defaultHeaders['user-id'] = userId;
  }
  
  // Add Content-Type for JSON bodies
  if (body && !(body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  const requestBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;
  
  const res = await fetch(url, {
    method,
    headers: {
      ...defaultHeaders,
      ...(headers || {})
    },
    body: requestBody,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Parse JSON response if possible
  try {
    return await res.json();
  } catch (e) {
    return res;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add user-id header if available
    const userId = localStorage.getItem('userId');
    const headers: Record<string, string> = {};
    
    if (userId) {
      headers['user-id'] = userId;
    }
    
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
