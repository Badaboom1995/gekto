import TodoItem from './TodoItem';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  onSelectId: (id: string) => void;
}

function TodoList({ todos, onToggle, onDelete, selectedIds, onSelectId }: TodoListProps) {
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      {todos.length === 0 ? (
        <li
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#888',
            fontStyle: 'italic',
          }}
        >
          No todos yet.
        </li>
      ) : (
        todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            isSelected={selectedIds.has(todo.id)}
            onSelect={onSelectId}
          />
        ))
      )}
    </ul>
  );
}

export default TodoList;
