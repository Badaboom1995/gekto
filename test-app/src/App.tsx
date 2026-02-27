import { useMemo, useState } from 'react'
import { TodoInput } from './components/TodoInput'
import TodoList from './components/TodoList'
import FolderSidebar from './components/FolderSidebar'
import { useTodos } from './hooks/useTodos'
import './App.css'

type SortKey = 'date-desc' | 'date-asc' | 'importance-desc' | 'importance-asc' | 'name-asc' | 'status'

const IMPORTANCE_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'importance-desc', label: 'Importance ↓' },
  { value: 'importance-asc', label: 'Importance ↑' },
  { value: 'name-asc', label: 'Name A→Z' },
  { value: 'status', label: 'Incomplete first' },
]

function App() {
  const { todos, folders, selectedFolder, addTodo, toggleTodo, deleteTodo, addFolder, deleteFolder, setSelectedFolder } = useTodos()
  const [sortBy, setSortBy] = useState<SortKey>('date-desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>())

  const filteredSortedTodos = useMemo(() => {
    let filtered = selectedFolder === null
      ? todos
      : todos.filter((todo) => todo.folderId === selectedFolder)

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((todo) => todo.text.toLowerCase().includes(query))
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return b.createdAt - a.createdAt
        case 'date-asc': return a.createdAt - b.createdAt
        case 'importance-desc': return (IMPORTANCE_RANK[a.importance] ?? 1) - (IMPORTANCE_RANK[b.importance] ?? 1)
        case 'importance-asc': return (IMPORTANCE_RANK[b.importance] ?? 1) - (IMPORTANCE_RANK[a.importance] ?? 1)
        case 'name-asc': return a.text.localeCompare(b.text)
        case 'status': return Number(a.completed) - Number(b.completed)
        default: return 0
      }
    })
  }, [todos, selectedFolder, sortBy, searchQuery])

  const handleAddTodo = (
    text: string,
    importance?: 'low' | 'medium' | 'high',
    assignee?: string,
    folderId?: string | null,
    dueAt?: number | null,
  ) => {
    // @ts-ignore - dueAt may not be in addTodo signature yet
    addTodo({ text, importance, assignee, folderId: folderId ?? undefined, dueAt })
  }

  const handleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => {
      deleteTodo(id)
    })
    setSelectedIds(new Set())
  }

  const handleMarkCompleteSelected = () => {
    selectedIds.forEach((id) => {
      const todo = todos.find((t) => t.id === id)
      if (todo && !todo.completed) {
        toggleTodo(id)
      }
    })
    setSelectedIds(new Set())
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <FolderSidebar
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          folders={folders}
          onAddFolder={addFolder}
          onDeleteFolder={deleteFolder}
        />
      </aside>
      <main className="app-main">
        <h1>Todo</h1>
        <TodoInput
          onAdd={handleAddTodo}
          folders={folders}
          selectedFolderId={selectedFolder}
        />
        <input
          type="text"
          placeholder="Search todos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: '12px',
            background: '#1f2937',
            color: '#e2e8f0',
            border: '1px solid #374151',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        {selectedIds.size > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            marginBottom: '12px',
            background: '#374151',
            borderRadius: '6px',
          }}>
            <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              style={{
                padding: '4px 12px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Delete selected
            </button>
            <button
              onClick={handleMarkCompleteSelected}
              style={{
                padding: '4px 12px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Mark complete
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <label htmlFor="sort-select" style={{ fontSize: '13px', color: '#9ca3af', flexShrink: 0 }}>
            Sort:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{
              background: '#1f2937',
              color: '#e2e8f0',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* @ts-ignore - selectedIds and onSelectId props will be wired up by another task */}
        <TodoList todos={filteredSortedTodos} onToggle={toggleTodo} onDelete={deleteTodo} selectedIds={selectedIds} onSelectId={handleSelectId} />
        {selectedFolder !== null && filteredSortedTodos.length === 0 && (
          <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '24px' }}>
            No todos in this folder
          </p>
        )}
      </main>
    </div>
  )
}

export default App
