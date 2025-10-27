import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';
import User from '@/app/models/User';
import GeneralEstimate from '@/app/models/GeneralEstimate';

export async function POST(request: NextRequest) {
  try {
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

    // Get user
    const user = await User.findById(currentUser.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { clientId, estimateName, items, totalAmount, subtotal, discount, discountType, estimateType } = body;

    // Create general estimate
    const generalEstimate = await GeneralEstimate.create({
      userId: user._id.toString(),
      clientId,
      estimateName,
      estimateType,
      items,
      totalAmount,
      subtotal,
      discount: discount || 0,
      discountType: discountType || 'percentage',
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      estimate: generalEstimate
    });

  } catch (error) {
    console.error('Error creating general estimate:', error);
    return NextResponse.json(
      { error: 'Failed to create general estimate' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const estimateId = searchParams.get('estimateId');

    if (estimateId) {
      // Get single estimate by ID
      const estimate = await GeneralEstimate.findById(estimateId);
      if (!estimate) {
        return NextResponse.json(
          { error: 'Estimate not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ estimate });
    }

    if (clientId) {
      // Get estimates for specific client
      const estimates = await GeneralEstimate.find({ clientId }).sort({ createdAt: -1 });

      return NextResponse.json({ estimates });
    }

    // Get all estimates for user
    const estimates = await GeneralEstimate.find({ userId: currentUser.userId }).sort({ createdAt: -1 });

    return NextResponse.json({ estimates });

  } catch (error) {
    console.error('Error fetching general estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch general estimates' },
      { status: 500 }
    );
  }
}

