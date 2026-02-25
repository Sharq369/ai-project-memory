import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0b0c10] text-white antialiased`}>
        {/* The relative wrapper ensures children are always in the foreground */}
        <div className="relative min-h-screen flex flex-col pointer-events-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
