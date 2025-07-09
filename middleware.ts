import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || ""
  const path = request.nextUrl.pathname
  const userRole = request.cookies.get("userRole")?.value
  
  // Add a small delay to ensure cookie updates are processed
  await new Promise(resolve => setTimeout(resolve, 100))

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login"]

  // Function to determine redirect path based on role
  const getRedirectPath = (role: string | undefined): string => {
    if (!role) return "/dashboard/files/inbox"

    switch (role) {
      case "admin":
        return "/dashboard"
      case "director":
      case "department":
      case "user":
        return "/dashboard/files/inbox"
      default:
        return "/dashboard/files/inbox"
    }
  }

  // If path requires authentication and no token exists, redirect to login
  if (!publicPaths.includes(path) && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Handle redirects when user is logged in and accessing public paths
  if ((publicPaths.includes(path) || path === "/") && token) {
    const redirectPath = getRedirectPath(userRole)
    // Add a small delay before redirect to ensure proper state updates
    const redirectResponse = new Promise((resolve) => {
      setTimeout(() => {
        resolve(NextResponse.redirect(new URL(redirectPath, request.url)))
      }, 100)
    })
    return redirectResponse
  }

  // Admin-only routes protection
  if (path === "/dashboard" && token) {
    if (userRole !== "admin") {
      // Non-admin users trying to access dashboard, redirect to inbox
      return NextResponse.redirect(new URL("/dashboard/files/inbox", request.url))
    }
    // Admin user accessing dashboard - allow
    return NextResponse.next()
  }

  // Allow all other authenticated requests
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
