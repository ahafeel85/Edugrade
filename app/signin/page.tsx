'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const supabase = createClient();
    if (!supabase) {
      setMessage('Supabase is not configured. Check the values in .env.local and restart the app.');
      setBusy(false);
      return;
    }

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setBusy(false);
        return;
      }
      router.push('/dashboard');
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
    } else if (!data.session) {
      setMessage('Account created. Check your email for the confirmation link, then sign in.');
      setMode('signin');
    } else {
      router.push('/dashboard');
      router.refresh();
      return;
    }
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"><ArrowLeft size={16}/> Back to home</Link>
        <div className="mb-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><GraduationCap size={21}/></span><span className="font-bold">EduGrade <span className="text-indigo-600">AI</span></span></div>
        <h1 className="text-2xl font-semibold">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-2 text-sm text-slate-500">{mode === 'signin' ? 'Sign in to continue to your educator workspace.' : 'Create an educator account to get started.'}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="you@school.edu"/></label>
          <label className="block text-sm font-medium text-slate-700">Password<input type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="At least 6 characters"/></label>
          {message && <p role="status" className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">{message}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">{mode === 'signin' ? 'New to EduGrade AI?' : 'Already have an account?'}{' '}<button onClick={()=>{setMode(mode === 'signin' ? 'signup' : 'signin');setMessage('');}} className="font-semibold text-indigo-600 hover:underline">{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>
      </section>
    </main>
  );
}
