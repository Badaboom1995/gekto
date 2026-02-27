interface Todo {
  id: string;
  text: string;
  completed: boolean;
  importance?: 'low' | 'medium' | 'high';
  assignee?: string;
  folderId?: string;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  folderName?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  dueAt?: number | null;
}

const IMPORTANCE_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f87171',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function TodoItem({ todo, onToggle, onDelete, folderName, isSelected, onSelect, dueAt }: TodoItemProps) {
  const importance = todo.importance ?? 'medium';
  const hasAssignee = todo.assignee && todo.assignee.trim() !== '';
  const hasFolder = folderName && folderName.trim() !== '';
  const dimOpacity = todo.completed ? 0.5 : 1;

  // Due date logic
  const hasDueDate = typeof dueAt === 'number';
  const isOverdue = hasDueDate && !todo.completed && Date.now() > dueAt;
  const formattedDueDate = hasDueDate ? new Date(dueAt).toISOString().slice(0, 10) : null;

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '8px 0',
        borderBottom: '1px solid #334155',
      }}
    >
      <input
        type="checkbox"
        className="select-checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelect(todo.id);
        }}
        aria-label={`Select "${todo.text}"`}
        style={{
          cursor: 'pointer',
          marginTop: '4px',
          accentColor: '#3b82f6',
        }}
      />
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        style={{ cursor: 'pointer', marginTop: '4px' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Importance badge */}
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: IMPORTANCE_COLORS[importance],
              flexShrink: 0,
              opacity: dimOpacity,
            }}
            title={`Importance: ${importance}`}
            aria-label={`Importance: ${importance}`}
          />
          <span
            style={{
              textDecoration: todo.completed ? 'line-through' : 'none',
              color: todo.completed ? '#64748b' : '#e2e8f0',
              wordBreak: 'break-word',
            }}
          >
            {todo.text}
          </span>
        </div>
        {/* Metadata row */}
        {(hasAssignee || hasFolder || hasDueDate) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px',
              flexWrap: 'wrap',
            }}
          >
            {hasDueDate && (
              <span
                className={isOverdue ? 'overdue' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isOverdue ? '#ef4444' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: isOverdue ? 600 : 400,
                  opacity: dimOpacity,
                }}
              >
                <span aria-hidden="true">📅</span>
                {formattedDueDate}
              </span>
            )}
            {hasAssignee && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#334155',
                  color: '#94a3b8',
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  opacity: dimOpacity,
                }}
                title={todo.assignee}
              >
                {getInitials(todo.assignee!)}
              </span>
            )}
            {hasFolder && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  opacity: dimOpacity,
                }}
              >
                <span aria-hidden="true">📁</span>
                {folderName}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(todo.id)}
        aria-label="Delete todo"
        style={{
          padding: '4px 8px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Delete
      </button>
    </li>
  );
}

export default TodoItem;
