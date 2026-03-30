'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MenuProvider } from '@/contexts/MenuContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 2, staleTime: 5 * 60 * 1000 } },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <MenuProvider>{children}</MenuProvider>
    </QueryClientProvider>
  );
}
