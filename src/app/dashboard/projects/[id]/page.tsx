'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { IProject, ITask, IUser } from '@/types';
import { Plus, Users, ArrowLeft, UserMinus, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import TaskCard from '@/components/tasks/TaskCard';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { isPast } from 'date-fns';

type Status = 'todo' | 'in-progress' | 'done';
const COLUMNS: { key: Status; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<IProject | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchAll = async () => {
    const [projRes, tasksRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch(`/api/tasks?projectId=${id}`),
    ]);
    const projData = await projRes.json();
    const tasksData = await tasksRes.json();
    if (!projRes.ok) { router.push('/dashboard/projects'); return; }
    setProject(projData.data.project);
    setTasks(tasksData.data?.tasks ?? []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setAllUsers(data.data?.users ?? []);
  };

  useEffect(() => {
    fetchAll();
    if (user?.role === 'admin') fetchUsers();
  }, [id]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddingMember(true);
    await fetch(`/api/projects/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUserId }),
    });
    setSelectedUserId('');
    await fetchAll();
    setAddingMember(false);
  };

  const handleRemoveMember = async (userId: string) => {
    await fetch(`/api/projects/${id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    await fetchAll();
  };

  const handleStatusChange = async (taskId: string, status: Status) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  const memberIds = project?.members.map(m => typeof m === 'string' ? m : (m as IUser)._id) ?? [];
  const nonMembers = allUsers.filter(u => !memberIds.includes(u._id) && u._id !== (typeof project?.admin === 'string' ? project.admin : (project?.admin as IUser)?._id));

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading project...
    </div>
  );
  if (!project) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/dashboard/projects" className="mt-1 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowCreateTask(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>

      <div className="flex gap-6 flex-col xl:flex-row">
        {/* Kanban Board */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.key);
              return (
                <div key={col.key} className="bg-gray-50 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                    <span className="ml-auto w-5 h-5 bg-white rounded-full text-xs font-medium text-gray-500 flex items-center justify-center shadow-card">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {colTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        isAdmin={user?.role === 'admin'}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="text-xs text-gray-400 text-center py-6">No tasks</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Members Panel */}
        <div className="xl:w-64 flex-shrink-0">
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" /> Members ({project.members.length})
            </h3>

            {user?.role === 'admin' && nonMembers.length > 0 && (
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="input text-xs py-1.5 flex-1"
                >
                  <option value="">Add member...</option>
                  {nonMembers.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || addingMember}
                  className="btn-primary text-xs px-2.5 py-1.5"
                >
                  {addingMember ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {project.members.map(member => {
                const m = member as IUser;
                return (
                  <div key={m._id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 group">
                    <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-accent">{m.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{m.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{m.role}</div>
                    </div>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleRemoveMember(m._id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500">
                        <UserMinus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {project.members.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">No members yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          members={project.members as IUser[]}
          onClose={() => setShowCreateTask(false)}
          onCreate={task => { setTasks(prev => [task, ...prev]); setShowCreateTask(false); }}
        />
      )}
    </div>
  );
}
