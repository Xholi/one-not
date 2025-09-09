'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [email, setEmail] = useState('user1@demo.dev');
  const [password, setPassword] = useState('password123');
  const [displayName, setDisplay] = useState('Demo 1');
  const [mode, setMode] = useState('login');
  const router = useRouter();

  async function submit() {
    const url = mode === 'login' ? '/auth/login' : '/auth/register';
    const payload = mode === 'login' ? { email, password } : { email, password, displayName, age: 21 };
    const res = await api.post(url, payload);
    saveToken(res.data.token);
    router.push('/home');
  }

  return (
    <div className="card" style={{maxWidth:600, margin:'2rem auto'}}>
      <h1 style={{fontSize:24, fontWeight:700}}>Hook-Up App</h1>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button onClick={()=>setMode('login')} className="btn">Login</button>
        <button onClick={()=>setMode('register')} className="btn">Register</button>
      </div>
      <div style={{marginTop:12}}>
        <input className="border p-2 rounded w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
        <input type="password" className="border p-2 rounded w-full" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={{marginTop:8}}/>
        {mode==='register' && (<input className="border p-2 rounded w-full" value={displayName} onChange={e=>setDisplay(e.target.value)} placeholder="Display name" style={{marginTop:8}}/>)}
        <button className="btn" onClick={submit} style={{marginTop:12}}> {mode==='login'?'Sign in':'Create account'}</button>
      </div>
    </div>
  );
}
