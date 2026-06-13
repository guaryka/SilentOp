import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SilentOp — Trading Journal & Analytics',
  description: 'Professional trading journal and analytics platform for serious traders. Connect MT5, TopStep and analyze your performance.',
  keywords: 'trading journal, trading analytics, MT5, TopStep, prop firm, trade tracking',
  openGraph: {
    title: 'SilentOp — Trading Journal & Analytics',
    description: 'Professional trading journal and analytics platform',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
