export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/my-work/:path*",
    "/teams/:path*",
    "/people/:path*",
    "/settings/:path*",
    "/priority/:path*",
    "/users/:path*",
    "/focus/:path*",
    "/search",
    "/search/:path*",
  ],
};
