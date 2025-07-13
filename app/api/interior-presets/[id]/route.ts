import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import mongoose from 'mongoose';

// Interior Preset Schema (same as in route.ts)
const interiorPresetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Preset name is required'],
    trim: true
  },
  items: {
    type: Array,
    required: [true, 'Items are required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const InteriorPreset = mongoose.models.InteriorPreset || mongoose.model('InteriorPreset', interiorPresetSchema);

// GET - Fetch individual interior preset by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Preset ID is required' },
        { status: 400 }
      );
    }

    const preset = await InteriorPreset.findById(id);
    
    if (!preset) {
      return NextResponse.json(
        { success: false, message: 'Preset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preset: {
        id: preset._id,
        name: preset.name,
        items: preset.items,
        totalAmount: preset.totalAmount,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching interior preset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch interior preset' },
      { status: 500 }
    );
  }
}

// PUT - Update interior preset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { name, items, totalAmount } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Preset ID is required' },
        { status: 400 }
      );
    }

    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided' },
        { status: 400 }
      );
    }

    const updatedPreset = await InteriorPreset.findByIdAndUpdate(
      id,
      {
        name,
        items,
        totalAmount,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedPreset) {
      return NextResponse.json(
        { success: false, message: 'Preset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Interior preset updated successfully',
      preset: {
        id: updatedPreset._id,
        name: updatedPreset.name,
        items: updatedPreset.items,
        totalAmount: updatedPreset.totalAmount,
        createdAt: updatedPreset.createdAt,
        updatedAt: updatedPreset.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating interior preset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update interior preset' },
      { status: 500 }
    );
  }
}

// DELETE - Delete interior preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Preset ID is required' },
        { status: 400 }
      );
    }

    const deletedPreset = await InteriorPreset.findByIdAndDelete(id);
    
    if (!deletedPreset) {
      return NextResponse.json(
        { success: false, message: 'Preset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Interior preset deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting interior preset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete interior preset' },
      { status: 500 }
    );
  }
} 