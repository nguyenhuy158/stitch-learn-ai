import { createAvatar } from "@dicebear/core";
import { funEmoji } from "@dicebear/collection";

/**
 * Fallback avatar for users with no picture (e.g. Google didn't return one,
 * or a password-only signup). Deterministic from seed — same seed always
 * renders the same face, no DB column needed to remember "which avatar".
 * Same library/style choice as chia-keo's src/components/Avatar.tsx — see
 * that repo's docs/avatar-libs.md for why DiceBear over boring-avatars/multiavatar.
 */
export function createDicebearAvatarGenerator() {
  return {
    generate(seed) {
      return createAvatar(funEmoji, { seed: seed || "?", size: 96 }).toDataUri();
    }
  };
}
