import { Task } from '../types/Task';

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'TESTING',
    description: 'Test task for development purposes',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
];

export const getTaskById = (id: string): Task | undefined => {
  return tasks.find(task => task.id === id);
};

export const getTasksByStatus = (status: Task['status']): Task[] => {
  return tasks.filter(task => task.status === status);
};

export const getTasksByPriority = (priority: Task['priority']): Task[] => {
  return tasks.filter(task => task.priority === priority);
};
