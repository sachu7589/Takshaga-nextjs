import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import mongoose from 'mongoose';

// Category Schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const result = await Category.updateOne(
      { _id: id },
      { $set: { name } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await dbConnect();

    // Check if category has subcategories
    const subCategoriesCount = await SubCategory.countDocuments({
      categoryId: id
    });

    if (subCategoriesCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with existing subcategories' },
        { status: 400 }
      );
    }

    const result = await Category.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 