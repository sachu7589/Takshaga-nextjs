import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";

// GET all users
export async function GET() {
  try {
    await connectDB();
    
    const users = await User.find({}).select('-password');
    
    return NextResponse.json({ 
      success: true, 
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
} 