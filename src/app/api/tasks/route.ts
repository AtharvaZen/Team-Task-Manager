import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Project from '@/models/Project';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().default(''),
  projectId: z.string().min(1, 'Project ID is required'),
  assignedTo: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['todo', 'in-progress', 'done']).optional().default('todo'),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    const query: Record<string, unknown> = {};
    if (projectId) query.projectId = projectId;
    if (auth.user.role === 'member') query.assignedTo = auth.user.id;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: { tasks } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  if (auth.user.role !== 'admin') return NextResponse.json({ success: false, error: 'Only admins can create tasks' }, { status: 403 });

  try {
    await connectDB();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { title, description, projectId, assignedTo, dueDate, status } = parsed.data;

    const project = await Project.findById(projectId);
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    if (project.admin.toString() !== auth.user.id) return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status,
    });

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'projectId', select: 'name' },
    ]);

    return NextResponse.json({ success: true, data: { task: populated } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
