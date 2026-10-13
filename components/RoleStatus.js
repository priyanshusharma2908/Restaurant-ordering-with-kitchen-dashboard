'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, Building2, UserRound, X } from 'lucide-react';

const profileKey = 'tabletalkProfile';

export default function RoleStatus() {
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(profileKey) || 'null');
      if (saved) { setProfile(saved); setRole(saved.role); setName(saved.name || ''); setRestaurant(saved.restaurant || ''); }
    } catch { localStorage.removeItem(profileKey); }
  }, []);

  const openEditor = () => { setError(''); setPin(''); setRole(profile?.role || 'customer'); setName(profile?.name || ''); setRestaurant(profile?.restaurant || ''); setOpen(true); };
  const saveProfile = async (event) => {
    event.preventDefault(); setError('');
    const cleanName = name.trim().slice(0, 80);
    const cleanRestaurant = restaurant.trim().slice(0, 120);
    if (!cleanName) { setError('Please enter your name.'); return; }
    if (role === 'employee') {
      if (!cleanRestaurant) { setError('Please enter your restaurant name.'); return; }
      setBusy(true);
      try {
        const response = await fetch('/api/kitchen/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'We could not verify your employee access.');
        sessionStorage.setItem('kitchenPin', pin);
      } catch (e) { setError(e.message); setBusy(false); return; }
      setBusy(false);
    } else {
      sessionStorage.removeItem('kitchenPin');
    }
    const next = { role, name: cleanName, ...(role === 'employee' ? { restaurant: cleanRestaurant } : {}) };
    localStorage.setItem(profileKey, JSON.stringify(next)); setProfile(next); setOpen(false);
    window.dispatchEvent(new Event('tabletalk-profile-updated'));
  };
  const signOut = () => {
    localStorage.removeItem(profileKey); sessionStorage.removeItem('kitchenPin'); setProfile(null); setRole('customer'); setName(''); setRestaurant(''); setOpen(false);
    window.dispatchEvent(new Event('tabletalk-profile-updated'));
  };

  return <>
    <button onClick={openEditor} className="max-w-32 truncate rounded-full border border-orange-100 bg-[#fff8f2] px-2.5 py-2 text-xs font-semibold text-[#a95342] sm:max-w-56 sm:px-3 sm:text-sm" aria-label={profile?.role === 'employee' ? `Employee at ${profile.restaurant}. View or change login status.` : profile?.role === 'customer' ? `Customer profile for ${profile.name}. View or change login status.` : 'Choose customer or employee status'}>
      {profile?.role === 'employee' ? <><Building2 className="mr-1.5 inline" size={14}/><span className="hidden sm:inline">{profile.restaurant}</span><span className="sm:hidden">Staff</span></> : profile?.role === 'customer' ? <><UserRound className="mr-1.5 inline" size={14}/><span className="hidden sm:inline">{profile.name}</span><span className="sm:hidden">Customer</span></> : <><UserRound className="mr-1.5 inline" size={14}/><span className="hidden sm:inline">Choose status</span><span className="sm:hidden">Status</span></>}
    </button>
    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="profile-title" className="card w-full max-w-md p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><div className="text-xs font-bold uppercase tracking-[.16em] text-[#e47b62]">Your TableTalk profile</div><h2 id="profile-title" className="display mt-2 text-2xl font-semibold">How are you joining us?</h2></div><button onClick={() => setOpen(false)} aria-label="Close profile" className="rounded-full p-2 hover:bg-slate-100"><X size={18}/></button></div>
        <form onSubmit={saveProfile} className="mt-6 space-y-4">
          <fieldset><legend className="mb-2 text-sm font-semibold">I’m here as a</legend><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setRole('customer')} className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${role === 'customer' ? 'border-[#ff9b84] bg-[#fff3eb] text-[#c05b46]' : 'border-slate-200'}`}><UserRound className="mr-2 inline" size={16}/>Customer</button><button type="button" onClick={() => setRole('employee')} className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${role === 'employee' ? 'border-[#81d4c5] bg-[#eaf8f4] text-[#178675]' : 'border-slate-200'}`}><Building2 className="mr-2 inline" size={16}/>Employee</button></div></fieldset>
          <label className="block text-sm font-medium">Your name<input className="soft-input mt-1.5" autoComplete="name" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex"/></label>
          {role === 'employee' && <><label className="block text-sm font-medium">Restaurant name<input className="soft-input mt-1.5" autoComplete="organization" maxLength={120} required value={restaurant} onChange={(e) => setRestaurant(e.target.value)} placeholder="e.g. TableTalk Downtown"/></label><label className="block text-sm font-medium">Kitchen access PIN<input className="soft-input mt-1.5" type="password" inputMode="numeric" autoComplete="current-password" maxLength={40} required value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter your restaurant’s staff PIN"/></label><p className="-mt-2 text-xs leading-5 text-slate-500">Your restaurant name is shown on this device’s profile. The staff PIN is checked by the server.</p></>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="gradient-button w-full rounded-full py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Checking access…' : role === 'employee' ? 'Verify and continue' : 'Continue as customer'}</button>
        </form>
        {profile && <div className="mt-4 border-t pt-4"><div className="mb-2 flex items-center gap-2 text-xs text-slate-500"><BadgeCheck size={15} className="text-[#23a995]"/>Current status: {profile.role === 'employee' ? `Employee · ${profile.restaurant}` : 'Customer'}</div><button onClick={signOut} className="text-sm font-medium text-slate-500 underline underline-offset-2">Sign out</button></div>}
      </section>
    </div>}
  </>;
}
