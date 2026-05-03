'use client';
import { ITask, IUser, IProject } from '@/types';
import { format, isPast } from 'date-fns';
import { Calendar, User, Trash2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

type Status = 'todo' | 'in-progress' | 'done';

interface Props {
  task: ITask;
  isAdmin: boolean;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  showProject?: boolean;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

function StatusBadge({ status, overdue }: { status: Status; overdue: boolean }) {
  if (overdue) return <span className="badge-overdue">Overdue</span>;
  if (status === 'done') return <span className="badge-done">Done</span>;
  if (status === 'in-progress') return <span className="badge-in-progress">In Progress</span>;
  return <span className="badge-todo">Todo</span>;
}

export default function TaskCard({ task, isAdmin, onStatusChange, onDelete, showProject }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const assignee = task.assignedTo as IUser | null;
  const project = task.projectId as IProject;
  const overdue = !!task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    onDelete(task._id);
  };

  return (
    <div className={clsx('card p-4 hover:shadow-soft transition-all', overdue && 'border-red-100')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-gray-900">{task.title}</span>
            <StatusBadge status={task.status} overdue={overdue} />
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {showProject && typeof task.projectId === 'object' && (
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{project.name}</span>
            )}
            {task.dueDate && (
              <span className={clsx('flex items-center gap-1 text-xs', overdue ? 'text-red-500' : 'text-gray-400')}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}
            {assignee && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <User className="w-3 h-3" /> {assignee.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Status change dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
            >
              Change <ChevronDown className="w-3 h-3" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-soft z-20 py-1 min-w-[130px]">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { onStatusChange(task._id, opt.value); setShowMenu(false); }}
                      className={clsx(
                        'w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors',
                        task.status === opt.value ? 'font-medium text-accent' : 'text-gray-700'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
