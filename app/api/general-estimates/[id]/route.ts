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

    const $set: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.items !== undefined) $set.items = body.items;
    if (body.totalAmount !== undefined) $set.totalAmount = body.totalAmount;
    if (body.subtotal !== undefined) $set.subtotal = body.subtotal;
    if (body.discount !== undefined) $set.discount = body.discount;
    if (body.discountType !== undefined) $set.discountType = body.discountType;
    if (body.paymentStages !== undefined) $set.paymentStages = body.paymentStages;
    if (body.sqFeet !== undefined) $set.sqFeet = body.sqFeet;
    if (body.constructionCostPerSqFt !== undefined) $set.constructionCostPerSqFt = body.constructionCostPerSqFt;
    if (body.interiorCostType !== undefined) $set.interiorCostType = body.interiorCostType;
    if (body.interiorCostPerSqFt !== undefined) $set.interiorCostPerSqFt = body.interiorCostPerSqFt;
    if (body.interiorFixedCost !== undefined) $set.interiorFixedCost = body.interiorFixedCost;
    if (body.projectCustomItems !== undefined) $set.projectCustomItems = body.projectCustomItems;
    if (body.projectCostRows !== undefined) $set.projectCostRows = body.projectCostRows;
    if (body.workDetails !== undefined) $set.workDetails = body.workDetails;
    if (body.additionalWorks !== undefined) $set.additionalWorks = body.additionalWorks;
    if (body.materialsUsed !== undefined) $set.materialsUsed = body.materialsUsed;
    if (body.estimateName !== undefined) $set.estimateName = body.estimateName;
    if (body.status !== undefined) $set.status = body.status;

    // Update the estimate
    const updatedEstimate = await GeneralEstimate.findByIdAndUpdate(
      estimateId,
      { $set },
      { new: true, runValidators: true }
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

