import './globals.css'

export const metadata = {
  title:       'Prabisha PM — Project Management',
  description: 'Internal project management system for Prabisha Consulting',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 text-brand-ink antialiased">
        {children}
      </body>
    </html>
  )
}
