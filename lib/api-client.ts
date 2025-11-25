/**
 * Interface dasar untuk respons API Bantuin
 * Semua respons dari NestJS (melalui NextJS API) harus mengikuti format ini.
 */
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  // Tambahkan pagination atau error details jika ada
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

/**
 * Mengambil token JWT dari localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

/**
 * Helper untuk menangani Fetch dan Error
 */
const fetchWrapper = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Jika response OK (2xx), cek body respons (format standar Bantuin)
  if (response.ok) {
    const result: ApiResponse<T> = await response.json();
    
    // Pastikan success: true
    if (!result.success) {
        throw new Error(result.message || 'Respons API tidak berhasil.');
    }
    
    // Return objek lengkap (termasuk pagination jika ada)
    return result as unknown as T; 
  }

  // Jika response GAGAL (4xx atau 5xx)
  let errorData: any = { message: 'Terjadi kesalahan pada server' };
  try {
    errorData = await response.json();
  } catch (e) {
    // Abaikan jika tidak bisa parse JSON
  }
  
  // Jika 401 Unauthorized/Forbidden, paksa logout
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        // Arahkan ke halaman login/home
        window.location.href = '/'; 
    }
  }

  throw new Error(errorData.message || response.statusText);
};

// Base URL untuk semua request API NextJS kita
const API_BASE_URL = '/api'; 

export const apiClient = {
  get: <T>(path: string): Promise<T> => {
    return fetchWrapper<T>(`${API_BASE_URL}${path}`, { method: 'GET' });
  },

  post: <T>(path: string, body: any): Promise<T> => {
    return fetchWrapper<T>(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  
  // Tambahkan PATCH/DELETE sesuai kebutuhan modul lain
  patch: <T>(path: string, body: any): Promise<T> => {
    return fetchWrapper<T>(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};