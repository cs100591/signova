import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      // Return mock data for demo
      return NextResponse.json({
        id: parseInt(id),
        name: "Acme Corp MSA",
        type: "Service Agreement",
        amount: "$150,000/year",
        effective_date: "2023-10-24",
        expiry_date: "2025-10-24",
        summary: "Master Service Agreement for Q3 enterprise software deliverables.",
        file_url: "/uploads/sample.pdf",
        created_at: new Date().toISOString(),
      });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({
      id: 1,
      name: "Acme Corp MSA",
      type: "Service Agreement",
      amount: "$150,000/year",
      effective_date: "2023-10-24",
      expiry_date: "2025-10-24",
      summary: "Master Service Agreement for Q3 enterprise software deliverables.",
      file_url: "/uploads/sample.pdf",
      created_at: new Date().toISOString(),
    });
  }
}
