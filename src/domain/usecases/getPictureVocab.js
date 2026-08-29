import { PICTURE_VOCAB_TOPICS } from "../../data/pictureVocab.js";

/**
 * Picture-dictionary vocab AND Quizlet phrase sets, both bundled with the Worker.
 * Each set's items have either a `word` (single term) or `phrase` (multi-word
 * expression with example sentence). Both shapes normalize to the same response
 * so the UI can render a single card layout.
 *
 * Pass a topic slug to get one set, omit it to list every set.
 */
export async function getPictureVocab({ topic } = {}) {
  const toResponse = (set) => ({
    topic: set.topic,
    lesson: set.lesson,
    slug: slugify(set),
    source: set.source,
    items: set.items.map((it) => {
      const r2_key = it.r2_key;
      const base = {
        word: it.word ?? it.phrase,
        meaning_vi: it.meaning_vi,
        level: it.level,
        image_url: `/api/vocab-image/${r2_key}`,
      };
      // Phrase sets carry an example sentence; vocab words carry word_form.
      if (it.phrase) {
        base.example_en = it.example_en ?? "";
        base.example_vi = it.example_vi ?? "";
        base.kind = "phrase";
      } else {
        base.word_form = it.word_form;
        base.kind = "word";
      }
      return base;
    }),
  });

  if (!topic) return { topics: PICTURE_VOCAB_TOPICS.map(toResponse) };

  const match = PICTURE_VOCAB_TOPICS.find((set) => slugify(set) === topic);
  return match ? toResponse(match) : null;
}

/** `community/city-streets/` -> `community-city-streets` */
function slugify(set) {
  return set.r2_key_prefix.replace(/\/$/, "").replace(/\//g, "-");
}
