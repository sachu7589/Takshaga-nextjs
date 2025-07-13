import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Client from '@/app/models/Client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        location: client.location,
        createdAt: client.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, location } = body;

    // Validate required fields
    if (!name || !email || !phone || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, location' },
        { status: 400 }
      );
    }

    // Check if client exists
    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email already exists
    if (email !== existingClient.email) {
      const emailExists = await Client.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Client with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Update client
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        name,
        email: email.toLowerCase(),
        phone,
        location
      },
      { new: true }
    );

    return NextResponse.json(
      { 
        message: 'Client updated successfully',
        client: {
          id: updatedClient._id,
          name: updatedClient.name,
          email: updatedClient.email,
          phone: updatedClient.phone,
          location: updatedClient.location,
          createdAt: updatedClient.createdAt
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    // Check if client exists
    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Delete client
    await Client.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 