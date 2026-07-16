export type TaskStatus = "pending" | "dispatched" | "delivery_failed"

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  created_at: string
}

export interface CreateTaskInput {
  title: string
  description: string
}
