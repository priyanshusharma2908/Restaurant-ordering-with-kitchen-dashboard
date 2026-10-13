import { supabaseAdmin } from '@/lib/supabase-admin';
import { errorResponse } from '@/lib/validation';
export const dynamic = 'force-dynamic';
export async function GET(_request, { params }) {
  try {
    const db = supabaseAdmin();
    const { data: order, error } = await db.from('orders').select('id,table_number,status,total_amount,created_at,notes').eq('id', params.id).single();
    if (error) return Response.json({ error: 'Order not found.' }, { status: 404 });
    const { data: items, error: itemError } = await db.from('order_items').select('item_name,quantity,unit_price,special_notes').eq('order_id', params.id);
    if (itemError) throw itemError;
    return Response.json({ order, items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
