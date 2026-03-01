"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RobotWaiting } from "@/components/illustrations";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

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

      // TODO: Integrate Supabase Auth
      // Temporary mock success
      setTimeout(() => {
        setSuccess(isLogin ? "Login successful!" : "Account created!");
        setIsLoading(false);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/contracts");
        }, 1500);
      }, 1500);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* Header */}
      <header className="px-6 py-6">
        <Link href="/" className="text-2xl font-serif text-[#1a1714]">
          Signova
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
            <RobotWaiting width={80} height={80} />
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
                    required
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
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
              <a href="#" className="text-[#1a1714] hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-[#1a1714] hover:underline">Privacy Policy</a>.
            </p>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <Link href="/" className="text-sm text-[#7a7168] hover:text-[#1a1714]">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
