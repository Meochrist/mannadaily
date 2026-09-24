// Helper pour les appels API avec Bearer token
// Remplace les appels fetch directs dans le frontend

const TOKEN_KEY = 'mannadaily_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiFetch<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
  const { params, headers = {}, ...rest } = options;
  
  // Construire l'URL avec les paramètres
  let fullUrl = url;
  if (params) {
    const searchParams = new URLSearchParams(params);
    fullUrl += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }
  
  // Ajouter le Bearer token
  const token = getAuthToken();
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(fullUrl, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
  });
  
  // Gérer les erreurs
  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Non autorisé');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(error.error || 'Erreur serveur');
  }
  
  return response.json();
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, string>) => 
    apiFetch<T>(url, { method: 'GET', params }),
    
  post: <T = any>(url: string, body?: any) => 
    apiFetch<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    
  put: <T = any>(url: string, body?: any) => 
    apiFetch<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    
  delete: <T = any>(url: string, params?: Record<string, string>) => 
    apiFetch<T>(url, { method: 'DELETE', params }),
};
