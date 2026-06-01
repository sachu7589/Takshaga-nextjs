import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Certificate from '@/app/models/Certificate';

function serialize(c: InstanceType<typeof Certificate>) {
  return {
    _id: c._id,
    certId: c.certId,
    certificateType: c.certificateType,
    fromDate: c.fromDate,
    toDate: c.toDate,
    validityType: c.validityType,
    validityDate: c.validityDate,
    name: c.name,
    jobDesignation: c.jobDesignation,
    content: c.content,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// GET certificate by certId - only returns if status === 'active'.
// Pass ?includeDisabled=true to bypass (used by the dashboard edit screen).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    await dbConnect();

    const { certId } = await params;
    const { searchParams } = new URL(request.url);
    const includeDisabled = searchParams.get('includeDisabled') === 'true';

    const certificate = await Certificate.findOne({ certId });

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificate not found' },
        { status: 404 }
      );
    }

    if (!includeDisabled && certificate.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Certificate is not active' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: serialize(certificate),
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}

// PUT update certificate by certId
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    await dbConnect();

    const { certId } = await params;
    const body = await request.json();
    const {
      certificateType,
      fromDate,
      toDate,
      validityType,
      validityDate,
      name,
      jobDesignation,
      content,
      status,
    } = body ?? {};

    if (
      !certificateType ||
      !fromDate ||
      !toDate ||
      !validityType ||
      !name ||
      !jobDesignation ||
      !content
    ) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (!['experience', 'internship'].includes(certificateType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid certificate type' },
        { status: 400 }
      );
    }

    if (!['lifelong', 'date'].includes(validityType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid validity type' },
        { status: 400 }
      );
    }

    if (validityType === 'date' && !validityDate) {
      return NextResponse.json(
        { success: false, message: 'Validity date is required when validity is a specific date' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string' || content.length > 1000) {
      return NextResponse.json(
        { success: false, message: 'Content must be 1000 characters or fewer' },
        { status: 400 }
      );
    }

    if (status && !['active', 'disabled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {
      certificateType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      validityType,
      validityDate: validityType === 'date' ? new Date(validityDate) : null,
      name,
      jobDesignation,
      content,
    };
    if (status) update.status = status;

    const certificate = await Certificate.findOneAndUpdate(
      { certId },
      update,
      { new: true, runValidators: true }
    );

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate updated successfully',
      certificate: serialize(certificate),
    });
  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update certificate' },
      { status: 500 }
    );
  }
}

// PATCH - update status only (active <-> disabled)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    await dbConnect();

    const { certId } = await params;
    const body = await request.json();
    const { status } = body ?? {};

    if (!status || !['active', 'disabled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be active or disabled.' },
        { status: 400 }
      );
    }

    const certificate = await Certificate.findOneAndUpdate(
      { certId },
      { status },
      { new: true }
    );

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: 'Certificate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Certificate ${status === 'disabled' ? 'disabled' : 'activated'} successfully`,
      certificate: serialize(certificate),
    });
  } catch (error) {
    console.error('Error updating certificate status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update certificate status' },
      { status: 500 }
    );
  }
}
