import { SignJWT, jwtVerify } from "jose";

/** @returns {import("../../ports/index.js").SessionPort} */
export function createJoseSessionProvider(secret) {
  const key = new TextEncoder().encode(secret);
  return {
    async sign(claims) {
      return new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(key);
    },
    async verify(token) {
      const { payload } = await jwtVerify(token, key);
      return payload;
    }
  };
}
