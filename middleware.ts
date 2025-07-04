import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || ""
  const path = request.nextUrl.pathname
  const userRole = request.cookies.get("userRole")?.value

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login"]

  // Function to determine redirect path based on role
  const getRedirectPath = (role: string | undefined): string => {
    if (!role) return "/dashboard/files/myfiles"
    
    switch (role) {
      case "admin":
        return "/dashboard"
      case "director":
        return "/dashboard/files/inbox"
      case "department":
        return "/dashboard/files/myfiles"
      default:
        return "/dashboard/files/myfiles"
    }
  }

  // If path requires authentication and no token exists, redirect to login
  if (!publicPaths.includes(path) && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Handle redirects when user is logged in
  if ((publicPaths.includes(path) || path === "/") && token) {
    const redirectPath = getRedirectPath(userRole)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Protect dashboard route for non-admin users
  if (path === "/dashboard" && token && userRole !== "admin") {
    const redirectPath = getRedirectPath(userRole)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
