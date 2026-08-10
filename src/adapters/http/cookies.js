export function parseCookie(header, name) {
  return header?.split(";").find((c) => c.trim().startsWith(`${name}=`))?.split("=")[1];
}

export function buildAuthCookie(token, { secure, maxAge = 2592000 } = {}) {
  return `auth_token=${token}; Path=/; HttpOnly; ${secure ? "Secure;" : ""} SameSite=Lax; Max-Age=${maxAge}`;
}

export function buildLogoutCookie(secure) {
  return `auth_token=; Path=/; HttpOnly; ${secure ? "Secure;" : ""} SameSite=Lax; Max-Age=0`;
}
