import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Perfectly named for Next.js 16+
export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  const appMode = hostname.includes('take-out') ? 'takeout' : 'dine-in';
  let tableId = appMode === 'takeout' ? 'takeout' : 'table-1';

  let response;

  if (appMode === 'dine-in') {
    const match = pathname.match(/\/table-(\d+)/);
    
    if (match && match[0]) {
      // We found a table path (e.g., /table-12)
      tableId = match[0].replace('/', ''); 
      
      // THE FIX: Rewrite the request to the root page ('/') 
      // so Next.js doesn't look for an actual /table-12 folder
      const url = request.nextUrl.clone();
      url.pathname = '/';
      response = NextResponse.rewrite(url);
    } else {
      // Standard request to the root (/)
      response = NextResponse.next();
    }
  } else {
    // Takeout mode (request to the root)
    response = NextResponse.next();
  }

  // Attach our custom headers
  response.headers.set('x-app-mode', appMode);
  response.headers.set('x-table-id', tableId);
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)'],
};