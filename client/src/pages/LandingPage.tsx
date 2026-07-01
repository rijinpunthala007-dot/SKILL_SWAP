import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, MessageSquare, Award, ArrowRight, Star } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen text-white bg-slate-950 overflow-x-hidden flex flex-col font-sans">
      
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient">SkillSwap</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-white/60 hover:text-white text-sm font-medium transition-colors">
            Login
          </Link>
          <Link to="/register" className="btn-primary text-xs px-4 py-2">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative max-w-4xl mx-auto space-y-8">
        
        {/* Glow effect background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-500/20 blur-3xl -z-10" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-300">
          <Star className="w-3.5 h-3.5 fill-current" />
          Semantic Matching & Verified Badges Active
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Swap Skills, Grow Together.<br />
          <span className="text-gradient">No cost. No classrooms.</span>
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed">
          SkillSwap is a peer-to-peer knowledge exchange platform for college campus students. Teach what you excel in, and learn what you want from your peers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/register" className="btn-primary px-8 py-3.5 text-sm flex items-center gap-2 shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform">
            Get Started Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="btn-secondary px-8 py-3.5 text-sm hover:bg-white/10 transition-all">
            Student Login
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-6 md:gap-12 pt-12 w-full max-w-xl text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">15k+</p>
            <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Swaps Completed</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">99%</p>
            <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Match Accuracy</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">4.8★</p>
            <p className="text-xs text-white/40 uppercase tracking-wider mt-1">User Rating</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-900/50 border-y border-white/5 py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">How SkillSwap Works</h2>
            <p className="text-white/50 text-sm max-w-md mx-auto">Start exchanging knowledge and earning badges in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Post Your Skills',
                desc: 'Add what you are good at (like React, Figma) and what you want to learn (like Python or UX writing).',
                icon: ShieldCheck,
                color: 'text-indigo-400',
              },
              {
                step: '02',
                title: 'Get AI Semantic Match',
                desc: 'Our similarity matcher connects you to peers based on overlapping needs, even with spelling variants.',
                icon: MessageSquare,
                color: 'text-violet-400',
              },
              {
                step: '03',
                title: 'Meet & Learn',
                desc: 'Accept matches, chat in real-time, launch video sessions, and endorse each other to earn verified credentials.',
                icon: Award,
                color: 'text-emerald-400',
              },
            ].map(({ step, title, desc, icon: Icon, color }) => (
              <div key={step} className="glass-card p-6 relative flex flex-col hover:border-brand-500/20 transition-all group">
                <span className={`text-4xl font-extrabold opacity-10 absolute right-6 top-6 ${color}`}>{step}</span>
                <Icon className={`w-8 h-8 ${color} mb-4`} />
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/5 text-center text-xs text-white/30 bg-slate-950 mt-auto">
        &copy; {new Date().getFullYear()} SkillSwap. Built for Student Viva Hackathon.
      </footer>

    </div>
  );
}
