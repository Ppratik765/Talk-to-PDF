import { NextRequest, NextResponse } from 'next/server';
import { deleteSource } from '@/lib/vector-store';

export async function POST(req: NextRequest) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    await deleteSource(fileName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}