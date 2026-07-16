import { useEffect, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { TaskForm } from "@/components/TaskForm"
import { TaskList } from "@/components/TaskList"
import { listTasks } from "@/lib/api"
import type { Task } from "@/types"

const POLL_INTERVAL_MS = 3000

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const data = await listTasks()
        if (!cancelled) {
          setTasks(data)
          setLoadError(false)
        }
      } catch {
        if (!cancelled) setLoadError(true)
      }
    }

    refresh()
    const id = setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <header className="mb-8 flex items-baseline justify-between">
        <h1 className="text-sm font-medium tracking-widest uppercase">Task console</h1>
        <span className="text-xs text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </span>
      </header>

      <Card className="mb-6 rounded-sm">
        <CardContent>
          <TaskForm onCreated={(task) => setTasks((prev) => [task, ...prev])} />
        </CardContent>
      </Card>

      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs tracking-widest text-muted-foreground uppercase">Log</span>
        {loadError && <span className="text-xs text-destructive">Connection lost, retrying...</span>}
      </div>

      <TaskList tasks={tasks} />
    </div>
  )
}

export default App
