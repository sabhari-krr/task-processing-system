import type { TaskStatus } from "@/types"

const LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  dispatched: "Dispatched",
  delivery_failed: "Delivery failed",
}

export function StatusGlyph({ status }: { status: TaskStatus }) {
  return (
    <span className="inline-flex items-center gap-2" title={LABELS[status]}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {status === "pending" && (
          <circle
            cx="8"
            cy="8"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
            className="origin-center motion-safe:animate-[glyph-pulse_1.6s_ease-in-out_infinite]"
          />
        )}
        {status === "dispatched" && <rect x="3.5" y="3.5" width="9" height="9" rx="1" fill="currentColor" />}
        {status === "delivery_failed" && (
          <>
            <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="4.7" y1="11.3" x2="11.3" y2="4.7" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
      </svg>
      <span className="sr-only">{LABELS[status]}</span>
      <span aria-hidden="true" className="text-xs tracking-wide text-muted-foreground uppercase">
        {status}
      </span>
    </span>
  )
}
