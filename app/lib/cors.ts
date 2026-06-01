import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = new Set<string>([
  'https://www.takshaga.com',
  'https://takshaga.com',
  // local dev for the marketing site, harmless in prod
  'http://localhost:3000',
  'http://localhost:3001',
]);

function resolveOrigin(request: NextRequest | Request): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

export function applyCors(
  request: NextRequest | Request,
  response: NextResponse
): NextResponse {
  const origin = resolveOrigin(request);
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  return response;
}

export function corsJson(
  request: NextRequest | Request,
  body: unknown,
  init?: ResponseInit
): NextResponse {
  return applyCors(request, NextResponse.json(body, init));
}

export function corsPreflight(request: NextRequest | Request): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  const origin = resolveOrigin(request);
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      request.headers.get('access-control-request-headers') ||
        'Content-Type, Authorization'
    );
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  return response;
}
