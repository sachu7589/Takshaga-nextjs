import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;
    
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

    // First, get the estimate to find the clientId
    const estimate = await mongoose.connection.db.collection('interior_estimates').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    const clientId = estimate.clientId;

    // Update the current estimate status to approved
    const updateResult = await mongoose.connection.db.collection('interior_estimates').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status: 'approved',
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // Delete all other estimates for the same client (excluding the approved one and completed estimates)
    const deleteResult = await mongoose.connection.db.collection('interior_estimates').deleteMany({
      clientId: clientId,
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      status: { $ne: 'completed' }
    });

    // Insert stage data
    const stageData = {
      userId: currentUser.userId,
      clientId: clientId,
      date: new Date(),
      stageDesc: 'approved',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongoose.connection.db.collection('stages').insertOne(stageData);

    // Insert interior income data (50% of total amount)
    const incomeAmount = estimate.totalAmount * 0.5;
    const incomeData = {
      userId: currentUser.userId,
      clientId: clientId,
      amount: incomeAmount,
      status: 'pending',
      method: null,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongoose.connection.db.collection('interior_income').insertOne(incomeData);

    return NextResponse.json({
      success: true,
      message: 'Estimate approved successfully',
      approvedEstimateId: id,
      deletedEstimatesCount: deleteResult.deletedCount,
      stageCreated: true,
      incomeCreated: true,
      incomeAmount: incomeAmount
    });

  } catch (error) {
    console.error('Error approving interior estimate:', error);
    return NextResponse.json(
      { error: 'Failed to approve interior estimate' },
      { status: 500 }
    );
  }
} 