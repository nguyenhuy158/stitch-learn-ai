/** Reads picture-dictionary illustrations out of the R2 bucket bound as VOCAB_IMAGES. */
export function createR2VocabImageStore(bucket) {
  return {
    async get(key) {
      if (!bucket) return null;
      const object = await bucket.get(key);
      if (!object) return null;
      return { body: object.body, httpEtag: object.httpEtag, contentType: object.httpMetadata?.contentType };
    }
  };
}
