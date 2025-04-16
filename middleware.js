import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // Add required headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', [
    'Content-Type',
    'Authorization',
    'User-Agent',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform'
  ].join(', '));

  return response;
}

export const config = {
  matcher: '/api/:path*',
}; 