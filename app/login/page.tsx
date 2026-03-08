"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase";
import { WaitingRobot } from "@/components/illustrations";
import { SignovaLogo } from "@/components/SignovaLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect');
  const errorParam = searchParams?.get('error');

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push("/contracts");
        }
      }
    };
    checkSession();
  }, [router, redirectUrl]);

  const checkOnboardingAndRedirect = async (userId: string | undefined) => {
    try {
      if (redirectUrl) {
        router.replace(redirectUrl);
        return;
      }
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', userId)
        .single();
      
      const redirectPath = profile?.onboarding_complete ? "/contracts" : "/onboarding";
      router.replace(redirectPath);
    } catch (err) {
      console.error("Redirect error:", err);
      router.replace(redirectUrl || "/onboarding");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        // Sign in
        const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;

        setSuccess("Login successful! Redirecting...");
        
        // Wait for session to be established
        setTimeout(() => {
          checkOnboardingAndRedirect(data.user?.id);
        }, 800);
      } else {
        // Sign up
        const { data, error: signUpError } = await supabaseClient.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) throw signUpError;

        if (data.user?.identities?.length === 0) {
          setError("An account with this email already exists. Please sign in.");
        } else if (data.session) {
          // If email confirmation is disabled in Supabase, session is returned immediately
          setSuccess("Account created successfully! Redirecting...");
          // Notify owner
          fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, event: 'signup' }) }).catch(() => {});
          setTimeout(() => {
            checkOnboardingAndRedirect(data.user?.id);
          }, 800);
        } else {
          // Normal flow where email confirmation is required
          setShowVerifyModal(true);
          // Notify owner
          fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, event: 'signup' }) }).catch(() => {});
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* Header */}
      <header className="px-6 py-6">
        <Link href="/" className="inline-block">
          <SignovaLogo size={32} textClassName="text-2xl text-[#1a1714]" />
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Robot illustration */}
          <div className="flex justify-center mb-6">
            <WaitingRobot size={80} />
          </div>

          {/* Toggle */}
          <div className="flex p-1 bg-white rounded-xl border border-[#ddd5c8] mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isLogin 
                  ? "bg-[#1a1714] text-[#f5f0e8]" 
                  : "text-[#7a7168] hover:text-[#1a1714]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                !isLogin 
                  ? "bg-[#1a1714] text-[#f5f0e8]" 
                  : "text-[#7a7168] hover:text-[#1a1714]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-[#7a7168] text-sm">
              {isLogin 
                ? "Sign in to access your contracts" 
                : "Start analyzing contracts in seconds"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a7168]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[#ddd5c8] rounded-xl focus:outline-none focus:border-[#c8873a] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a7168]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-white border border-[#ddd5c8] rounded-xl focus:outline-none focus:border-[#c8873a] transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7168] hover:text-[#1a1714]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign up only) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a7168]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#ddd5c8] rounded-xl focus:outline-none focus:border-[#c8873a] transition-colors"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1a1714] text-[#f5f0e8] rounded-xl font-medium hover:bg-[#2e2a26] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Forgot Password */}
          {isLogin && (
            <div className="text-center mt-6">
              <a href="#" className="text-sm text-[#7a7168] hover:text-[#1a1714]">
                Forgot your password?
              </a>
            </div>
          )}

          {/* Terms */}
          {!isLogin && (
            <p className="text-xs text-[#7a7168] text-center mt-6">
              By creating an account, you agree to our{" "}
              <a href="/terms" className="text-[#1a1714] hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="text-[#1a1714] hover:underline">Privacy Policy</a>.
            </p>
          )}
        </motion.div>
      </div>

      {/* Verify Email Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center border border-[#ddd5c8]"
          >
            <div className="w-12 h-12 bg-[#f5f0e8] text-[#c8873a] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-[#1a1714] mb-2">Check your email</h3>
            <p className="text-[#7a7168] text-sm mb-6">
              We've sent a verification link to <span className="font-medium text-[#1a1714]">{formData.email}</span>. Please click the link to verify your account.
            </p>
            <button
              onClick={() => {
                setShowVerifyModal(false);
                setIsLogin(true);
                setFormData({ ...formData, password: "", confirmPassword: "" });
              }}
              className="w-full py-3 bg-[#1a1714] text-[#f5f0e8] rounded-xl font-medium hover:bg-[#2e2a26] transition-all"
            >
              Back to Sign In
            </button>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center">
        <Link href="/" className="text-sm text-[#7a7168] hover:text-[#1a1714]">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
