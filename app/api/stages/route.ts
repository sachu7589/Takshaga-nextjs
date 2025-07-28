import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

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
    const { clientId, stageDesc } = body;

    if (!clientId || !stageDesc) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and stageDesc are required' },
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
    
    const stageData = {
      userId: currentUser.userId,
      clientId,
      date: new Date(),
      stageDesc,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongoose.connection.db.collection('stages').insertOne(stageData);

    // Fetch the created stage object
    const createdStage = await mongoose.connection.db.collection('stages').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      stage: createdStage,
      message: 'Stage created successfully'
    });

  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json(
      { error: 'Failed to create stage' },
      { status: 500 }
    );
  }
}

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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // Build query filter
    const filter: any = {};
    if (clientId) {
      filter.clientId = clientId;
    }

    const stages = await mongoose.connection.db.collection('stages').find(filter).toArray();
    
    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    );
  }
} 