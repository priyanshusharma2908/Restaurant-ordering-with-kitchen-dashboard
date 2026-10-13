'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChefHat, Clock3, LockKeyhole, LogOut, RefreshCw } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { readDemoOrders, saveDemoOrders } from '@/lib/demo-orders';

const columns = [
  { key: 'pending', name: 'Pending', tone: 'bg-[#fff1e8] text-[#cf684f]' },
  { key: 'preparing', name: 'Preparing', tone: 'bg-[#fff7dc] text-[#aa7c16]' },
  { key: 'ready', name: 'Ready', tone: 'bg-[#e8f6f0] text-[#218268]' },
  { key: 'served', name: 'Served', tone: 'bg-[#f0edff] text-[#7968cc]' },
];

export default function KitchenBoard() {
  const [pin, setPin] = useState('');
  const [staffName, setStaffName] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState('');
  const [now, setNow] = useState(Date.now());
  const [employee, setEmployee] = useState(null);
  const [demo, setDemo] = useState(false);
  const previousIds = useRef(null);

  const load = useCallback(async (secret = pin) => {
    if (!secret) return;
    const response = await fetch('/api/kitchen/orders', { headers: { 'x-kitchen-pin': secret } });
    const data = await response.json();
    if (response.status === 401) {
      sessionStorage.removeItem('kitchenPin');
      setUnlocked(false);
      setError(data.error);
      return;
    }
    if (!response.ok) throw new Error(data.error);
    setDemo(Boolean(data.demo));
    const next = data.demo ? readDemoOrders() : (data.orders || []);
    if (previousIds.current && next.some((order) => order.status === 'pending' && !previousIds.current.has(order.id))) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const context = new AudioContextClass();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.frequency.value = 880;
          gain.gain.value = 0.12;
          oscillator.start();
          oscillator.stop(context.currentTime + 0.18);
        }
      } catch { /* Sound is optional when browser audio is unavailable. */ }
    }
    previousIds.current = new Set(next.map((order) => order.id));
    setOrders(next);
  }, [pin]);

  useEffect(() => {
    const savedPin = sessionStorage.getItem('kitchenPin');
    if (savedPin) { setPin(savedPin); setUnlocked(true); }
    try {
      const profile = JSON.parse(localStorage.getItem('tabletalkProfile') || 'null');
      if (profile?.role === 'employee') { setEmployee(profile); setStaffName(profile.name || ''); }
    } catch { /* Ignore an invalid saved profile. */ }
    const syncProfile = () => {
      try {
        const profile = JSON.parse(localStorage.getItem('tabletalkProfile') || 'null');
        if (profile?.role === 'employee') {
          setEmployee(profile);
          setStaffName(profile.name || '');
          const secret = sessionStorage.getItem('kitchenPin');
          if (secret) { setPin(secret); setUnlocked(true); }
        } else {
          setEmployee(null); setStaffName(''); setOrders([]); setPin(''); setUnlocked(false);
        }
      } catch { setEmployee(null); setStaffName(''); setOrders([]); setPin(''); setUnlocked(false); }
    };
    window.addEventListener('tabletalk-profile-updated', syncProfile);
    return () => window.removeEventListener('tabletalk-profile-updated', syncProfile);
  }, []);

  useEffect(() => {
    if (!unlocked || !pin) return undefined;
    let alive = true;
    const refresh = () => load().catch((cause) => { if (alive) setError(cause.message); });
    refresh();
    const timer = setInterval(refresh, 15000);
    const syncDemo = () => setOrders(readDemoOrders());
    window.addEventListener('storage', syncDemo);
    window.addEventListener('tabletalk-demo-orders-updated', syncDemo);
    const database = supabaseBrowser();
    const channel = database?.channel('kitchen-order-feed').on('postgres_changes', { event: '*', schema: 'public', table: 'order_status_feed' }, refresh).subscribe();
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      alive = false;
      clearInterval(timer);
      clearInterval(clock);
      window.removeEventListener('storage', syncDemo);
      window.removeEventListener('tabletalk-demo-orders-updated', syncDemo);
      if (channel) database.removeChannel(channel);
    };
  }, [unlocked, pin, load]);

  const unlock = async (event) => {
    event.preventDefault();
    setError('');
    const cleanName = staffName.trim().slice(0, 80);
    if (!cleanName) { setError('Enter your name to continue.'); return; }
    try {
      const response = await fetch('/api/kitchen/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const profile = { role: 'employee', name: cleanName };
      sessionStorage.setItem('kitchenPin', pin);
      localStorage.setItem('tabletalkProfile', JSON.stringify(profile));
      setEmployee(profile);
      setStaffName(cleanName);
      setUnlocked(true);
      window.dispatchEvent(new Event('tabletalk-profile-updated'));
    } catch (cause) { setError(cause.message); }
  };

  const advance = async (order, currentStatus) => {
    const status = { pending: 'preparing', preparing: 'ready', ready: 'served' }[currentStatus];
    if (!status) return;
    setBusy(order.id);
    setError('');
    try {
      if (demo) {
        saveDemoOrders(readDemoOrders().map((saved) => saved.id === order.id ? { ...saved, status } : saved));
        await load();
      } else {
        const response = await fetch('/api/kitchen/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-kitchen-pin': pin },
          body: JSON.stringify({ id: order.id, status }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        await load();
      }
    } catch (cause) { setError(cause.message); }
    finally { setBusy(''); }
  };

  const logout = () => {
    sessionStorage.removeItem('kitchenPin');
    setUnlocked(false);
    setPin('');
    setOrders([]);
  };

  if (!unlocked) return <main className="shell flex min-h-[72vh] max-w-lg items-center justify-center py-12">
    <div className="card w-full p-8 text-center sm:p-10">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e8] text-[#d96752]"><LockKeyhole size={25}/></div>
      <h1 className="display mt-5 text-2xl font-semibold">Kitchen team sign in</h1>
      <p className="mt-2 text-slate-500">Enter your name and staff PIN to see incoming orders.</p>
      <form onSubmit={unlock} className="mt-6 space-y-3">
        <label className="sr-only" htmlFor="staff-name">Your name</label>
        <input id="staff-name" className="soft-input text-center" autoComplete="name" maxLength={80} value={staffName} onChange={(event) => setStaffName(event.target.value)} placeholder="Your name" required/>
        <label className="sr-only" htmlFor="pin">Staff PIN</label>
        <input id="pin" className="soft-input text-center text-xl tracking-[.5em]" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="••••" required/>
        <button className="gradient-button w-full rounded-full py-3 font-semibold text-white">Unlock dashboard</button>
      </form>
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  </main>;

  return <main className="shell min-h-[72vh] py-8 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2 text-sm font-bold uppercase tracking-[.16em] text-[#e47b62]">{demo ? 'Demo service · this browser' : 'Live service'}</div>
        <h1 className="display text-4xl font-semibold">Kitchen dashboard</h1>
        <p className="mt-2 text-slate-500">Signed in as <strong className="text-slate-700">{employee?.name || staffName}</strong></p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => load().catch((cause) => setError(cause.message))} className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"><RefreshCw size={15}/> Refresh</button>
        <button onClick={logout} className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"><LogOut size={15}/> Lock</button>
      </div>
    </div>
    {demo && <p className="mt-3 rounded-xl bg-[#fff8ed] px-4 py-3 text-sm text-slate-600">Demo orders are saved in this browser and appear here immediately. Connect Supabase to share a live queue across devices.</p>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="mt-7 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => {
        const columnOrders = orders.filter((order) => order.status === column.key);
        return <section key={column.key} className="min-h-64 rounded-3xl bg-[#f7f5f2] p-3">
          <div className="mb-3 flex items-center justify-between px-2 pt-1"><h2 className="font-semibold">{column.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${column.tone}`}>{columnOrders.length}</span></div>
          <div className="space-y-3">
            {columnOrders.map((order) => {
              const age = Math.floor((now - new Date(order.created_at).getTime()) / 60000);
              const late = age > 10;
              return <article key={order.id} className={`card p-4 ${late ? 'border-[#f1b249]' : ''}`}>
                <div className="flex items-start justify-between"><div><span className="text-xs text-slate-500">TABLE</span><div className="display text-2xl font-semibold">{order.table_number}</div></div><div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${late ? 'bg-[#fff1d5] text-[#a97511]' : 'bg-slate-100 text-slate-500'}`}><Clock3 size={13}/>{age} min</div></div>
                <div className="my-3 space-y-2 border-y border-dashed py-3">{(order.order_items || []).map((item, index) => <div key={`${order.id}-${index}`} className="flex justify-between gap-2 text-sm"><span className="font-medium">{item.quantity} × {item.item_name}</span></div>)}</div>
                {order.notes && <div className="mb-3 rounded-xl bg-[#fff8ed] p-2.5 text-xs text-slate-600"><strong>Note: </strong>{order.notes}</div>}
                <div className="flex items-center justify-between"><span className="font-semibold">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>{column.key !== 'served' && <button disabled={busy === order.id} onClick={() => advance(order, column.key)} className="flex items-center gap-1 rounded-full bg-[#263143] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy === order.id ? 'Saving…' : column.key === 'pending' ? 'Start' : column.key === 'preparing' ? 'Ready' : 'Served'} <ArrowRight size={13}/></button>}</div>
              </article>;
            })}
            {columnOrders.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 py-9 text-center text-sm text-slate-400">{column.key === 'pending' ? 'Waiting for the next order' : 'No orders here yet'}</div>}
          </div>
        </section>;
      })}
    </div>
    <div className="mt-5 text-center text-xs text-slate-400"><ChefHat className="mr-1 inline" size={14}/>{demo ? 'Demo queue updates across tabs in this browser.' : 'New orders show up live. The board refreshes automatically as a fallback.'}</div>
  </main>;
}
