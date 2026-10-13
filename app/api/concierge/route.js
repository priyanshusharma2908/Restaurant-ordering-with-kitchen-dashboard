import Groq from 'groq-sdk';
import { conciergeSystemPrompt } from '@/lib/prompts';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cleanText, errorResponse } from '@/lib/validation';
import { allowRequest } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!allowRequest(ip)) return Response.json({ error: 'The chef is serving a few guests right now. Please try again in a minute.' }, { status: 429 });
    if (!process.env.GROQ_API_KEY) return Response.json({ error: 'The chef’s concierge is taking a little break. The menu is ready whenever you are.' }, { status: 503 });
    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 12) return Response.json({ error: 'Please start a fresh chat.' }, { status: 400 });
    const messages = body.messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: cleanText(m.content, 700) })).filter((m) => m.content);
    const { data: menu, error } = await supabaseAdmin().from('menu_items').select('id,name,description,price,category,is_vegetarian').eq('is_available', true);
    if (error) throw error;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 20000, maxRetries: 1 });
    const completion = await groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', temperature: 0.55, max_tokens: 350, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: `${conciergeSystemPrompt}\nCurrent menu (only recommend exact IDs listed here): ${JSON.stringify(menu)}` }, ...messages] });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const validIds = new Set((menu || []).map((item) => item.id));
    const suggested_item_ids = Array.isArray(result.suggested_item_ids) ? result.suggested_item_ids.filter((id) => validIds.has(id)).slice(0, 4) : [];
    return Response.json({ reply: cleanText(result.reply, 700) || 'What are you in the mood for today?', suggested_item_ids, items: (menu || []).filter((item) => suggested_item_ids.includes(item.id)) });
  } catch (e) { return errorResponse(e, 'The chef is briefly unavailable. Please explore the menu or try again.'); }
}
