import { StatusGlyph } from "@/components/StatusGlyph"
import type { Task } from "@/types"

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function TaskRow({ task }: { task: Task }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{task.title}</p>
        {task.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusGlyph status={task.status} />
        <span className="text-[0.65rem] text-muted-foreground">{formatTime(task.created_at)}</span>
      </div>
    </li>
  )
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="border border-dashed border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">No tasks yet. Create one above.</p>
      </div>
    )
  }

  return (
    <ul>
      {tasks
        .slice()
        .sort((a, b) => b.id - a.id)
        .map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
    </ul>
  )
}
