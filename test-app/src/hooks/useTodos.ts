import { useState, useEffect } from 'react';
import { Todo } from '../types/todo';

/** Inline Folder type for folder management */
type Folder = { id: string; name: string };

const STORAGE_KEY = 'todos';
const FOLDERS_STORAGE_KEY = 'todo-folders';

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'work', name: 'Work' },
  { id: 'personal', name: 'Personal' },
  { id: 'shopping', name: 'Shopping' },
];

const DEFAULT_TODOS: Todo[] = [
  {
    id: 'default-1',
    text: 'Review pull requests',
    completed: false,
    createdAt: Date.now() - 5000,
    importance: 'high',
    assignee: 'Alex',
    folderId: 'work',
    dueAt: null,
  },
  {
    id: 'default-2',
    text: 'Update project README',
    completed: true,
    createdAt: Date.now() - 10000,
    importance: 'low',
    assignee: '',
    folderId: 'work',
    dueAt: null,
  },
  {
    id: 'default-3',
    text: 'Buy groceries',
    completed: false,
    createdAt: Date.now() - 15000,
    importance: 'medium',
    assignee: '',
    folderId: 'shopping',
    dueAt: null,
  },
  {
    id: 'default-4',
    text: 'Call the dentist',
    completed: false,
    createdAt: Date.now() - 20000,
    importance: 'high',
    assignee: '',
    folderId: 'personal',
    dueAt: null,
  },
  {
    id: 'default-5',
    text: 'Read a book',
    completed: false,
    createdAt: Date.now() - 25000,
    importance: 'low',
    assignee: '',
    folderId: 'personal',
    dueAt: null,
  },
];

function loadTodos(): Todo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Malformed JSON or other error - fall through to default
  }
  return DEFAULT_TODOS;
}

function loadFolders(): Folder[] {
  try {
    const stored = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Malformed JSON or other error - fall through to default
  }
  return DEFAULT_FOLDERS;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [folders, setFolders] = useState<Folder[]>(() => loadFolders());
  const [selectedFolder, setSelectedFolderState] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  const addTodo = ({
    text,
    importance,
    assignee,
    folderId,
    dueAt,
  }: {
    text: string;
    importance?: 'low' | 'medium' | 'high';
    assignee?: string;
    folderId?: string;
    dueAt?: number | null;
  }): void => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
      importance: importance ?? 'medium',
      assignee: assignee ?? '',
      folderId: folderId ?? null,
      dueAt: dueAt ?? null,
    };

    setTodos((prev) => [newTodo, ...prev]);
  };

  const toggleTodo = (id: string): void => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string): void => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const addFolder = (name: string): void => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: trimmed,
    };

    setFolders((prev) => [...prev, newFolder]);
  };

  const deleteFolder = (folderId: string): void => {
    // Remove the folder
    setFolders((prev) => prev.filter((folder) => folder.id !== folderId));

    // Clear folderId from any todos that reference this folder
    setTodos((prev) =>
      prev.map((todo) =>
        todo.folderId === folderId ? { ...todo, folderId: null } : todo
      )
    );
  };

  const setSelectedFolder = (folderId: string | null): void => {
    setSelectedFolderState(folderId);
  };

  return {
    todos,
    folders,
    selectedFolder,
    addTodo,
    toggleTodo,
    deleteTodo,
    addFolder,
    deleteFolder,
    setSelectedFolder,
  };
}
