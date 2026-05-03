'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { IProject } from '@/types';
import { Plus, FolderKanban, Users, Loader2, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    if (data.success) setProjects(data.data.projects);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    setDeletingId(id);
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(p => p.filter(pr => pr._id !== id));
    setDeletingId(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-1">No projects yet</h3>
          <p className="text-sm text-gray-400">
            {user?.role === 'admin' ? 'Create your first project to get started.' : 'You have not been added to any projects yet.'}
          </p>
          {user?.role === 'admin' && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 mx-auto">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card p-5 flex flex-col hover:shadow-soft hover:border-gray-200 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-accent" />
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(project._id)}
                    disabled={deletingId === project._id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    {deletingId === project._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-50">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5" /> {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
              </div>

              <Link href={`/dashboard/projects/${project._id}`} className="btn-secondary mt-3 justify-center text-xs py-1.5">
                Open Project <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={(p) => { setProjects(prev => [p, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
