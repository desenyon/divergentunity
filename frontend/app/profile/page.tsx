'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  User, LogOut, MessageCircle, TrendingUp, Calendar, 
  Settings, ArrowLeft, Sparkles, Award, Target
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Sign-out error:', error);
      setIsSigningOut(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 border-4 border-gray-800 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 backdrop-blur-lg bg-black/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative">
                <Sparkles className="w-7 h-7 text-white" />
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
              </div>
              <h1 className="text-xl font-black tracking-tight">
                <span className="text-white">Divergent</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Unity</span>
              </h1>
            </Link>
            <div></div>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Profile Card */}
        <div className="gradient-border mb-12 animate-slide-up">
          <div className="bg-black rounded-[10px] p-8">
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                {user.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover border-4 border-white/10"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-black">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-black text-white mb-2">
                  {user.displayName || 'Anonymous User'}
                </h2>
                <p className="text-gray-400 mb-4">{user.email}</p>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-sm font-semibold text-teal-400">
                    Verified
                  </div>
                  <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm font-semibold text-blue-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Joined {new Date(user.metadata.creationTime || '').toLocaleDateString()}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="gradient-border p-0.5 group"
              >
                <div className="px-4 py-2 rounded-[10px] bg-black group-hover:bg-gray-900 transition-all flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="font-semibold">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="gradient-border-slow animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-black rounded-[10px] p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageCircle className="w-8 h-8 text-emerald-400" />
                <span className="text-3xl font-black text-white">0</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400">Total Debates</h3>
            </div>
          </div>

          <div className="gradient-border-slow animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-black rounded-[10px] p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-blue-400" />
                <span className="text-3xl font-black text-white">0%</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400">Avg Consensus</h3>
            </div>
          </div>

          <div className="gradient-border-slow animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-black rounded-[10px] p-6">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-8 h-8 text-green-400" />
                <span className="text-3xl font-black text-white">0</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-400">Insights Generated</h3>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="gradient-border animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="bg-black rounded-[10px] p-8">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6" />
              Recent Debates
            </h3>
            
            <div className="text-center py-20">
              <MessageCircle className="w-20 h-20 text-gray-600 mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="text-gray-400 text-lg mb-2">No debates yet</p>
              <p className="text-gray-500 text-sm mb-6">Start your first debate to see it here</p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 hover:scale-105 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Start a Debate
              </Link>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="gradient-border mt-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="bg-black rounded-[10px] p-8">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Settings className="w-6 h-6" />
              Preferences
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1">Email Notifications</h4>
                    <p className="text-sm text-gray-400">Receive updates about your debates</p>
                  </div>
                  <label className="relative inline-block w-12 h-6 cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1">Auto-Moderation</h4>
                    <p className="text-sm text-gray-400">AI suggests next steps during debates</p>
                  </div>
                  <label className="relative inline-block w-12 h-6 cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1">Save Debate History</h4>
                    <p className="text-sm text-gray-400">Store your debates for future reference</p>
                  </div>
                  <label className="relative inline-block w-12 h-6 cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
