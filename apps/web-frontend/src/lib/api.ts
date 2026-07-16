import type { CreateTaskInput, Task } from "@/types"

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8010/api"

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, body.message ?? "Request failed", body.errors)
  }

  return body.data as T
}

export function listTasks(): Promise<Task[]> {
  return fetch(`${BASE_URL}/tasks`).then((res) => parseResponse<Task[]>(res))
}

export function getTask(id: number): Promise<Task> {
  return fetch(`${BASE_URL}/tasks/${id}`).then((res) => parseResponse<Task>(res))
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((res) => parseResponse<Task>(res))
}
