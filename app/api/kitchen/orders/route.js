import { supabaseAdmin } from '@/lib/supabase-admin';
import { errorResponse } from '@/lib/validation';
import { demoMode } from '@/lib/demo-menu';
function authorized(request) { const expected = process.env.KITCHEN_PIN || (demoMode ? '1234' : ''); return !!expected && request.headers.get('x-kitchen-pin') === expected; }
export const dynamic = 'force-dynamic';
export async function GET(request) {
  if (!authorized(request)) return Response.json({ error: 'Kitchen session expired. Unlock the dashboard again.' }, { status: 401 });
  if (demoMode) return Response.json({ orders: [], demo: true }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const { data, error } = await supabaseAdmin().from('orders').select('id,table_number,status,total_amount,created_at,notes,order_items(item_name,quantity,unit_price,special_notes)').order('created_at', { ascending: true }).limit(100);
    if (error) throw error;
    return Response.json({ orders: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
export async function PATCH(request) {
  if (!authorized(request)) return Response.json({ error: 'Kitchen session expired.' }, { status: 401 });
  if (demoMode) return Response.json({ ok: true, demo: true });
  try {
    const { id, status } = await request.json();
    if (!['pending', 'preparing', 'ready', 'served'].includes(status) || typeof id !== 'string') return Response.json({ error: 'Invalid order update.' }, { status: 400 });
    const { error } = await supabaseAdmin().from('orders').update({ status }).eq('id', id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
