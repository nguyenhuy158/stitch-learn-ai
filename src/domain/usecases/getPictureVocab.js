import { PICTURE_VOCAB_TOPICS } from "../../data/pictureVocab.js";

/**
 * Picture-dictionary vocab: static content bundled with the Worker (no D1, no AI call).
 * Pass a topic slug to get one set, omit it to list every topic.
 */
export async function getPictureVocab({ topic } = {}) {
  const toResponse = (set) => ({
    topic: set.topic,
    lesson: set.lesson,
    slug: slugify(set),
    source: set.source,
    items: set.items.map(({ word, meaning_vi, level, word_form, r2_key }) => ({
      word,
      meaning_vi,
      level,
      word_form,
      image_url: `/api/vocab-image/${r2_key}`
    }))
  });

  if (!topic) return { topics: PICTURE_VOCAB_TOPICS.map(toResponse) };

  const match = PICTURE_VOCAB_TOPICS.find((set) => slugify(set) === topic);
  return match ? toResponse(match) : null;
}

/** `community/city-streets/` -> `community-city-streets` */
function slugify(set) {
  return set.r2_key_prefix.replace(/\/$/, "").replace(/\//g, "-");
}
