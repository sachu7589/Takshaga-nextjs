import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Client from '@/app/models/Client';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, phone, location } = body;

    // Validate required fields
    if (!name || !email || !phone || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, location' },
        { status: 400 }
      );
    }

    // Check if client with same email already exists
    const existingClient = await Client.findOne({ email: email.toLowerCase() });
    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      );
    }

    // Create new client
    const newClient = new Client({
      name,
      email: email.toLowerCase(),
      phone,
      location
    });

    const savedClient = await newClient.save();

    return NextResponse.json(
      { 
        message: 'Client created successfully',
        client: {
          id: savedClient._id,
          name: savedClient.name,
          email: savedClient.email,
          phone: savedClient.phone,
          location: savedClient.location,
          createdAt: savedClient.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    
    const clients = await Client.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 