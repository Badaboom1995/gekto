/**
 * Represents a folder for organizing todos.
 */
export interface Folder {
  /** Unique identifier for the folder */
  id: string;
  /** Display name of the folder */
  name: string;
}

/**
 * Represents a todo item.
 */
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  /**
   * Priority level of the todo.
   * @default 'medium' - Consumers should default to 'medium' when creating new todos.
   */
  importance: 'low' | 'medium' | 'high';
  /** Optional assignee for the todo (free-text) */
  assignee?: string;
  /**
   * ID of the folder this todo belongs to.
   * Use `null` to explicitly indicate "no folder".
   */
  folderId?: string | null;
  /**
   * Due date as Unix timestamp in milliseconds.
   * Use `null` to indicate no due date.
   */
  dueAt: number | null;
}
