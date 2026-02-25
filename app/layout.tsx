export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0c10] text-white antialiased">
        {/* FIX: Ensure the background cannot intercept clicks */}
        <div className="fixed inset-0 bg-[#0b0c10] pointer-events-none -z-10" />
        
        {/* MAIN WRAPPER */}
        <div className="relative min-h-screen flex flex-col pointer-events-auto">
          {children}
        </div>
      </body>
    </html>
  )
}
