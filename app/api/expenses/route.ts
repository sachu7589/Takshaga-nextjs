import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyToken, getTokenFromCookies } from '@/app/lib/auth';
import dbConnect from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    let currentUser = getCurrentUser(request);
    
    // If no user from header, try to get from cookies
    if (!currentUser) {
      const token = await getTokenFromCookies();
      if (token) {
        currentUser = verifyToken(token);
      }
    }
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mongoose = await dbConnect();
    if (!mongoose.connection.db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const body = await request.json();
    const { clientId, category, notes, amount, date } = body;

    if (!clientId || !category || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user details to get the actual name
    const userDetails = await mongoose.connection.db.collection('users').findOne(
      { _id: new mongoose.Types.ObjectId(currentUser.userId) }
    );

    const expenseData = {
      userId: currentUser.userId,
      clientId: clientId,
      category: category,
      notes: notes || '',
      amount: parseFloat(amount),
      date: new Date(date),
      addedBy: userDetails?.name || currentUser.email.split('@')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongoose.connection.db.collection('expenses').insertOne(expenseData);
    const createdExpense = await mongoose.connection.db.collection('expenses').findOne({ _id: result.insertedId });

    return NextResponse.json({ 
      success: true, 
      expense: createdExpense, 
      message: 'Expense created successfully' 
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    let currentUser = getCurrentUser(request);
    
    // If no user from header, try to get from cookies
    if (!currentUser) {
      const token = await getTokenFromCookies();
      if (token) {
        currentUser = verifyToken(token);
      }
    }
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mongoose = await dbConnect();
    if (!mongoose.connection.db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const expenses = await mongoose.connection.db.collection('expenses')
      .find({ clientId: clientId })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({ 
      success: true, 
      expenses: expenses 
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
} 