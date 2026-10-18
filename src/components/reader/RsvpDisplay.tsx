import { splitOrp } from "@/lib/rsvp";

export function RsvpDisplay({ words }: { words: string[] }) {
  const mid = Math.floor((words.length - 1) / 2);
  const focus = words[mid] ?? "";
  const { left, anchor, right } = splitOrp(focus);
  const before = words.slice(0, mid).join(" ");
  const after = words.slice(mid + 1).join(" ");
  return (
    <div className="relative mx-auto w-full max-w-3xl rounded-2xl border bg-card px-4 py-14">
      <div className="absolute inset-x-6 top-6 h-px bg-border" />
      <div className="absolute left-1/2 top-6 h-4 w-0.5 -translate-x-1/2 bg-primary" />
      <div className="absolute inset-x-6 bottom-6 h-px bg-border" />
      <div className="absolute bottom-6 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-primary" />
      <div className="flex items-baseline font-reader text-4xl leading-none sm:text-6xl">
        <span className="flex-1 whitespace-pre text-right">
          {before && <span className="text-muted-foreground">{before} </span>}
          {left}
        </span>
        <span className="orp">{anchor}</span>
        <span className="flex-1 whitespace-pre text-left">
          {right}
          {after && <span className="text-muted-foreground"> {after}</span>}
        </span>
      </div>
    </div>
  );
}
