'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenCheck, CalendarDays, FilePlus2, GraduationCap, LogOut, Plus, Search, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';

type Assessment = { id: string; title: string; subject: string | null; created_at: string };

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const loadAssessments = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !userId) return;
    const { data, error } = await supabase.from('assessments').select('id,title,subject,created_at').eq('owner_id', userId).order('created_at', { ascending: false });
    if (error) setMessage(`Could not load assessments: ${error.message}`);
    else setAssessments(data ?? []);
  }, [userId]);

  useEffect(() => {
    let alive = true;
    async function init() {
      const supabase = createClient();
      if (!supabase) { router.replace('/signin'); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) { router.replace('/signin'); return; }
      setEmail(user.email ?? '');
      setUserId(user.id);
      const { data, error } = await supabase.from('assessments').select('id,title,subject,created_at').eq('owner_id', user.id).order('created_at', { ascending: false });
      if (!alive) return;
      if (error) setMessage(`Could not load assessments: ${error.message}`);
      else setAssessments(data ?? []);
      setLoading(false);
    }
    void init();
    return () => { alive = false; };
  }, [router]);

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !userId) return;
    const supabase = createClient();
    if (!supabase) return;
    setCreating(true); setMessage('');
    const { data, error } = await supabase.from('assessments').insert({ title: title.trim(), subject: subject.trim() || null, owner_id: userId }).select('id,title,subject,created_at').single();
    if (error) setMessage(`Could not create assessment: ${error.message}`);
    else if (data) { setAssessments(current => [data, ...current]); setTitle(''); setSubject(''); }
    setCreating(false);
  }

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.replace('/signin'); router.refresh();
  }

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Loading your workspace…</main>;
  const visible = assessments.filter(item => `${item.title} ${item.subject ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  return <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5"><Link href="/" className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white"><GraduationCap size={19}/></span>EduGrade <span className="text-indigo-600">AI</span></Link><div className="flex items-center gap-5"><span className="hidden text-sm text-slate-500 sm:block">{email}</span><button onClick={signOut} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"><LogOut size={16}/> Sign out</button></div></div></header>
    <section className="mx-auto max-w-6xl px-5 py-9 md:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-indigo-600">Educator workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Good to see you</h1><p className="mt-2 text-slate-500">Create an assessment and keep your classroom work organized.</p></div><a href="#new-assessment" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus size={17}/> New assessment</a></div>
      <div className="mt-8 grid gap-4 md:grid-cols-3"><article className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Assessments</p><p className="mt-3 text-3xl font-semibold">{assessments.length}</p><p className="mt-1 text-xs text-slate-400">Created in your workspace</p></article><article className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Submissions</p><p className="mt-3 text-3xl font-semibold">—</p><p className="mt-1 text-xs text-slate-400">Submission review will be available next</p></article><article className="rounded-xl border border-indigo-100 bg-indigo-50 p-5"><div className="flex items-center gap-2 text-sm font-medium text-indigo-800"><Sparkles size={16}/> Teacher-guided AI</div><p className="mt-3 text-sm leading-6 text-indigo-900/75">Assessment tools are being built around your rubrics and feedback workflow.</p></article></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Your assessments</h2><p className="mt-1 text-sm text-slate-500">Assessments you create are saved to Supabase.</p></div><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input aria-label="Search assessments" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assessments" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 sm:w-56"/></label></div>
          {message && <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>}
          {visible.length ? <div className="mt-5 divide-y divide-slate-100">{visible.map(item=><article key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><BookOpenCheck size={19}/></span><div className="min-w-0"><h3 className="truncate font-medium">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.subject || 'No subject'} · Created {new Date(item.created_at).toLocaleDateString()}</p></div></div><span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Draft</span></article>)}</div> : <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-500"><FilePlus2 size={20}/></span><h3 className="mt-4 font-semibold">{search ? 'No matching assessments' : 'No assessments yet'}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{search ? 'Try another search term.' : 'Create your first assessment to start organizing rubric-based work.'}</p>{!search && <a href="#new-assessment" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">Create assessment <Plus size={16}/></a>}</div>}
        </section>
        <aside id="new-assessment" className="h-fit rounded-xl border border-slate-200 bg-white p-5 md:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><FilePlus2 size={19}/></span><div><h2 className="font-semibold">New assessment</h2><p className="text-xs text-slate-500">Start with the basics</p></div></div><form onSubmit={createAssessment} className="mt-5 space-y-4"><label className="block text-sm font-medium">Assessment name<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Photosynthesis quiz" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"/></label><label className="block text-sm font-medium">Subject <span className="font-normal text-slate-400">(optional)</span><input maxLength={80} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Biology" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"/></label><button disabled={creating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"><Plus size={16}/>{creating ? 'Creating…' : 'Create assessment'}</button></form><p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><CalendarDays size={14}/>Saved to your account</p></aside>
      </div>
    </section>
  </main>;
}
