import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (_) {}
    } else {
      try {
        const text = await response.text();
        errorMessage = text || errorMessage;
      } catch (_) {}
    }
    throw new Error(errorMessage);
  }

  if (isJson) {
    try {
      return await response.json();
    } catch (e: any) {
      throw new Error(`Failed to parse JSON response: ${e.message}`);
    }
  }

  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (e: any) {
    throw new Error(`Expected JSON but failed to parse response: ${e.message}`);
  }
};
