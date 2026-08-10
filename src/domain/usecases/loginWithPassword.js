import { ValidationError, AuthError } from "../errors.js";

export async function loginWithPassword({ email, password }, { userRepository, passwordHasher, sessionPort }) {
  if (!email || !password) throw new ValidationError("Email and password required");
  const user = await userRepository.findByEmail(email);
  if (!user || !user.password_hash || !user.salt) throw new AuthError("Invalid credentials");
  const { hash } = await passwordHasher.hash(password, user.salt);
  if (hash !== user.password_hash) throw new AuthError("Invalid credentials");
  const token = await sessionPort.sign({ id: user.id, email: user.email });
  return { token, user };
}
