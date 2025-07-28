import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, verifyToken } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      user: {
        id: currentUser.userId,
        name: currentUser.email.split('@')[0], // Extract name from email (before @)
        email: currentUser.email,
        role: currentUser.role
      }
    });

  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user information" },
      { status: 500 }
    );
  }
} 