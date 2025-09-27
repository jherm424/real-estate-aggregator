'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useState } from 'react';
import theme from '../styles/theme';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000,
      },
    },
  }));

  return (
    <html lang="en">
      <head>
        <title>Real Estate Aggregator</title>
        <meta name="description" content="Find your perfect rental property" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider theme={theme}>
            {children}
          </ChakraProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}