import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/server-api-proxy';
export const POST = (
  request: NextRequest, 
  { params }: { params: { id: string } }
) => {
  const { id } = params;
  return proxyRequest(request, `/notifications/${id}/read`, 'POST');
};