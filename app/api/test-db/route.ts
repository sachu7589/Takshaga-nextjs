import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import User from '@/app/models/User';

export async function GET() {
  try {
    await dbConnect();
    console.log('Database connected successfully');

    // Check if admin user exists
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create admin user if it doesn't exist
      const newAdmin = new User({
        email: 'admin@takshaga.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('Admin user created successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        user: {
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connected and admin user exists',
      adminUser: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Database connection failed', details: error },
      { status: 500 }
    );
  }
} 