import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import mongoose from 'mongoose';

// Section Schema
const sectionSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: [true, 'Sub category ID is required']
  },
  material: {
    type: String,
    required: [true, 'Material is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  type: {
    type: String,
    enum: ['pieces', 'area', 'running_sq_feet'],
    required: [true, 'Type is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Section = mongoose.models.Section || mongoose.model('Section', sectionSchema);

// GET - Fetch all sections
export async function GET() {
  try {
    await dbConnect();
    const sections = await Section.find({})
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      sections: sections.map(section => ({
        id: section._id,
        categoryId: section.categoryId._id,
        categoryName: section.categoryId.name,
        subCategoryId: section.subCategoryId._id,
        subCategoryName: section.subCategoryId.name,
        material: section.material,
        description: section.description,
        amount: section.amount,
        type: section.type,
        createdAt: section.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST - Create new section
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { categoryId, subCategoryId, material, description, amount, type } = await request.json();

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    if (!subCategoryId) {
      return NextResponse.json(
        { error: 'Sub category ID is required' },
        { status: 400 }
      );
    }

    if (!material || material.trim() === '') {
      return NextResponse.json(
        { error: 'Material is required' },
        { status: 400 }
      );
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!type || !['pieces', 'area', 'running_sq_feet'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type is required' },
        { status: 400 }
      );
    }

    const section = new Section({
      categoryId,
      subCategoryId,
      material: material.trim(),
      description: description.trim(),
      amount: Number(amount),
      type
    });
    await section.save();

    // Populate category and subcategory info
    await section.populate('categoryId', 'name');
    await section.populate('subCategoryId', 'name');

    return NextResponse.json({
      success: true,
      section: {
        id: section._id,
        categoryId: section.categoryId._id,
        categoryName: section.categoryId.name,
        subCategoryId: section.subCategoryId._id,
        subCategoryName: section.subCategoryId.name,
        material: section.material,
        description: section.description,
        amount: section.amount,
        type: section.type,
        createdAt: section.createdAt
      },
      message: 'Section created successfully'
    });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
} 