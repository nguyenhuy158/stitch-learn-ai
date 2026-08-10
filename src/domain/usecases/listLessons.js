export async function listLessons({ lessonRepository }) {
  return lessonRepository.listAll();
}
