import mongoose, { Schema, Document } from 'mongoose';

interface IImage extends Document {
  filename: string;
  path: string;
}

const ImageSchema: Schema = new Schema(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true }
  },
  { timestamps: true }
);

const Image: mongoose.Model<IImage> = mongoose.model<IImage>('Image', ImageSchema);
export { Image};
export type {IImage};