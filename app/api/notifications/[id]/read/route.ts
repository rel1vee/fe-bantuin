import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/server-api-proxy';
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return proxyRequest(request, `/notifications/${id}/read`, 'POST');
};