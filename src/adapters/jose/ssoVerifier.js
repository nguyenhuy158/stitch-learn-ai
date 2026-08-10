import { jwtVerify, createRemoteJWKSet } from "jose";

/** @returns {import("../../ports/index.js").SsoPort} */
export function createJoseSsoVerifier({ issuer, audience }) {
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  return {
    async verify(token) {
      const { payload } = await jwtVerify(token, jwks, { issuer, audience });
      return payload;
    }
  };
}
