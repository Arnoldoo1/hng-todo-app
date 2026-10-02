const API = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Something went wrong')
  }
  return res.status === 204 ? null : res.json()
}

const send = (method, body) => ({ method, body: JSON.stringify(body) })

export const getTasks = () => request('/api/tasks')
export const createTask = (title, priority) => request('/api/tasks', send('POST', { title, priority }))
export const updateTask = (id, updates) => request(`/api/tasks/${id}`, send('PUT', updates))
export const deleteTask = (id) => request(`/api/tasks/${id}`, { method: 'DELETE' })
export const createNote = (taskId, content) => request(`/api/tasks/${taskId}/notes`, send('POST', { content }))
export const updateNote = (id, content) => request(`/api/notes/${id}`, send('PUT', { content }))
export const deleteNote = (id) => request(`/api/notes/${id}`, { method: 'DELETE' })
export const reorderTasks = (ids) => request('/api/reorder', send('PUT', { ids }))
