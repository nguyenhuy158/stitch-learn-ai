/** Cac lan dich gan nhat, de nguoi hoc xem lai loi da mac. */
export async function getTranslationHistory({ userId }, { translationRepository }) {
  return { attempts: await translationRepository.listAttempts(userId, 100) };
}
