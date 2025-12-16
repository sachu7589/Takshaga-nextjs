import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Client from '@/app/models/Client';

interface InteriorEstimate {
  clientId?: string | { toString: () => string } | unknown;
  status?: string;
}

export async function GET() {
  try {
    await dbConnect();
    
    const mongoose = await dbConnect();
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Find all approved interior estimates
    const approvedEstimates = await mongoose.connection.db
      .collection('interior_estimates')
      .find({ status: 'approved' })
      .toArray() as InteriorEstimate[];
    
    // Get unique client IDs from approved estimates
    const clientIds = new Set<string>();
    approvedEstimates.forEach((est) => {
      if (est.clientId) {
        const clientId = typeof est.clientId === 'string' 
          ? est.clientId 
          : String(est.clientId);
        clientIds.add(clientId);
      }
    });
    
    // Fetch clients with approved projects
    const clients = await Client.find({
      _id: { $in: Array.from(clientIds) }
    }).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      clients,
      count: clients.length 
    });
  } catch (error) {
    console.error('Error fetching clients with approved projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

