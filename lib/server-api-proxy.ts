import { NextRequest, NextResponse } from 'next/server';

// Gunakan variabel internal untuk NestJS URL
const NESTJS_BASE_URL = process.env.NESTJS_API_URL || 'http://localhost:5500/api';

type ProxyMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export const proxyRequest = async (
  request: NextRequest,
  path: string, // path relatif ke NestJS, misal: /notifications
  method: ProxyMethod,
) => {
  // Gabungkan URL NestJS dengan path target
  const url = `${NESTJS_BASE_URL}${path}${method === 'GET' ? request.nextUrl.search : ''}`;
  
  const body = method !== 'GET' && method !== 'DELETE' ? await request.json().catch(() => undefined) : undefined;

  // Meneruskan header, termasuk Authorization: Bearer <token>
  const headers = new Headers(request.headers);
  headers.set('Content-Type', 'application/json'); 
  headers.delete('cookie'); // Jangan teruskan cookie ke backend

  try {
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      return new NextResponse(JSON.stringify(errorBody), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error(`Error during proxy to ${path}:`, error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
};