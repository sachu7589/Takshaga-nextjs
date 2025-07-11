import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import User from '@/app/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting user registration...');
    
    // Connect to database
    await dbConnect();
    console.log('Database connected for registration');

    const { email, password, name } = await request.json();
    console.log('Registration data received:', { email, name, passwordLength: password?.length });

    // Validate input
    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    console.log('Creating new user...');
    const user = new User({
      email,
      password,
      name: name || '',
      role: 'user', // Default role
    });

    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully:', user._id);

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    console.log('Registration successful for:', email);
    return NextResponse.json({
      success: true,
      user: userData,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 