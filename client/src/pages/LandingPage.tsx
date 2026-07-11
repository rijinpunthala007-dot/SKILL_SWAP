import { Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, Award, ArrowRight, Star, Zap, Users, Trophy } from 'lucide-react';
import logoImg from '../assets/logo.svg';

const stats = [
  { value: '15k+', label: 'Swaps Completed' },
  { value: '99%',  label: 'Match Accuracy'  },
  { value: '4.8★', label: 'User Rating'     },
];

const steps = [
  {
    step: '01',
    title: 'Post Your Skills',
    desc: 'Add what you excel at — like React or Figma — and what you want to learn, like Python or UX Writing.',
    icon: ShieldCheck,
    accent: '#818cf8',
    glow: 'rgba(99,102,241,0.15)',
  },
  {
    step: '02',
    title: 'AI Semantic Match',
    desc: 'Our similarity engine connects you to the perfect peer — even with spelling variants or synonyms.',
    icon: MessageSquare,
    accent: '#a78bfa',
    glow: 'rgba(139,92,246,0.15)',
  },
  {
    step: '03',
    title: 'Meet & Get Verified',
    desc: 'Chat in real-time, launch video sessions, earn XP, and unlock verified skill badges on your profile.',
    icon: Award,
    accent: '#34d399',
    glow: 'rgba(16,185,129,0.15)',
  },
];

const features = [
  { icon: Zap,      label: 'Live Quizzes',        desc: 'Verify skills with AI-generated MCQs' },
  { icon: Users,    label: 'Smart Matching',       desc: 'Semantic engine finds your ideal peer' },
  { icon: Trophy,   label: 'Leaderboard & XP',    desc: 'Earn points, climb ranks, win streaks' },
  { icon: ShieldCheck, label: 'Verified Badges',  desc: 'Credentialed proof of your expertise'  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Navbar ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(7, 7, 20, 0.8)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="SkillSwap" className="w-9 h-9 object-contain" />
          <span className="text-lg font-bold text-gradient">SkillSwap</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            Login
          </Link>
          <Link to="/register" className="btn-primary text-sm px-5 py-2">
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-28 overflow-hidden">

        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
          <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)', animationDelay: '1.5s' }} />
          <div className="absolute top-40 right-10 w-60 h-60 rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)', animationDelay: '3s' }} />
        </div>

        {/* Pill badge */}
        <div className="animate-fade-in mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#a5b4fc',
          }}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          AI-Powered Peer Skill Exchange Platform
        </div>

        {/* Headline */}
        <h1 className="animate-slide-up max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
          style={{ animationDelay: '0.05s' }}
        >
          Swap Skills.{' '}
          <span className="text-gradient">Grow Together.</span>
          <br />
          <span className="text-white/30 text-4xl md:text-5xl font-semibold">No cost. No classrooms.</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-slide-up max-w-xl text-lg text-white/50 leading-relaxed mb-10"
          style={{ animationDelay: '0.1s' }}
        >
          SkillSwap connects college students to teach what they excel at and learn what they need — powered by AI semantic matching and verified credentials.
        </p>

        {/* CTAs */}
        <div className="animate-slide-up flex flex-col sm:flex-row gap-4 mb-16" style={{ animationDelay: '0.15s' }}>
          <Link to="/register" className="btn-primary px-8 py-3.5 text-sm">
            Start Swapping Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="btn-secondary px-8 py-3.5 text-sm">
            Student Login
          </Link>
        </div>

        {/* Stats strip */}
        <div className="animate-fade-in flex items-center gap-10 md:gap-16" style={{ animationDelay: '0.25s' }}>
          {stats.map(({ value, label }, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-extrabold text-white">{value}</p>
              <p className="text-xs text-white/35 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6"
        style={{ borderTop: '1px solid rgba(99,102,241,0.08)', background: 'rgba(255,255,255,0.01)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">How it Works</p>
            <h2 className="text-4xl font-extrabold">Three steps to your first swap</h2>
            <p className="text-white/40 mt-3 text-base max-w-md mx-auto">
              From signup to verified skill badge in less than a day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ step, title, desc, icon: Icon, accent, glow }) => (
              <div key={step} className="glass-card p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                {/* Glow bg */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 30% 30%, ${glow} 0%, transparent 70%)` }} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <span className="text-5xl font-black" style={{ color: `${accent}20` }}>{step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Platform Features</p>
            <h2 className="text-4xl font-extrabold">Everything you need to grow</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card p-6 text-center group hover:-translate-y-1 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <p className="font-bold text-white text-sm mb-1">{label}</p>
                <p className="text-white/35 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(124,58,237,0.12) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 60%)' }} />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to start swapping?</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">Join thousands of students already building skills together — for free.</p>
            <Link to="/register" className="btn-primary px-10 py-3.5 text-sm">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="px-6 py-8 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="SkillSwap" className="w-6 h-6 object-contain opacity-70" />
            <span className="text-sm text-white/30 font-medium">SkillSwap</span>
          </div>
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} SkillSwap · Built for Student Viva Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}
