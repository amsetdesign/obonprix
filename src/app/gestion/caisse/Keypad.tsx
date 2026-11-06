"use client";

/** Pavé numérique tactile */
export default function Keypad({ value, onChange, decimal }: { value: string; onChange: (v: string) => void; decimal?: boolean }) {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", decimal ? "," : "00", "0", "⌫"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            if (k === "⌫") onChange(value.slice(0, -1));
            else if (k === "," && value.includes(",")) return;
            else onChange((value === "0" && k !== "," ? "" : value) + k);
          }}
          className="h-16 rounded-xl bg-cream text-2xl font-bold tabular active:bg-line"
          aria-label={k === "⌫" ? "Effacer" : k}
        >
          {k}
        </button>
      ))}
    </div>
  );
}
