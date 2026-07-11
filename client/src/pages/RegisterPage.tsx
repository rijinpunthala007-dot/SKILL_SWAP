import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import logoImg from '../assets/logo.svg';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const perks = [
  'AI-powered peer matching',
  'Live skill verification quizzes',
  'XP points & leaderboard',
  'Real-time chat & video calls',
];

export function RegisterPage() {
  const { register: registerUser, isRegistering } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = ({ name, email, password }: RegisterForm) => {
    registerUser({ name, email, password });
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0a0a20 0%, #0f0f30 50%, #0a0a20 100%)',
          borderRight: '1px solid rgba(99,102,241,0.1)',
        }}
      >
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none animate-pulse-slow"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none animate-pulse-slow"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)', animationDelay: '2s' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <img src={logoImg} alt="SkillSwap" className="w-9 h-9 object-contain" />
          <span className="text-lg font-bold text-gradient">SkillSwap</span>
        </div>

        {/* Content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight mb-3">
              Join a campus full<br />
              <span className="text-gradient">of skill sharers.</span>
            </h2>
            <p className="text-white/40 text-base leading-relaxed max-w-xs">
              Create your free account and start your first skill exchange today.
            </p>
          </div>

          {/* Perks list */}
          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <CheckCircle className="w-3 h-3 text-brand-400" />
                </div>
                <span className="text-white/60 text-sm">{perk}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="glass-card p-5 flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">15k+</p>
              <p className="text-xs text-white/30 uppercase tracking-wider mt-0.5">Students</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">500+</p>
              <p className="text-xs text-white/30 uppercase tracking-wider mt-0.5">Skills</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">Free</p>
              <p className="text-xs text-white/30 uppercase tracking-wider mt-0.5">Forever</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/20">© {new Date().getFullYear()} SkillSwap</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <img src={logoImg} alt="SkillSwap" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-gradient">SkillSwap</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2">Create your account</h1>
            <p className="text-white/40 text-sm">Free forever. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="register-form">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  {...register('name')}
                  type="text"
                  id="register-name"
                  placeholder="Alice Johnson"
                  className="input pl-11"
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1.5">⚠ {errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  id="register-email"
                  placeholder="alice@university.edu"
                  className="input pl-11"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="register-password"
                  placeholder="Minimum 8 characters"
                  className="input pl-11 pr-12"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  id="register-confirm-password"
                  placeholder="••••••••"
                  className="input pl-11"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1.5">⚠ {errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="register-submit"
              disabled={isRegistering}
              className="btn-primary w-full py-3.5 text-sm mt-2"
            >
              {isRegistering ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">Create free account <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-center text-white/35 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
