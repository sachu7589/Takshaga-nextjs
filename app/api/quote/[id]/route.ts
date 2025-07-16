import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Quote from '@/app/models/Quote';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;

    // Check if quote exists
    const quote = await Quote.findById(id);
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote enquiry not found' },
        { status: 404 }
      );
    }

    // Delete the quote
    await Quote.findByIdAndDelete(id);

    return NextResponse.json(
      { 
        success: true,
        message: 'Quote enquiry deleted successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting quote enquiry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 