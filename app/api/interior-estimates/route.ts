import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user from token (check both Authorization header and cookies)
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
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const mongoose = await dbConnect();
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    const estimates = await mongoose.connection.db.collection('interior_estimates').find({}).toArray();
    
    return NextResponse.json({ estimates });
  } catch (error) {
    console.error('Error fetching interior estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interior estimates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user from token (check both Authorization header and cookies)
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
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientId, estimateName, items, totalAmount, discount, discountType } = body;

    if (!clientId || !estimateName || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, estimateName, and items are required' },
        { status: 400 }
      );
    }

    const mongoose = await dbConnect();
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    const estimateData = {
      userId: currentUser.userId,
      clientId,
      estimateName,
      items,
      totalAmount,
      discount: discount || 0,
      discountType: discountType || 'percentage',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongoose.connection.db.collection('interior_estimates').insertOne(estimateData);

    return NextResponse.json({
      success: true,
      estimateId: result.insertedId,
      message: 'Interior estimate created successfully'
    });

  } catch (error) {
    console.error('Error creating interior estimate:', error);
    return NextResponse.json(
      { error: 'Failed to create interior estimate' },
      { status: 500 }
    );
  }
} 