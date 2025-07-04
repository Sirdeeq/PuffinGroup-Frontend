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

  // If user is logged in and tries to access login page, redirect based on role
  if (isPublicPath && token && path === "/login") {
    // Try to get user role from cookie or default redirect
    const userRole = request.cookies.get("userRole")?.value

    let redirectPath = "/dashboard/files/myfiles" // default

    if (userRole === "admin") {
      redirectPath = "/dashboard"
    } else if (userRole === "director") {
      redirectPath = "/dashboard/files/inbox"
    } else if (userRole === "department") {
      redirectPath = "/dashboard/files/myfiles"
    }

    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // If user is logged in and on root path, redirect based on role
  if (path === "/" && token) {
    const userRole = request.cookies.get("userRole")?.value

    let redirectPath = "/dashboard/files/myfiles" // default

    if (userRole === "admin") {
      redirectPath = "/dashboard"
    } else if (userRole === "director") {
      redirectPath = "/dashboard/files/inbox"
    } else if (userRole === "department") {
      redirectPath = "/dashboard/files/myfiles"
    }

    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Protect dashboard route for non-admin users
  if (path === "/dashboard" && token) {
    const userRole = request.cookies.get("userRole")?.value

    if (userRole !== "admin") {
      // Redirect non-admin users to their appropriate section
      let redirectPath = "/dashboard/files/myfiles"

      if (userRole === "director") {
        redirectPath = "/dashboard/files/inbox"
      } else if (userRole === "department") {
        redirectPath = "/dashboard/files/myfiles"
      }

      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
