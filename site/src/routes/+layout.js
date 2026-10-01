// Every page is prerendered at build time as a shell; the session and the
// data arrive in the browser. Pages whose address carries an id (a member, a
// group, an invitation) opt out and are served by the fallback page.
export const prerender = true;
export const trailingSlash = 'never';
