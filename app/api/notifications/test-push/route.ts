import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/server-api-proxy';

export const POST = (request: NextRequest) => {
    return proxyRequest(request, '/notifications/test-push', 'POST');
};
