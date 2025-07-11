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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema);

// GET - Fetch all subcategories or by category
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let query = {};
    if (categoryId) {
      query = { categoryId };
    }

    const subCategories = await SubCategory.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      subCategories: subCategories.map(sub => ({
        id: sub._id,
        name: sub.name,
        categoryId: sub.categoryId._id,
        categoryName: sub.categoryId.name,
        createdAt: sub.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcategories' },
      { status: 500 }
    );
  }
}

// POST - Create new subcategory
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { name, categoryId } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Sub category name is required' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if subcategory already exists in this category
    const existingSubCategory = await SubCategory.findOne({ 
      name: name.trim(), 
      categoryId 
    });
    
    if (existingSubCategory) {
      return NextResponse.json(
        { error: 'Sub category with this name already exists in this category' },
        { status: 400 }
      );
    }

    const subCategory = new SubCategory({ 
      name: name.trim(), 
      categoryId 
    });
    await subCategory.save();

    // Populate category info
    await subCategory.populate('categoryId', 'name');

    return NextResponse.json({
      success: true,
      subCategory: {
        id: subCategory._id,
        name: subCategory.name,
        categoryId: subCategory.categoryId._id,
        categoryName: subCategory.categoryId.name,
        createdAt: subCategory.createdAt
      },
      message: 'Sub category created successfully'
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to create subcategory' },
      { status: 500 }
    );
  }
} 