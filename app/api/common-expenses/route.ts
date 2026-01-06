import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyToken, getTokenFromCookies } from '@/app/lib/auth';
import dbConnect from '@/app/lib/db';
import CommonExpense from '@/app/models/CommonExpense';

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
    const { category, notes, amount, date } = body;

    if (!category || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields: category, amount, date' }, { status: 400 });
    }

    // Fetch user details to get the actual name
    const userDetails = await mongoose.connection.db.collection('users').findOne(
      { _id: new mongoose.Types.ObjectId(currentUser.userId) }
    );

    const commonExpense = new CommonExpense({
      userId: currentUser.userId,
      category: category,
      notes: notes || '',
      amount: parseFloat(amount),
      date: new Date(date),
      addedBy: userDetails?.name || currentUser.email.split('@')[0],
    });

    await commonExpense.save();

    return NextResponse.json({ 
      success: true, 
      expense: commonExpense, 
      message: 'Common expense created successfully' 
    });

  } catch (error) {
    console.error('Error creating common expense:', error);
    return NextResponse.json({ error: 'Failed to create common expense' }, { status: 500 });
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

    await dbConnect();

    const expenses = await CommonExpense.find()
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      expenses: expenses 
    });

  } catch (error) {
    console.error('Error fetching common expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch common expenses' }, { status: 500 });
  }
}

