import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';
import GeneralEstimate from '@/app/models/GeneralEstimate';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: estimateId } = await params;

    // Get current user from token
    let currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      // Try to get token from cookies
      const cookieStore = await cookies();
      const tokenFromCookie = cookieStore.get('token')?.value;
      
      if (tokenFromCookie) {
        const { verifyToken } = await import('@/app/lib/auth');
        currentUser = verifyToken(tokenFromCookie);
      }
    }
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();

    // Update the estimate
    const updatedEstimate = await GeneralEstimate.findByIdAndUpdate(
      estimateId,
      {
        items: body.items,
        totalAmount: body.totalAmount,
        subtotal: body.subtotal,
        discount: body.discount || 0,
        discountType: body.discountType || 'percentage',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedEstimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      estimate: updatedEstimate
    });

  } catch (error) {
    console.error('Error updating general estimate:', error);
    return NextResponse.json(
      { error: 'Failed to update general estimate' },
      { status: 500 }
    );
  }
}

