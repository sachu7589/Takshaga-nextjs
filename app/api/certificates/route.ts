import { NextRequest } from 'next/server';
import dbConnect from '@/app/lib/db';
import Certificate from '@/app/models/Certificate';
import { generateUniqueCertId } from '@/app/lib/certId';
import { corsJson, corsPreflight } from '@/app/lib/cors';

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

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

// GET all certificates (dashboard listing - returns active + disabled).
// Optional ?status=active to filter.
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (status === 'active' || status === 'disabled') {
      filter.status = status;
    }

    const certificates = await Certificate.find(filter).sort({ createdAt: -1 });

    return corsJson(request, {
      success: true,
      certificates: certificates.map(serialize),
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return corsJson(
      request,
      { success: false, message: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

// POST issue a new certificate
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

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
      return corsJson(
        request,
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (!['experience', 'internship'].includes(certificateType)) {
      return corsJson(
        request,
        { success: false, message: 'Invalid certificate type' },
        { status: 400 }
      );
    }

    if (!['lifelong', 'date'].includes(validityType)) {
      return corsJson(
        request,
        { success: false, message: 'Invalid validity type' },
        { status: 400 }
      );
    }

    if (validityType === 'date' && !validityDate) {
      return corsJson(
        request,
        { success: false, message: 'Validity date is required when validity is a specific date' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string' || content.length > 1000) {
      return corsJson(
        request,
        { success: false, message: 'Content must be 1000 characters or fewer' },
        { status: 400 }
      );
    }

    const certId = await generateUniqueCertId();

    const certificate = await Certificate.create({
      certId,
      certificateType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      validityType,
      validityDate: validityType === 'date' ? new Date(validityDate) : null,
      name,
      jobDesignation,
      content,
      status: 'active',
    });

    return corsJson(request, {
      success: true,
      message: 'Certificate issued successfully',
      certificate: serialize(certificate),
    });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return corsJson(
      request,
      { success: false, message: 'Failed to issue certificate' },
      { status: 500 }
    );
  }
}
