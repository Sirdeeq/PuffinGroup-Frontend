import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || ""
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login"]

  // Check if the path is public
  const isPublicPath = publicPaths.includes(path)

  // If path requires authentication and no token exists, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is logged in and tries to access login page, redirect to appropriate section
  if (isPublicPath && token && path === "/login") {
    // We don't need to check auth here since we already have token
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If user is logged in and on root path, redirect to appropriate section
  if (path === "/" && token) {
    // We don't need to check auth here since we already have token
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
