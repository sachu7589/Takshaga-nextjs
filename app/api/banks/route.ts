import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import Bank from "@/app/models/Bank";

// GET all banks
export async function GET() {
  try {
    await dbConnect();
    
    const banks = await Bank.find({});
    
    return NextResponse.json({ 
      success: true, 
      banks: banks.map(bank => ({
        _id: bank._id,
        bankName: bank.bankName,
        accountName: bank.accountName,
        accountNumber: bank.accountNumber,
        accountType: bank.accountType,
        ifscCode: bank.ifscCode,
        upiId: bank.upiId,
        createdAt: bank.createdAt,
        updatedAt: bank.updatedAt,
      }))
    });
  } catch (error) {
    console.error("Error fetching banks:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch banks" },
      { status: 500 }
    );
  }
}

// POST new bank
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { bankName, accountName, accountNumber, accountType, ifscCode, upiId } = body;
    
    // Validate required fields
    if (!bankName || !accountName || !accountNumber || !accountType || !ifscCode || !upiId) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }
    
    // Create new bank
    const bank = new Bank({
      bankName,
      accountName,
      accountNumber,
      accountType,
      ifscCode: ifscCode.toUpperCase(),
      upiId,
    });
    
    await bank.save();
    
    return NextResponse.json({ 
      success: true, 
      message: "Bank details added successfully",
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
    console.error("Error creating bank:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create bank details" },
      { status: 500 }
    );
  }
} 