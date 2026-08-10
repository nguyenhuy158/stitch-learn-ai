import { ValidationError } from "../errors.js";

export async function changePassword({ userId, password }, { userRepository, passwordHasher }) {
  if (!password || password.length < 6) throw new ValidationError("Password must be at least 6 characters");
  const { hash, salt } = await passwordHasher.hash(password);
  await userRepository.updatePassword(userId, { hash, salt });
}
