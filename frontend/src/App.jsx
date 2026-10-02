import { useEffect, useState } from 'react'
import './App.css'
import * as api from './api'
import TaskItem from './TaskItem'

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  async function loadTasks() {
    try {
      setTasks(await api.getTasks())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function run(action) {
    try {
      await action()
      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!title.trim()) return setFormError('Please enter a task title.')
    if (title.trim().length > 100) return setFormError('Title must be 100 characters or less.')
    setFormError('')
    run(async () => {
      await api.createTask(title.trim(), priority)
      setTitle('')
    })
  }

  // Swap a task with its neighbour, show it instantly, then save the order
  function moveTask(index, direction) {
    const target = index + direction
    if (target < 0 || target >= tasks.length) return
    const next = [...tasks]
    ;[next[index], next[target]] = [next[target], next[index]]
    setTasks(next)
    api.reorderTasks(next.map((t) => t.id)).catch((err) => {
      setError(err.message)
      loadTasks()
    })
  }

  // Moving only makes sense when the whole list is visible
  const canMove = status === 'all' && priorityFilter === 'all' && !search.trim()

  const visible = tasks.filter((t) => {
    const matchStatus =
      status === 'all' || (status === 'active' ? !t.completed : t.completed)
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
    const matchSearch = t.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchStatus && matchPriority && matchSearch
  })

  const doneCount = tasks.filter((t) => t.completed).length

  return (
    <div className="app">
      <header className="app-header">
        <h1>My To-Do List</h1>
        <p>
          {tasks.length === 0
            ? 'Stay organized and get things done.'
            : `${doneCount} of ${tasks.length} tasks completed`}
        </p>
      </header>

      {error && (
        <div className="banner error" role="alert">
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss">✕</button>
        </div>
      )}

      <form className="card add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="btn primary">Add task</button>
        {formError && <p className="field-error">{formError}</p>}
      </form>

      <div className="card toolbar">
        <input
          type="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="tabs">
          {['all', 'active', 'completed'].map((s) => (
            <button
              key={s}
              className={status === s ? 'tab active' : 'tab'}
              onClick={() => setStatus(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <p className="empty">Loading tasks...</p>
      ) : visible.length === 0 ? (
        <p className="empty">
          {tasks.length === 0
            ? 'No tasks yet. Add your first one above!'
            : 'No tasks match your search or filters.'}
        </p>
      ) : (
        <ul className="task-list">
          {visible.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              canMove={canMove}
              isFirst={index === 0}
              isLast={index === visible.length - 1}
              onMoveUp={() => moveTask(index, -1)}
              onMoveDown={() => moveTask(index, 1)}
              onUpdate={(u) => run(() => api.updateTask(task.id, u))}
              onDelete={() => run(() => api.deleteTask(task.id))}
              onAddNote={(c) => run(() => api.createNote(task.id, c))}
              onUpdateNote={(id, c) => run(() => api.updateNote(id, c))}
              onDeleteNote={(id) => run(() => api.deleteNote(id))}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
