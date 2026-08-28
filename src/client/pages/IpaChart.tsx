import ipaChartData from "../../data/ipa-chart.json";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { useLanguage } from "../i18n/LanguageProvider";
import { SpeakButton } from "../components/SpeakButton";

type Sound = { symbol: string; type?: string; example: string; meaning_vi?: string };

function SoundGrid({ sounds, speakLabel }: { sounds: Sound[]; speakLabel: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sounds.map((sound) => (
        <Card key={`${sound.symbol}-${sound.example}`} className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-primary-hover">/{sound.symbol}/</div>
            <div className="mt-1 truncate text-sm font-semibold text-fg">{sound.example}</div>
            {sound.meaning_vi && <div className="truncate text-xs text-fg-muted">{sound.meaning_vi}</div>}
          </div>
          <SpeakButton text={sound.example} size="sm" label={speakLabel} className="rounded-ui" />
        </Card>
      ))}
    </div>
  );
}

export default function IpaChart() {
  const { t } = useLanguage();
  const speakLabel = t("audio.speak");
  const vowels = (ipaChartData.vowels as Sound[]) || [];
  const consonants = (ipaChartData.consonants as Sound[]) || [];
  const monophthongs = vowels.filter((v) => v.type !== "diphthong");
  const diphthongs = vowels.filter((v) => v.type === "diphthong");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backTo="/" title={t("ipaChart.title")} subtitle={t("ipaChart.subtitle")} />
      <main className="p-5 sm:p-9">
        <h2 className="mb-3 text-base font-bold">{t("ipaChart.vowels")}</h2>
        <h3 className="mb-2 text-xs font-semibold uppercase text-fg-muted">{t("ipaChart.monophthongs")}</h3>
        <div className="mb-4">
          <SoundGrid sounds={monophthongs} speakLabel={speakLabel} />
        </div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-fg-muted">{t("ipaChart.diphthongs")}</h3>
        <div className="mb-7">
          <SoundGrid sounds={diphthongs} speakLabel={speakLabel} />
        </div>

        <h2 className="mb-3 text-base font-bold">{t("ipaChart.consonants")}</h2>
        <SoundGrid sounds={consonants} speakLabel={speakLabel} />
      </main>
    </div>
  );
}
