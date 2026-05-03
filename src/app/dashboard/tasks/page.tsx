'use client';
import { useEffect, useState } from 'react';
import { ITask } from '@/types';
import { CheckSquare, Loader2 } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import { useAuth } from '@/components/providers/AuthProvider';

type Filter = 'all' | 'todo' | 'in-progress' | 'done';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data.data?.tasks ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleStatusChange = async (taskId: string, status: 'todo' | 'in-progress' | 'done') => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
  };

  const handleDelete = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${tasks.length})` },
    { key: 'todo', label: `Todo (${tasks.filter(t => t.status === 'todo').length})` },
    { key: 'in-progress', label: `In Progress (${tasks.filter(t => t.status === 'in-progress').length})` },
    { key: 'done', label: `Done (${tasks.filter(t => t.status === 'done').length})` },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <CheckSquare className="w-6 h-6 text-accent" /> My Tasks
        </h1>
        <p className="text-sm text-gray-500 mt-1">All tasks assigned to you across projects</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
              filter === f.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-1">No tasks found</h3>
          <p className="text-sm text-gray-400">
            {filter !== 'all' ? 'Try a different filter.' : 'No tasks assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              isAdmin={user?.role === 'admin'}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              showProject
            />
          ))}
        </div>
      )}
    </div>
  );
}
