import { useEffect, useState } from "react";
import { api, isUnauthorized } from "../lib/api";
import { cleanIpaToken, lookupIpa } from "../lib/ipa";
import { SpeakButton } from "./SpeakButton";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { StarIcon } from "./icons";
import { useLanguage } from "../i18n/LanguageProvider";

type WordInfo = {
  term: string;
  type: string;
  meaning: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
};

/**
 * Cau tieng Anh doc duoc ca cau, va bam vao tung tu de xem nghia / IPA /
 * dong nghia - trai nghia roi luu tu do vao bo suu tap.
 */
export function ClickableSentence({ text, bare = false }: { text: string; bare?: boolean }) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<string | null>(null);
  const [info, setInfo] = useState<WordInfo | null>(null);
  const [ipa, setIpa] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!picked) return;
    let stale = false;
    setInfo(null);
    setIpa(null);
    setError("");
    setSaved(false);
    lookupIpa(picked).then((res) => !stale && setIpa(res)).catch(() => {});
    api
      .lookupWord(picked, text)
      .then((res: WordInfo) => !stale && setInfo(res))
      .catch((err) => !stale && setError(isUnauthorized(err) ? t("common.error") : err.message));
    return () => {
      stale = true;
    };
  }, [picked, text, t]);

  async function save() {
    if (!info) return;
    setSaving(true);
    try {
      await api.saveLookedUpWord({ term: info.term, type: info.type, meaning: info.meaning, example: info.example });
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const sentence = (
    <>
      <p className="flex-1 text-sm leading-relaxed">
        {text.split(/(\s+)/).map((token, i) =>
          cleanIpaToken(token) ? (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(cleanIpaToken(token))}
              className="rounded px-0.5 underline decoration-dotted underline-offset-4 outline-none transition hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring"
            >
              {token}
            </button>
          ) : (
            <span key={i}>{token}</span>
          )
        )}
      </p>
      <SpeakButton text={text} size="sm" />
    </>
  );

  return (
    <>
      {bare ? (
        <div className="flex items-start gap-2">{sentence}</div>
      ) : (
        <Card className="flex items-start gap-3 p-4">{sentence}</Card>
      )}

      {picked && (
        <Card className="mt-2 p-4">
          <div className="flex items-center gap-2">
            <SpeakButton text={info?.term ?? picked} size="sm" />
            <div className="flex-1">
              <span className="text-base font-bold text-primary-hover">{info?.term ?? picked}</span>
              {info?.type && <span className="ml-2 text-xs italic text-fg-muted">{info.type}</span>}
              {ipa && <span className="ml-2 text-xs text-fg-muted">/{ipa}/</span>}
            </div>
          </div>

          {error && <div className="mt-2 text-sm text-danger">{error}</div>}
          {!info && !error && <div className="mt-2 text-sm text-fg-muted">{t("word.loading")}</div>}

          {info && (
            <>
              <div className="mt-2 text-sm">{info.meaning}</div>
              {info.example && <div className="mt-0.5 text-xs italic text-fg-muted">"{info.example}"</div>}
              {info.synonyms.length > 0 && (
                <div className="mt-2 text-xs text-fg-muted">
                  <span className="font-semibold uppercase">{t("word.synonyms")}</span> {info.synonyms.join(", ")}
                </div>
              )}
              {info.antonyms.length > 0 && (
                <div className="mt-0.5 text-xs text-fg-muted">
                  <span className="font-semibold uppercase">{t("word.antonyms")}</span> {info.antonyms.join(", ")}
                </div>
              )}
              <Button
                className="mt-3"
                variant="outline"
                onClick={save}
                loading={saving}
                disabled={saving || saved}
                leftIcon={<StarIcon size={14} fill={saved ? "currentColor" : "none"} />}
              >
                {saved ? t("word.saved") : t("word.save")}
              </Button>
            </>
          )}
        </Card>
      )}
    </>
  );
}
