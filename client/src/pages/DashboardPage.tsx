import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageSquare, Bell, ArrowRight, Sparkles, Award, Flame, CheckCircle } from 'lucide-react';
import { requestsApi, conversationsApi, usersApi } from '../services/api.service';
import { useAuthStore } from '../store/authStore';
import { UserCardSkeleton, ConversationSkeleton } from '../components/ui/Skeletons';
import { UserCard } from '../components/profile/UserCard';
import { formatDistanceToNow } from 'date-fns';
import { QuizModal } from '../components/quiz/QuizModal';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedQuizSkill, setSelectedQuizSkill] = useState<string | null>(null);

  const { data: profileData } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => usersApi.getMe(),
  });
  const fullProfile = profileData?.data?.data;

  const { data: incomingData, isLoading: loadingRequests } = useQuery({
    queryKey: ['requests', 'incoming'],
    queryFn: () => requestsApi.getIncoming(),
  });

  const { data: conversationsData, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getAll(),
  });

  const { data: matchesData, isLoading: loadingMatches } = useQuery({
    queryKey: ['matches'],
    queryFn: () => usersApi.getMatches(),
  });

  const pendingRequests = incomingData?.data?.data?.filter((r) => r.status === 'pending') ?? [];
  const conversations = conversationsData?.data?.data ?? [];
  const topMatches = matchesData?.data?.data?.slice(0, 3) ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          {greeting},{' '}
          <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/50 mt-1">Here's what's happening with your skill exchanges.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Bell,
            label: 'Pending Requests',
            value: pendingRequests.length,
            color: 'text-brand-400',
            bg: 'bg-brand-500/10 border-brand-500/20',
          },
          {
            icon: MessageSquare,
            label: 'Active Chats',
            value: conversations.length,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
          },
          {
            icon: Award,
            label: 'XP Points Earned',
            value: fullProfile?.points ?? 0,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
          {
            icon: Flame,
            label: 'Daily Streak',
            value: `${fullProfile?.streakCount ?? 0} Days`,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10 border-rose-500/20',
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`glass-card p-4 border ${bg}`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/50">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Pending Requests
            </h2>
            <Link to="/requests" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingRequests ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <UserCardSkeleton key={i} />)}
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Bell className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No pending requests</p>
              <Link to="/discover" className="text-brand-400 text-sm hover:underline mt-2 inline-block">
                Discover peers →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <div key={req._id} className="glass-card p-4 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {req.fromUser.avatar ? (
                      <img src={req.fromUser.avatar} alt={req.fromUser.name} className="w-10 h-10 avatar" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center font-bold text-sm">
                        {req.fromUser.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{req.fromUser.name}</p>
                      <p className="text-xs text-white/40 truncate">
                        Wants to exchange: <span className="text-brand-300">{req.matchedSkill}</span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Link to="/requests" className="btn-primary text-xs px-3 py-1.5">
                        Respond
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Conversations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-400" />
              Recent Chats
            </h2>
            <Link to="/chats" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingConvs ? (
            <ConversationSkeleton />
          ) : conversations.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No conversations yet</p>
              <p className="text-white/25 text-xs mt-1">Accept a request to start chatting</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.slice(0, 4).map((conv) => {
                const other = conv.participants.find((p) => String(p._id) !== String(user?.id));
                return (
                  <Link
                    key={conv._id}
                    to={`/chats/${conv._id}`}
                    className="glass-card p-4 flex items-center gap-3 hover:border-brand-500/30 transition-all duration-200 block"
                  >
                    {other?.avatar ? (
                      <img src={other.avatar} alt={other.name} className="w-10 h-10 avatar flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {other?.name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white text-sm">{other?.name}</p>
                        {conv.lastMessageAt && (
                          <p className="text-xs text-white/30">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate">{conv.lastMessage ?? 'No messages yet'}</p>
                    </div>
                    {(conv.unreadCount ?? 0) > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Top Matches */}
      {(loadingMatches || topMatches.length > 0) && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Your Top Matches
            </h2>
            <Link to="/discover" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingMatches ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <UserCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {topMatches.map((scored) => (
                <UserCard key={scored.user._id} scoredUser={scored} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Skill Verification Quizzes */}
      {fullProfile && fullProfile.skillsOffered.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-400" />
            Verify Your Skills
          </h2>
          <div className="glass-card p-6">
            <p className="text-white/60 text-sm mb-4">
              Pass a quick MCQ quiz on your offered skills to display a verified badge 🏅 on your profile and earn +50 XP points!
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {fullProfile.skillsOffered.map((skill) => {
                const isVerified = fullProfile.verifiedSkills?.some(
                  (vs) => vs.skillName.toLowerCase() === skill.skillName.toLowerCase()
                );
                return (
                  <div key={skill.skillName} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{skill.skillName}</p>
                      <p className="text-xs text-white/40">{skill.proficiency} Level</p>
                    </div>
                    {isVerified ? (
                      <span className="badge badge-success flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedQuizSkill(skill.skillName)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Take Quiz
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Quiz Modal */}
      {selectedQuizSkill && (
        <QuizModal
          skillName={selectedQuizSkill}
          isOpen={!!selectedQuizSkill}
          onClose={() => setSelectedQuizSkill(null)}
        />
      )}
    </div>
  );
}
