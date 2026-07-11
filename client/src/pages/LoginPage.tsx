import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.svg';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => login(data);

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0a0a20 0%, #0f0f30 50%, #0a0a20 100%)',
          borderRight: '1px solid rgba(99,102,241,0.1)',
        }}
      >
        {/* Orb decorations */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none animate-pulse-slow"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none animate-pulse-slow"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)', animationDelay: '2s' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <img src={logoImg} alt="SkillSwap" className="w-9 h-9 object-contain" />
          <span className="text-lg font-bold text-gradient">SkillSwap</span>
        </div>

        {/* Quote */}
        <div className="relative space-y-6">
          <h2 className="text-4xl font-extrabold leading-tight">
            Learn from peers.<br />
            <span className="text-gradient">Teach what you love.</span>
          </h2>
          <p className="text-white/40 text-base leading-relaxed max-w-xs">
            The campus knowledge exchange where every student is both a teacher and a learner.
          </p>

          {/* Testimonial card */}
          <div className="glass-card p-5 max-w-xs">
            <p className="text-white/70 text-sm italic leading-relaxed">
              "Learned React from a classmate in exchange for teaching them Figma. Best deal ever."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >A</div>
              <div>
                <p className="text-white text-xs font-semibold">Aisha K.</p>
                <p className="text-white/30 text-xs">CS Junior, IIT Delhi</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/20">© {new Date().getFullYear()} SkillSwap</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle bg glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <img src={logoImg} alt="SkillSwap" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-gradient">SkillSwap</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2">Welcome back</h1>
            <p className="text-white/40 text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  id="login-email"
                  placeholder="you@university.edu"
                  className="input pl-11"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="••••••••"
                  className="input pl-11 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">⚠ {errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={isLoggingIn}
              className="btn-primary w-full py-3.5 text-sm mt-2"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">Sign in <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-center text-white/35 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
