import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Project from '@/models/Project';
import { requireAuth } from '@/lib/auth';

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const task = await Task.findById(params.id);
    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    const project = await Project.findById(task.projectId);
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    const isProjectAdmin = project.admin.toString() === auth.user.id;
    const isAssignee = task.assignedTo?.toString() === auth.user.id;

    if (!isProjectAdmin && !isAssignee) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    // Members can only update status
    const updates: Record<string, unknown> = {};
    if (auth.user.role === 'admin') {
      if (parsed.data.title !== undefined) updates.title = parsed.data.title;
      if (parsed.data.description !== undefined) updates.description = parsed.data.description;
      if (parsed.data.assignedTo !== undefined) updates.assignedTo = parsed.data.assignedTo;
      if (parsed.data.dueDate !== undefined) updates.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;

    const updated = await Task.findByIdAndUpdate(params.id, updates, { new: true })
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');

    return NextResponse.json({ success: true, data: { task: updated } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  if (auth.user.role !== 'admin') return NextResponse.json({ success: false, error: 'Only admins can delete tasks' }, { status: 403 });

  try {
    await connectDB();
    const task = await Task.findById(params.id);
    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    const project = await Project.findById(task.projectId);
    if (!project || project.admin.toString() !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    await Task.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
