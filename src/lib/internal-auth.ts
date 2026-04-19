import { NextRequest } from 'next/server';

export function verifyInternalApiKey(request: NextRequest): boolean {
  const expectedKey = process.env.CRON_SECRET;
  if (!expectedKey) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  return authHeader.substring(7) === expectedKey;
}
