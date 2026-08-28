import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";

export type DifficultyOption = { key: string; label: string; desc: string };

/**
 * The "pick a difficulty" list every game opens with. Shared so the focus ring,
 * press feedback and hit area stay identical across games.
 */
export function DifficultyPicker<T extends DifficultyOption>({
  options,
  selected,
  loading = false,
  onPick,
}: {
  options: T[];
  /** Key of the option already chosen (its card is disabled while loading). */
  selected?: string | null;
  loading?: boolean;
  onPick: (option: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onPick(o)}
          disabled={selected === o.key}
          className="rounded-ui text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] disabled:opacity-60"
        >
          <Card className="p-4">
            <div className="text-lg font-bold text-primary-hover">{o.label}</div>
            <div className="mt-0.5 text-sm text-fg-muted">{o.desc}</div>
          </Card>
        </button>
      ))}
      {loading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
    </div>
  );
}
