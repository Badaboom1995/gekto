import { useState } from 'react';

type Importance = 'low' | 'medium' | 'high';

interface TodoInputProps {
  onAdd: (text: string, importance: Importance, assignee: string, folderId: string | null, dueAt?: number | null) => void;
  folders: Array<{ id: string; name: string }>;
  selectedFolderId?: string | null;
}

const importanceColors: Record<Importance, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f87171',
};

export function TodoInput({ onAdd, folders, selectedFolderId }: TodoInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [importance, setImportance] = useState<Importance>('medium');
  const [assignee, setAssignee] = useState<string>('');
  const [folderId, setFolderId] = useState<string>(selectedFolderId ?? '');
  const [dueAt, setDueAt] = useState<number | null>(null);
  const [dueAtInputValue, setDueAtInputValue] = useState<string>('');

  const handleDueDateChange = (value: string) => {
    setDueAtInputValue(value);
    if (!value) {
      setDueAt(null);
      return;
    }
    const timestamp = new Date(value).getTime();
    if (isNaN(timestamp)) {
      setDueAt(null);
    } else {
      setDueAt(timestamp);
    }
  };

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onAdd(trimmed, importance, assignee.trim(), folderId || null, dueAt);
      setInputValue('');
      setAssignee('');
      setImportance('medium');
      setFolderId(selectedFolderId ?? '');
      setDueAt(null);
      setDueAtInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const fieldStyle: React.CSSProperties = {
    background: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '6px 10px',
  };

  const importanceSelectStyle: React.CSSProperties = {
    ...fieldStyle,
    borderLeftWidth: '4px',
    borderLeftColor: importanceColors[importance],
  };

  return (
    <div className="todo-input-wrapper">
      <input
        type="text"
        className="todo-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a new todo..."
      />
      <button className="todo-add-button" onClick={handleSubmit}>
        Add
      </button>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}>
        <select
          value={importance}
          onChange={(e) => setImportance(e.target.value as Importance)}
          style={importanceSelectStyle}
        >
          <option value="low" style={{ color: importanceColors.low }}>Low</option>
          <option value="medium" style={{ color: importanceColors.medium }}>Medium</option>
          <option value="high" style={{ color: importanceColors.high }}>High</option>
        </select>
        <input
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Assignee (optional)"
          style={{ ...fieldStyle, flex: 1 }}
        />
        <select
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          style={fieldStyle}
        >
          <option value="">No Folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueAtInputValue}
          onChange={(e) => handleDueDateChange(e.target.value)}
          style={fieldStyle}
        />
      </div>
    </div>
  );
}
