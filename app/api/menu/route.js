import { supabaseAdmin } from '@/lib/supabase-admin';
import { errorResponse } from '@/lib/validation';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin().from('menu_items').select('id,name,description,price,category,image_url,is_vegetarian,is_available').eq('is_available', true).order('category').order('name');
    if (error) throw error;
    return Response.json({ items: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
