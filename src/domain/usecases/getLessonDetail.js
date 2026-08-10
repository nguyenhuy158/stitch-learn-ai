import { ValidationError } from "../errors.js";

export async function getLessonDetail({ lessonId }, { lessonRepository, vocabGeneratorPort }) {
  const lesson = await lessonRepository.findById(lessonId);
  if (!lesson) throw new ValidationError("Lesson not found");
  if (lesson.is_locked) throw new ValidationError("Lesson is locked");

  let vocab = await lessonRepository.listVocab(lessonId);
  if (vocab.length === 0) {
    const items = await vocabGeneratorPort.generate({ title: lesson.title, subTitle: lesson.sub_title });
    await lessonRepository.saveVocab(lessonId, items);
    vocab = await lessonRepository.listVocab(lessonId);
  }

  return { lesson, vocab };
}
