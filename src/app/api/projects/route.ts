import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(150),
  description: z.string().max(500).optional().default(''),
  members: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const query =
      auth.user.role === 'admin'
        ? { admin: auth.user.id }
        : { members: auth.user.id };

    const projects = await Project.find(query)
      .populate('admin', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: { projects } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  if (auth.user.role !== 'admin') return NextResponse.json({ success: false, error: 'Only admins can create projects' }, { status: 403 });

  try {
    await connectDB();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { name, description, members } = parsed.data;
    const project = await Project.create({ name, description, admin: auth.user.id, members });
    const populated = await project.populate([
      { path: 'admin', select: 'name email role' },
      { path: 'members', select: 'name email role' },
    ]);

    return NextResponse.json({ success: true, data: { project: populated } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
