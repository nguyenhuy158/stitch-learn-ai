export function startSsoLogin({ ssoIssuer, returnUrl }) {
  if (!ssoIssuer) throw new Error("SSO is not configured");
  const loginUrl = new URL(`${ssoIssuer}/login`);
  loginUrl.searchParams.set("redirect_uri", returnUrl);
  return loginUrl.toString();
}
