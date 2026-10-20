import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/dictionaries";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  request.nextUrl.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!api|admin|_next|photos|icon.svg|icon-|apple-touch-icon|favicon.ico|robots.txt|sitemap.xml).*)"],
};
