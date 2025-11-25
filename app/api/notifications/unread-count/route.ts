import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/server-api-proxy';
export const GET = (request: NextRequest) => {
  return proxyRequest(request, '/notifications/unread-count', 'GET');
};