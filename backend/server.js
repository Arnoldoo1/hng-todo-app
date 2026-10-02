require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const PRIORITIES = ['low', 'medium', 'high']

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Server error' })
  }
}

app.get('/', (req, res) => res.json({ message: 'To-Do API is running' }))

// ---------- TASKS ----------
app.get('/api/tasks', handle(async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, notes(*)')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  res.json(data)
}))

app.post('/api/tasks', handle(async (req, res) => {
  const title = (req.body.title || '').trim()
  const priority = req.body.priority || 'medium'
  if (!title) return res.status(400).json({ error: 'Title is required' })
  if (title.length > 100) return res.status(400).json({ error: 'Title is too long (max 100)' })
  if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority' })

  // New tasks go to the top of the list
  const { data: first } = await supabase
    .from('tasks').select('position').order('position', { ascending: true }).limit(1)
  const position = first && first.length ? first[0].position - 1 : 0

  const { data, error } = await supabase
    .from('tasks').insert({ title, priority, position }).select().single()
  if (error) throw error
  res.status(201).json(data)
}))

// Saves a new order: receives a list of task ids in the order they should appear
app.put('/api/reorder', handle(async (req, res) => {
  const ids = req.body.ids
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be a list' })
  const results = await Promise.all(
    ids.map((id, i) => supabase.from('tasks').update({ position: i }).eq('id', id))
  )
  const failed = results.find((r) => r.error)
  if (failed) throw failed.error
  res.json({ ok: true })
}))

app.put('/api/tasks/:id', handle(async (req, res) => {
  const updates = {}
  if (req.body.title !== undefined) {
    const title = req.body.title.trim()
    if (!title) return res.status(400).json({ error: 'Title is required' })
    if (title.length > 100) return res.status(400).json({ error: 'Title is too long (max 100)' })
    updates.title = title
  }
  if (req.body.priority !== undefined) {
    if (!PRIORITIES.includes(req.body.priority)) return res.status(400).json({ error: 'Invalid priority' })
    updates.priority = req.body.priority
  }
  if (req.body.completed !== undefined) updates.completed = !!req.body.completed

  const { data, error } = await supabase
    .from('tasks').update(updates).eq('id', req.params.id).select().single()
  if (error) throw error
  res.json(data)
}))

app.delete('/api/tasks/:id', handle(async (req, res) => {
  const { error } = await supabase.from('tasks').delete().eq('id', req.params.id)
  if (error) throw error
  res.status(204).end()
}))

// ---------- NOTES ----------
app.post('/api/tasks/:id/notes', handle(async (req, res) => {
  const content = (req.body.content || '').trim()
  if (!content) return res.status(400).json({ error: 'Note cannot be empty' })

  const { data, error } = await supabase
    .from('notes').insert({ task_id: req.params.id, content }).select().single()
  if (error) throw error
  res.status(201).json(data)
}))

app.put('/api/notes/:id', handle(async (req, res) => {
  const content = (req.body.content || '').trim()
  if (!content) return res.status(400).json({ error: 'Note cannot be empty' })

  const { data, error } = await supabase
    .from('notes').update({ content }).eq('id', req.params.id).select().single()
  if (error) throw error
  res.json(data)
}))

app.delete('/api/notes/:id', handle(async (req, res) => {
  const { error } = await supabase.from('notes').delete().eq('id', req.params.id)
  if (error) throw error
  res.status(204).end()
}))

if (require.main === module) {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
}

module.exports = app
