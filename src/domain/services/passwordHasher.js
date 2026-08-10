export const passwordHasher = {
  async hash(password, salt) {
    const enc = new TextEncoder();
    const saltStr = salt || btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: enc.encode(saltStr),
        iterations: 1e5,
        hash: "SHA-256"
      },
      key,
      256
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return { hash: hashHex, salt: saltStr };
  }
};
