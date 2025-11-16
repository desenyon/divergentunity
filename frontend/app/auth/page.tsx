'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, LogIn } from 'lucide-react';

export default function AuthPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !loading) {
      // Redirect to home after successful sign-in
      setIsAnimating(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsAnimating(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign-in error:', error);
      setError('Failed to sign in. Please try again.');
      setIsAnimating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 border-4 border-gray-800 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Convergence Animation Overlay */}
      {isAnimating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black convergence-overlay">
          <div className="convergence-line convergence-top"></div>
          <div className="convergence-line convergence-right"></div>
          <div className="convergence-line convergence-bottom"></div>
          <div className="convergence-line convergence-left"></div>
          <div className="convergence-circle"></div>
          <div className="relative z-10 text-center">
            <div className="quantum-loader mb-6"></div>
            <h2 className="text-4xl font-black text-white animate-pulse">AUTHENTICATING</h2>
          </div>
        </div>
      )}

      {/* Background particles */}
      <div className="particle particle-1"></div>
      <div className="particle particle-2"></div>
      <div className="particle particle-3"></div>
      <div className="particle particle-4"></div>
      <div className="particle particle-5"></div>
      <div className="particle particle-6"></div>

      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-md w-full">
          {/* Logo and Title */}
          <div className="text-center mb-12 animate-fade-slide-up">
            <div className="inline-block mb-6 relative">
              <div className="absolute inset-0 blur-3xl bg-purple-500/30 animate-pulse"></div>
              <Sparkles className="w-20 h-20 text-white relative z-10 animate-breathe" />
            </div>
            <h1 className="text-6xl font-black mb-4 animate-slide-up">
              <span className="text-white">Divergent</span>
              <span className="text-white/80">Unity</span>
            </h1>
            <p className="text-xl text-gray-400 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Transform debates into understanding
            </p>
          </div>

          {/* Sign In Card */}
          <div className="gradient-border animate-scale-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-black rounded-[10px] p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Welcome</h2>
              
              <p className="text-gray-400 text-center mb-8">
                Sign in to access AI-powered debate analysis and find common ground in any conversation.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isAnimating}
                className="w-full group relative overflow-hidden"
              >
                <div className="gradient-border-fast">
                  <div className="bg-white hover:bg-gray-100 text-black font-bold py-4 px-6 rounded-[10px] transition-all flex items-center justify-center gap-3 group-hover:scale-[1.02]">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </div>
                </div>
              </button>

              {/* Features */}
              <div className="mt-8 pt-8 border-t border-gray-800">
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    <span>Real-time AI insights powered by Gemini</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span>Multi-participant debate analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span>Consensus-building tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                    <span>Save and track your debates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-8 animate-fade-slide-up" style={{ animationDelay: '0.4s' }}>
            By signing in, you agree to our terms and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
