import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Memory AI | Neural Terminal',
  description: 'Advanced Project Vault',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0b0c10] text-white antialiased`}>
        {/* THE BACKGROUND FIX: 
          Using -z-10 and pointer-events-none ensures this 
          background is physically BEHIND your buttons.
        */}
        <div className="fixed inset-0 bg-[#0b0c10] pointer-events-none -z-10" />
        
        {/* THE CLICK FIX: 
          This relative wrapper ensures your page content 
          is in the foreground and ready to be tapped.
        */}
        <div className="relative min-h-screen flex flex-col pointer-events-auto">
          {children}
        </div>
      </body>
    </html>
  )
}
