import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import mongoose from 'mongoose';

// SubCategory Schema
const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sub category name is required'],
    trim: true
  },
  categoryId: {
    type: String,
    required: [true, 'Category ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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

const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema);
const Section = mongoose.models.Section || mongoose.model('Section', sectionSchema);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, categoryId } = await request.json();

    if (!name || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Sub category name and category ID are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const result = await SubCategory.updateOne(
      { _id: id },
      { $set: { name, categoryId } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sub category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating sub category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sub category' },
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

    // Check if subcategory has sections
    const sectionsCount = await Section.countDocuments({
      subCategoryId: id
    });

    if (sectionsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete subcategory with existing sections' },
        { status: 400 }
      );
    }

    const result = await SubCategory.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sub category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sub category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete sub category' },
      { status: 500 }
    );
  }
} 