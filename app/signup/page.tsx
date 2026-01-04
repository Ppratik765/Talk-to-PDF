'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg('Success! Please check your email for the confirmation link.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900 p-8 border border-zinc-800 shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-white mb-6">Create Account</h2>
        {msg && (
          <div className={`p-4 mb-4 text-sm ${msg.includes('Success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {msg}
          </div>
        )}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-white focus:border-blue-500 outline-none" />
          </div>
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 font-semibold mt-4 disabled:opacity-50">
            {loading ? 'Sending OTP...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center text-zinc-500 text-sm">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Log in</Link>
        </div>
      </motion.div>
    </div>
  );
}