'use client'

import { ReactNode } from 'react'
import { WagmiConfig, createConfig } from 'wagmi'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { injected } from '@wagmi/connectors'
import { createPublicClient, http } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  publicClient: (chain) =>
    createPublicClient({
      chain,
      transport: http('https://rpc.sepolia.org'),
    }),
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>{children}</WagmiConfig>
    </QueryClientProvider>
  )
}
