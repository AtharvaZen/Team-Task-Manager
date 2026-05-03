import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Task from '@/models/Task';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const project = await Project.findById(params.id)
      .populate('admin', 'name email role')
      .populate('members', 'name email role');

    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    const isAdmin = project.admin._id.toString() === auth.user.id;
    const isMember = project.members.some((m: { _id: { toString: () => string } }) => m._id.toString() === auth.user.id);
    if (!isAdmin && !isMember) return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });

    return NextResponse.json({ success: true, data: { project } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const project = await Project.findById(params.id);
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    if (project.admin.toString() !== auth.user.id) return NextResponse.json({ success: false, error: 'Only the project admin can delete it' }, { status: 403 });

    await Task.deleteMany({ projectId: params.id });
    await Project.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
