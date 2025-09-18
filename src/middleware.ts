import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['ca', 'es'],
 
  // Used when no locale matches
  defaultLocale: 'ca'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ca|es)/:path*']
};
