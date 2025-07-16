import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Quote from '@/app/models/Quote';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    console.log('Received quote data:', body);
    
    const { 
      name, 
      phone, 
      request_call, 
      service_interest, 
      sq_feet, 
      package: packageType, 
      additional_info 
    } = body;

    // Create new quote enquiry - store whatever data is received
    const newQuote = new Quote({
      name: name || '',
      phone: phone || '',
      request_call: request_call || false,
      service_interest: service_interest || '',
      sq_feet: sq_feet || 0,
      package: packageType || '',
      additional_info: additional_info || '',
    });

    const savedQuote = await newQuote.save();

    return NextResponse.json(
      { 
        success: true,
        message: 'Quote enquiry submitted successfully',
        quote: {
          id: savedQuote._id,
          name: savedQuote.name,
          phone: savedQuote.phone,
          request_call: savedQuote.request_call,
          service_interest: savedQuote.service_interest,
          sq_feet: savedQuote.sq_feet,
          package: savedQuote.package,
          additional_info: savedQuote.additional_info,
          createdAt: savedQuote.createdAt
        }
      },
      { 
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );

  } catch (error) {
    console.error('Error creating quote enquiry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export async function GET() {
  try {
    await dbConnect();
    
    const quotes = await Quote.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true,
      quotes 
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 