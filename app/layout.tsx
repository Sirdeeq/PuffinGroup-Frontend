import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Puffin Group - Document Management System",
  description: "A comprehensive document management system for efficient file handling and collaboration.",
  keywords: "document management, file management, collaboration, Puffin Group",
  authors: [{ name: "Puffin Group" }],
  creator: "Puffin Group",
  publisher: "Puffin Group",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ffffff",
  openGraph: {
    title: "Puffin Group - Document Management System",
    description: "A comprehensive document management system for efficient file handling and collaboration.",
    url: "https://puffingroup.netlify.app",
    siteName: "Puffin Group",
    images: [
      {
        url: "/favicon.png",
        width: 192,
        height: 192,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Puffin Group - Document Management System",
    description: "A comprehensive document management system for efficient file handling and collaboration.",
    images: ["/favicon.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
