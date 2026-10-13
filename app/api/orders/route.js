import { supabaseAdmin } from '@/lib/supabase-admin';
import { cleanText, errorResponse, isObject, safeTable } from '@/lib/validation';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  try {
    const body = await request.json();
    const table = safeTable(body.table);
    if (!table || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 40) return Response.json({ error: 'Check the table number and cart items.' }, { status: 400 });
    const quantities = new Map();
    for (const row of body.items) {
      if (!isObject(row) || typeof row.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(row.id) || !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 20) return Response.json({ error: 'One or more cart items are invalid.' }, { status: 400 });
      const quantity = (quantities.get(row.id) || 0) + row.quantity;
      if (quantity > 20) return Response.json({ error: 'Please order no more than 20 of a single dish.' }, { status: 400 });
      quantities.set(row.id, quantity);
    }
    const db = supabaseAdmin();
    const { data: menu, error: menuError } = await db.from('menu_items').select('id,name,price,is_available').in('id', [...quantities.keys()]);
    if (menuError) throw menuError;
    if (!menu || menu.length !== quantities.size || menu.some((item) => !item.is_available)) return Response.json({ error: 'Some dishes are unavailable. Refresh the menu and try again.' }, { status: 409 });
    const notes = cleanText(body.notes, 500);
    const total = menu.reduce((sum, item) => sum + Number(item.price) * quantities.get(item.id), 0);
    const { data: order, error: orderError } = await db.from('orders').insert({ table_number: table, status: 'pending', total_amount: total, notes }).select('id,created_at').single();
    if (orderError) throw orderError;
    const rows = menu.map((item) => ({ order_id: order.id, menu_item_id: item.id, item_name: item.name, quantity: quantities.get(item.id), unit_price: item.price, special_notes: notes }));
    const { error: itemError } = await db.from('order_items').insert(rows);
    if (itemError) { await db.from('orders').delete().eq('id', order.id); throw itemError; }
    return Response.json({ id: order.id, created_at: order.created_at, total }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
