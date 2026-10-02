import { useState } from 'react'

function TaskItem({
  task, canMove, isFirst, isLast, onMoveUp, onMoveDown,
  onUpdate, onDelete, onAddNote, onUpdateNote, onDeleteNote,
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState(task.priority)
  const [editError, setEditError] = useState('')

  const [showNotes, setShowNotes] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [noteText, setNoteText] = useState('')

  const notes = [...(task.notes || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )

  async function saveEdit() {
    if (!title.trim()) return setEditError('Title cannot be empty.')
    if (title.trim().length > 100) return setEditError('Max 100 characters.')
    setEditError('')
    await onUpdate({ title: title.trim(), priority })
    setEditing(false)
  }

  function cancelEdit() {
    setTitle(task.title)
    setPriority(task.priority)
    setEditError('')
    setEditing(false)
  }

  function handleDelete() {
    if (window.confirm('Delete this task and its notes?')) onDelete()
  }

  function addNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return
    onAddNote(newNote.trim())
    setNewNote('')
  }

  async function saveNote(id) {
    if (!noteText.trim()) return
    await onUpdateNote(id, noteText.trim())
    setEditingNoteId(null)
  }

  return (
    <li className={`card task ${task.completed ? 'done' : ''}`}>
      <div className="task-main">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onUpdate({ completed: !task.completed })}
          aria-label="Mark complete"
        />

        {editing ? (
          <div className="edit-box">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button className="btn primary" onClick={saveEdit}>Save</button>
            <button className="btn" onClick={cancelEdit}>Cancel</button>
            {editError && <p className="field-error">{editError}</p>}
          </div>
        ) : (
          <>
            <span className="task-title">{task.title}</span>
            <span className={`badge ${task.priority}`}>{task.priority}</span>
          </>
        )}
      </div>

      {!editing && (
        <div className="task-actions">
          {canMove && (
            <>
              <button className="btn small" onClick={onMoveUp} disabled={isFirst} aria-label="Move up" title="Move up">↑</button>
              <button className="btn small" onClick={onMoveDown} disabled={isLast} aria-label="Move down" title="Move down">↓</button>
            </>
          )}
          <button className="btn small" onClick={() => setShowNotes(!showNotes)}>
            Notes ({notes.length})
          </button>
          <button className="btn small" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn small danger" onClick={handleDelete}>Delete</button>
        </div>
      )}

      {showNotes && (
        <div className="notes">
          {notes.length === 0 && <p className="muted">No notes yet.</p>}
          {notes.map((n) => (
            <div key={n.id} className="note">
              {editingNoteId === n.id ? (
                <>
                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                  <button className="btn small primary" onClick={() => saveNote(n.id)}>Save</button>
                  <button className="btn small" onClick={() => setEditingNoteId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <p>{n.content}</p>
                  <div>
                    <button
                      className="btn small"
                      onClick={() => { setEditingNoteId(n.id); setNoteText(n.content) }}
                    >
                      Edit
                    </button>
                    <button className="btn small danger" onClick={() => onDeleteNote(n.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          <form className="note-form" onSubmit={addNote}>
            <input
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button className="btn small primary" type="submit">Add</button>
          </form>
        </div>
      )}
    </li>
  )
}

export default TaskItem
