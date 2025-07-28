import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/app/lib/db";
import { getCurrentUser, verifyToken } from "@/app/lib/auth";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Get current user from token (check both Authorization header and cookies)
    let currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      // Try to get token from cookies
      const cookieStore = await cookies();
      const tokenFromCookie = cookieStore.get('token')?.value;
      
      if (tokenFromCookie) {
        currentUser = verifyToken(tokenFromCookie);
      }
    }
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, method, markedBy, amount } = body;

    // Validate required fields
    if (!status && !amount) {
      return NextResponse.json(
        { success: false, message: "Status or amount is required" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
    }
    if (method !== undefined) {
      updateData.method = method || null;
    }
    if (markedBy) {
      updateData.markedBy = markedBy;
    }
    if (amount) {
      updateData.amount = amount;
    }

    // Update the interior income record
    const result = await mongoose.connection.db.collection('interior_income').updateOne(
      { _id: new mongoose.Types.ObjectId(id), userId: currentUser.userId },
      {
        $set: updateData
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Interior income record not found" },
        { status: 404 }
      );
    }

    // Fetch the updated record
    const updatedIncome = await mongoose.connection.db.collection('interior_income').findOne(
      { _id: new mongoose.Types.ObjectId(id) }
    );

    return NextResponse.json({
      success: true,
      message: "Interior income updated successfully",
      interiorIncome: updatedIncome
    });

  } catch (error) {
    console.error("Error updating interior income:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update interior income" },
      { status: 500 }
    );
  }
} 