/**
 * File Upload Utility
 * Handles all file upload operations using the backend API endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api";

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    path: string;
    filename: string;
  };
}

export interface UploadError {
  statusCode: number;
  message: string;
  error: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

/**
 * General file upload to Supabase Storage
 */
export async function uploadFile(
  file: File,
  options?: {
    bucket?: string;
    path?: string;
  }
): Promise<UploadResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required. Please login first.");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (options?.bucket) {
    formData.append("bucket", options.bucket);
  }
  if (options?.path) {
    formData.append("path", options.path);
  }

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error: UploadError = await response.json();
    throw new Error(error.message || "Upload failed");
  }

  return response.json();
}

/**
 * Upload account photo
 * Path structure: [nama-nim]/filename
 */
export async function uploadAccountPhoto(file: File, fullName: string, nim?: string | null): Promise<UploadResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required. Please login first.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fullName", fullName);
  if (nim) {
    formData.append("nim", nim);
  }

  const response = await fetch(`${API_URL}/upload/account-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error: UploadError = await response.json();
    throw new Error(error.message || "Account photo upload failed");
  }

  return response.json();
}

/**
 * Upload service photo
 * Path structure: [nama-nim]/penjual/[nama-jasa]/filename
 */
export async function uploadServicePhoto(file: File, fullName: string, serviceName: string, nim?: string | null): Promise<UploadResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required. Please login first.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fullName", fullName);
  formData.append("serviceName", serviceName);
  if (nim) {
    formData.append("nim", nim);
  }

  const response = await fetch(`${API_URL}/upload/service-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error: UploadError = await response.json();
    throw new Error(error.message || "Service photo upload failed");
  }

  return response.json();
}

/**
 * Upload seller order photo
 * Path structure: [nama-nim]/penjual/[nama-pesanan]/filename
 */
export async function uploadSellerOrderPhoto(file: File, fullName: string, orderName: string, nim?: string | null): Promise<UploadResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required. Please login first.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fullName", fullName);
  formData.append("orderName", orderName);
  if (nim) {
    formData.append("nim", nim);
  }

  const response = await fetch(`${API_URL}/upload/seller-order-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error: UploadError = await response.json();
    throw new Error(error.message || "Seller order photo upload failed");
  }

  return response.json();
}

/**
 * Upload buyer order photo
 * Path structure: [nama-nim]/pembeli/[nama-pesanan]/filename
 */
export async function uploadBuyerOrderPhoto(file: File, fullName: string, orderName: string, nim?: string | null): Promise<UploadResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required. Please login first.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fullName", fullName);
  formData.append("orderName", orderName);
  if (nim) {
    formData.append("nim", nim);
  }

  const response = await fetch(`${API_URL}/upload/buyer-order-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error: UploadError = await response.json();
    throw new Error(error.message || "Buyer order photo upload failed");
  }

  return response.json();
}

/**
 * Delete file from Supabase Storage
 * @param path - The path to the file in storage (e.g., "uploads/user-name/file.jpg")
 */
export async function deleteFile(path: string): Promise<DeleteResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required. Please login first.");
  }

  const response = await fetch(`${API_URL}/upload?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: UploadError = await response.json();
    throw new Error(error.message || "Delete failed");
  }

  return response.json();
}
