import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import Bank from "@/app/models/Bank";

// PUT update bank
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    const { bankName, accountName, accountNumber, accountType, ifscCode, upiId } = body;
    
    // Validate required fields
    if (!bankName || !accountName || !accountNumber || !accountType || !ifscCode || !upiId) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }
    
    // Find and update bank
    const bank = await Bank.findByIdAndUpdate(
      id,
      {
        bankName,
        accountName,
        accountNumber,
        accountType,
        ifscCode: ifscCode.toUpperCase(),
        upiId,
      },
      { new: true }
    );
    
    if (!bank) {
      return NextResponse.json(
        { success: false, message: "Bank not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Bank details updated successfully",
      bank: {
        _id: bank._id,
        bankName: bank.bankName,
        accountName: bank.accountName,
        accountNumber: bank.accountNumber,
        accountType: bank.accountType,
        ifscCode: bank.ifscCode,
        upiId: bank.upiId,
        createdAt: bank.createdAt,
        updatedAt: bank.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error updating bank:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update bank details" },
      { status: 500 }
    );
  }
}

// DELETE bank
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const bank = await Bank.findByIdAndDelete(id);
    
    if (!bank) {
      return NextResponse.json(
        { success: false, message: "Bank not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Bank details deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting bank:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete bank details" },
      { status: 500 }
    );
  }
} 