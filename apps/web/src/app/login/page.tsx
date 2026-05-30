'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, Lock, User, Phone, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration States
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${userId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('memories')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('memories')
      .getPublicUrl(data.path);
      
    return publicUrl;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Access established. Welcome back to the Loop.');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
      toast.error(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username || !fullName) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Sign up user via Supabase Auth with custom user metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase().trim(),
            full_name: fullName.trim(),
            phone: phone.trim(),
          }
        }
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('User creation failed.');
      }

      // 2. Upload avatar if selected (and we have active session/identity)
      let avatarUrl = '';
      if (avatarFile && data.user) {
        if (data.session) {
          try {
            avatarUrl = await uploadAvatar(avatarFile, data.user.id);
            
            // Update the public.users record with the avatar URL
            await supabase
              .from('users')
              .update({ avatar_url: avatarUrl })
              .eq('id', data.user.id);
          } catch (uploadErr) {
            console.error('Avatar upload failed but account was created:', uploadErr);
            toast.warning('Account created, but avatar upload failed.');
          }
        } else {
          console.log('Avatar upload deferred until email verification.');
          // We can't upload to storage without an active session. The user can upload it later via their Profile.
        }
      }

      // If user requires email confirmation
      if (data.session === null) {
        toast.success('Registration successful! Please check your email for confirmation.');
        setActiveTab('signin');
      } else {
        toast.success('Identity established. Welcome to the Loop!');
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cyber-dark px-4 py-12 relative overflow-hidden selection:bg-cyber-purple/20 selection:text-cyber-purple">
      {/* Premium Nostalgia Elements */}
      <div className="nostalgia-grain" />
      <div className="light-leak" />

      <div className="w-full max-w-xl space-y-8 cyber-glass p-8 sm:p-12 rounded-[3.5rem] border border-[#D4AF37]/30 relative z-10 shadow-2xl">
        
        {/* Brand Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center relative mb-8 h-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyber-purple via-cyber-pink to-orange-500 flex items-center justify-center shadow-2xl neon-glow-purple rotate-12 absolute animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-cyber-dark/80 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-inner relative z-10">
              <span className="text-3xl font-black italic tracking-tighter text-white select-none">L²</span>
            </div>
          </div>
          <h2 className="text-5xl font-black tracking-tight text-white mb-2">
            Legacy<span className="cyber-gradient-text">Loop</span>
          </h2>
          <p className="text-gray-400 font-bold tracking-widest uppercase text-[9px] tracking-[0.25em] mt-3">
            Secure Online Yearbook
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
              activeTab === 'signin' 
                ? "bg-cyber-purple text-cyber-dark shadow-lg neon-glow-purple" 
                : "text-gray-400 hover:text-white"
            )}
          >
            Log In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
              activeTab === 'signup' 
                ? "bg-cyber-purple text-cyber-dark shadow-lg neon-glow-purple" 
                : "text-gray-400 hover:text-white"
            )}
          >
            Create Account
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp} className="space-y-6">
          {error && (
            <div className="rounded-2xl bg-red-950/40 p-4 text-xs text-red-400 font-bold flex items-center gap-3 border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              {error}
            </div>
          )}

          {activeTab === 'signin' ? (
            /* Sign In Fields */
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 py-4 text-white placeholder-gray-500 focus:bg-cyber-dark/40 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/10 transition-all outline-none font-semibold text-sm"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 py-4 text-white placeholder-gray-500 focus:bg-cyber-dark/40 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/10 transition-all outline-none font-semibold text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Sign Up Fields */
            <div className="space-y-5">
              {/* Optional Avatar Picker */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group shadow-inner"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                      <Upload size={20} className="mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Add Photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Grid Layout for details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 py-4 text-white placeholder-gray-500 focus:bg-cyber-dark/40 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/10 transition-all outline-none font-semibold text-sm"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
                      <span className="font-bold text-xs">@</span>
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 py-4 text-white placeholder-gray-500 focus:bg-cyber-dark/40 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/10 transition-all outline-none font-semibold text-sm"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 py-4 text-white placeholder-gray-500 focus:bg-cyber-dark/40 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/10 transition-all outline-none font-semibold text-sm"
                      placeholder="name@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 py-4 text-white placeholder-gray-500 focus:bg-cyber-dark/40 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/10 transition-all outline-none font-semibold text-sm"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 py-4 text-white placeholder-gray-500 focus:bg-cyber-dark/40 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/10 transition-all outline-none font-semibold text-sm"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center items-center gap-3 rounded-2xl bg-gradient-to-r from-cyber-purple to-cyber-pink py-5 text-sm font-black text-cyber-dark hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyber-purple/20 neon-glow-purple cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>{activeTab === 'signin' ? 'Log In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Legal and Powered details */}
        <div className="text-center space-y-4 pt-4 border-t border-white/5">
          <div className="flex justify-center gap-6 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-cyber-pink transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-cyber-purple transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Legal Info</a>
          </div>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.25em]">
            Powered by LegacyLoop • Established 2026
          </p>
        </div>
      </div>
    </div>
  );
}
