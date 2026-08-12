import { ValidationError } from "../errors.js";
import { recordLearningActivity } from "./recordLearningActivity.js";

export async function getLessonDetail({ lessonId, userId }, deps) {
  const { lessonRepository, vocabGeneratorPort, grammarContentGeneratorPort } = deps;
  const lesson = await lessonRepository.findById(lessonId);
  if (!lesson) throw new ValidationError("Lesson not found");
  if (lesson.is_locked) throw new ValidationError("Lesson is locked");

  if (lesson.type === "grammar") {
    let content = lesson.content;
    if (!content) {
      const generated = await grammarContentGeneratorPort.generate({ title: lesson.title, subTitle: lesson.sub_title });
      content = JSON.stringify(generated);
      await lessonRepository.saveContent(lessonId, content);
    }
    await recordLearningActivity({ userId }, deps);
    return { lesson, content: JSON.parse(content) };
  }

  let vocab = await lessonRepository.listVocab(lessonId);
  if (vocab.length === 0) {
    const items = await vocabGeneratorPort.generate({ title: lesson.title, subTitle: lesson.sub_title });
    await lessonRepository.saveVocab(lessonId, items);
    vocab = await lessonRepository.listVocab(lessonId);
  }

  // Opening a lesson is the most common way to study here, so it counts.
  await recordLearningActivity({ userId }, deps);

  return { lesson, vocab };
}
