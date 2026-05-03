'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { ITask, IProject } from '@/types';
import { CheckCircle2, Clock, AlertCircle, ListTodo, FolderKanban, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { format, isPast } from 'date-fns';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function statusBadge(task: ITask) {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  if (overdue) return <span className="badge-overdue">Overdue</span>;
  if (task.status === 'done') return <span className="badge-done">Done</span>;
  if (task.status === 'in-progress') return <span className="badge-in-progress">In Progress</span>;
  return <span className="badge-todo">Todo</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([tasksData, projectsData]) => {
      setTasks(tasksData.data?.tasks ?? []);
      setProjects(projectsData.data?.projects ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pending = tasks.filter(t => t.status !== 'done').length;
  const overdue = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done').length;

  const recentTasks = tasks.slice(0, 6);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s your workspace overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Tasks" value={total} icon={ListTodo} color="bg-gray-100 text-gray-600" />
        <StatCard label="Completed" value={done} icon={CheckCircle2} color="bg-emerald-50 text-emerald-500" />
        <StatCard label="Pending" value={pending} icon={Clock} color="bg-blue-50 text-blue-500" />
        <StatCard label="Overdue" value={overdue} icon={AlertCircle} color="bg-red-50 text-red-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Recent Tasks
            </h2>
            <Link href="/dashboard/tasks" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No tasks yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentTasks.map(task => (
                  <div key={task._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{task.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {typeof task.projectId === 'object' && 'name' in task.projectId ? (task.projectId as IProject).name : 'Project'}
                        {task.dueDate && ` · Due ${format(new Date(task.dueDate), 'MMM d')}`}
                      </div>
                    </div>
                    {statusBadge(task)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-accent" /> Projects
            </h2>
            <Link href="/dashboard/projects" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          <div className="space-y-2.5">
            {loading ? (
              <div className="card p-6 text-center text-gray-400 text-sm">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="card p-6 text-center text-gray-400 text-sm">No projects yet</div>
            ) : (
              projects.slice(0, 5).map(project => (
                <Link key={project._id} href={`/dashboard/projects/${project._id}`} className="card p-4 block hover:border-accent/30 hover:shadow-soft transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{project.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {Array.isArray(project.members) ? project.members.length : 0} member{project.members.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
