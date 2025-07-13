import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import mongoose from 'mongoose';

// Interior Preset Schema
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

// POST - Create new interior preset
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { name, items, totalAmount, createdAt } = await request.json();
    
    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided' },
        { status: 400 }
      );
    }

    const preset = new InteriorPreset({
      name,
      items,
      totalAmount,
      createdAt: createdAt || new Date(),
      updatedAt: new Date()
    });

    await preset.save();

    return NextResponse.json({
      success: true,
      message: 'Interior preset saved successfully',
      id: preset._id
    });

  } catch (error) {
    console.error('Error saving interior preset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save interior preset' },
      { status: 500 }
    );
  }
}

// GET - Fetch all interior presets
export async function GET() {
  try {
    await dbConnect();
    const presets = await InteriorPreset.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      presets: presets.map(preset => ({
        id: preset._id,
        name: preset.name,
        items: preset.items,
        totalAmount: preset.totalAmount,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching interior presets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch interior presets' },
      { status: 500 }
    );
  }
} 