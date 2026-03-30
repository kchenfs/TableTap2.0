import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CHANGED: "middleware" is now "proxy"
export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  const appMode = hostname.includes('take-out') ? 'takeout' : 'dine-in';

  let tableId = appMode === 'takeout' ? 'takeout' : 'table-1';
  if (appMode === 'dine-in') {
    const match = pathname.match(/\/table-(\d+)/);
    if (match && match[0]) tableId = match[0].replace('/', '');
  }

  const response = NextResponse.next();
  response.headers.set('x-app-mode', appMode);
  response.headers.set('x-table-id', tableId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)'],
};