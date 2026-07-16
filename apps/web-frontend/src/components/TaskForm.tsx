import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, createTask } from "@/lib/api"
import type { Task } from "@/types"

export function TaskForm({ onCreated }: { onCreated: (task: Task) => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setSubmitting(true)

    try {
      const task = await createTask({ title, description })
      onCreated(task)
      setTitle("")
      setDescription("")
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors)
      } else {
        setErrors({ title: ["Could not reach the task service."] })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex items-baseline justify-between">
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          New task
        </span>
        <span className="text-xs text-muted-foreground">POST /api/tasks</span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Send weekly digest"
          aria-invalid={Boolean(errors.title)}
          required
        />
        {errors.title?.map((msg) => (
          <p key={msg} className="text-xs text-destructive">
            {msg}
          </p>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs to happen, in plain terms"
          rows={3}
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description?.map((msg) => (
          <p key={msg} className="text-xs text-destructive">
            {msg}
          </p>
        ))}
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Creating..." : "Create task"}
      </Button>
    </form>
  )
}
