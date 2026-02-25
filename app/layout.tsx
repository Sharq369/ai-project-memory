import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0b0c10] text-white antialiased`}>
        {/* Background Fix: pointer-events-none ensures buttons are clickable */}
        <div className="fixed inset-0 bg-[#0b0c10] pointer-events-none -z-10" />
        
        <div className="relative min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
