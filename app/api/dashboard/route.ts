import { NextResponse } from 'next/server';
import { getTokenFromCookies, verifyToken } from '@/app/lib/auth';
import dbConnect from '@/app/lib/db';
import User from '@/app/models/User';

export async function GET() {
  try {
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get actual user count from database
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

    // Return dashboard data with real statistics
    return NextResponse.json({
      success: true,
      user,
      dashboard: {
        message: 'Welcome to the Management System Dashboard',
        stats: {
          totalUsers,
          activeUsers,
          totalProjects: 12, // Mock data for now
        },
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 