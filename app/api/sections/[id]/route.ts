import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import mongoose from 'mongoose';

// Section Schema
const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  categoryId: {
    type: String,
    required: [true, 'Category ID is required']
  },
  subCategoryId: {
    type: String,
    required: [true, 'Sub category ID is required']
  },
  material: {
    type: String,
    required: [true, 'Material is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  type: {
    type: String,
    enum: ['pieces', 'area', 'running_sq_feet'],
    default: 'pieces'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Section = mongoose.models.Section || mongoose.model('Section', sectionSchema);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, categoryId, subCategoryId, material, description, amount, type } = await request.json();

    if (!name || !categoryId || !subCategoryId || !material || !description || !amount || !type) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const result = await Section.updateOne(
      { _id: id },
      { 
        $set: { 
          name, 
          categoryId, 
          subCategoryId, 
          material, 
          description, 
          amount: parseFloat(amount), 
          type 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const result = await Section.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete section' },
      { status: 500 }
    );
  }
} 