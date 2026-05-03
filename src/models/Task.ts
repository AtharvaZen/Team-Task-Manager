import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITaskDocument extends Document {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedTo: Types.ObjectId | null;
  projectId: Types.ObjectId;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);
