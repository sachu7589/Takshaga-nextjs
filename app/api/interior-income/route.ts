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
    const { clientId, amount } = body;

    if (!clientId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and amount are required' },
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
    
    const incomeData = {
      userId: currentUser.userId,
      clientId,
      amount,
      status: 'pending',
      method: null,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongoose.connection.db.collection('interior_income').insertOne(incomeData);

    // Fetch the created income object
    const createdIncome = await mongoose.connection.db.collection('interior_income').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      interiorIncome: createdIncome,
      message: 'Interior income created successfully'
    });

  } catch (error) {
    console.error('Error creating interior income:', error);
    return NextResponse.json(
      { error: 'Failed to create interior income' },
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
    const filter: { clientId?: string } = {};
    if (clientId) {
      filter.clientId = clientId;
    }

    console.log('Fetching interior income with filter:', filter);
    const interiorIncomes = await mongoose.connection.db.collection('interior_income').find(filter).toArray();
    console.log('Found interior incomes:', interiorIncomes);
    
    return NextResponse.json({ interiorIncomes });
  } catch (error) {
    console.error('Error fetching interior incomes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interior incomes' },
      { status: 500 }
    );
  }
} 