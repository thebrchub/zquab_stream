// Define the base URL for local vs Vercel production
export const API_HOST = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'https://aarpaar-api.brchub.tech');

const API_BASE = `${API_HOST}/api/v1`;
const PUBLIC_BASE = `${API_HOST}/public/v1`;

type ApiError = Error & { status?: number };

const toError = async (response: Response): Promise<ApiError> => {
  let message = 'API request failed';
  try {
    const errorData = await response.json();
    message = errorData.error || message;
  } catch {
    message = response.statusText;
  }
  const error = new Error(message) as ApiError;
  error.status = response.status;
  return error;
};

// The core fetch logic handling credentials, headers, and errors
const fetchWrapper = async (endpoint: string, options: RequestInit = {}) => {
  // If endpoint is '/auth/guest', url becomes 'https://aarpaar-api.brchub.tech/api/v1/auth/guest'
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Ensure cookies/sessions are sent cross-domain
  });

  if (!response.ok) throw await toError(response);

  // Parse JSON (unless it's a 204 No Content response)
  const data = response.status === 204 ? null : await response.json();
  
  // Wrap the result in a "data" object so `res.data` works in your other files!
  return { data };
};

// Reads from /public/v1: the same answer for everyone, cached by Cloudflare.
// No cookies and no custom headers, so the browser sends a plain GET (no CORS
// preflight) and the edge can serve it to anyone.
export const publicGet = async <T,>(endpoint: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(`${PUBLIC_BASE}${endpoint}`, { credentials: 'omit', signal });
  if (!response.ok) throw await toError(response);
  return response.json();
};

// Export the apiClient object matching the structure your other files expect
export const apiClient = {
  get: (endpoint: string, signal?: AbortSignal) => fetchWrapper(endpoint, { method: 'GET', signal }),
  
  post: (endpoint: string, body?: any) => fetchWrapper(endpoint, { 
    method: 'POST', 
    body: body ? JSON.stringify(body) : undefined 
  }),
  
  put: (endpoint: string, body?: any) => fetchWrapper(endpoint, { 
    method: 'PUT', 
    body: body ? JSON.stringify(body) : undefined 
  }),

  // Added the missing patch method here!
  patch: (endpoint: string, body?: any) => fetchWrapper(endpoint, { 
    method: 'PATCH', 
    body: body ? JSON.stringify(body) : undefined 
  }),
  
  delete: (endpoint: string) => fetchWrapper(endpoint, { method: 'DELETE' }),
};