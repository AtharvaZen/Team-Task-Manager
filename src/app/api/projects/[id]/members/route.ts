import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

const memberSchema = z.object({ userId: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const project = await Project.findById(params.id);
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    if (project.admin.toString() !== auth.user.id) return NextResponse.json({ success: false, error: 'Only project admin can add members' }, { status: 403 });

    const parsed = memberSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const user = await User.findById(parsed.data.userId);
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    if (!project.members.includes(parsed.data.userId as never)) {
      project.members.push(parsed.data.userId as never);
      await project.save();
    }

    const populated = await project.populate([
      { path: 'admin', select: 'name email role' },
      { path: 'members', select: 'name email role' },
    ]);

    return NextResponse.json({ success: true, data: { project: populated } });
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
    if (project.admin.toString() !== auth.user.id) return NextResponse.json({ success: false, error: 'Only project admin can remove members' }, { status: 403 });

    const { userId } = await req.json();
    project.members = project.members.filter((m: { toString: () => string }) => m.toString() !== userId);
    await project.save();

    return NextResponse.json({ success: true, message: 'Member removed' });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
