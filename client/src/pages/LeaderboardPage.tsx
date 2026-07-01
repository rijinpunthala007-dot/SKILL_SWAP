import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../services/api.service';
import { Trophy, Flame, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', page],
    queryFn: () => leaderboardApi.getLeaderboard({ page, limit }),
  });

  const users = data?.data?.data?.users ?? [];
  const total = data?.data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Divide users into podium (top 3) and list (rest) only on page 1
  const showPodium = page === 1;
  const podiumUsers = showPodium ? users.slice(0, 3) : [];
  const listUsers = showPodium ? users.slice(3) : users;

  const getPodiumStyle = (index: number) => {
    switch (index) {
      case 0: // 1st
        return {
          border: 'border-amber-400/50',
          shadow: 'shadow-amber-500/10 hover:shadow-amber-500/20',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-400',
          label: '1st',
        };
      case 1: // 2nd
        return {
          border: 'border-slate-300/50',
          shadow: 'shadow-slate-300/10 hover:shadow-slate-300/20',
          text: 'text-slate-300',
          badgeBg: 'bg-slate-300',
          label: '2nd',
        };
      case 2: // 3rd
        return {
          border: 'border-amber-700/50',
          shadow: 'shadow-amber-700/10 hover:shadow-amber-700/20',
          text: 'text-amber-700',
          badgeBg: 'bg-amber-700',
          label: '3rd',
        };
      default:
        return {};
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-bounce" />
        <h1 className="text-3xl font-bold text-white">Global Leaderboard</h1>
        <p className="text-white/50 mt-1">Celebrate top learners, experts, and peer mentors on SkillSwap</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Podium (Top 3 Users) */}
          {showPodium && podiumUsers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* 2nd Place */}
              {podiumUsers[1] && (() => {
                const style = getPodiumStyle(1);
                return (
                  <div className={`glass-card p-5 border text-center transition-all duration-300 ${style.border} ${style.shadow} md:order-1 order-2 md:h-52 flex flex-col justify-center`}>
                    <div className="relative mx-auto mb-3">
                      <img src={podiumUsers[1].avatar} alt={podiumUsers[1].name} className="w-16 h-16 avatar ring-2 ring-slate-300/30" />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs font-bold flex items-center justify-center">2</span>
                    </div>
                    <Link to={`/profile/${podiumUsers[1]._id}`} className="font-semibold text-white hover:text-slate-300 block truncate text-base">{podiumUsers[1].name}</Link>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{podiumUsers[1].bio || 'No bio yet'}</p>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-slate-300 font-bold text-sm">
                      <Star className="w-4 h-4 fill-current text-slate-300" />
                      {podiumUsers[1].points} XP
                    </div>
                  </div>
                );
              })()}

              {/* 1st Place */}
              {podiumUsers[0] && (() => {
                const style = getPodiumStyle(0);
                return (
                  <div className={`glass-card p-6 border text-center transition-all duration-300 ${style.border} ${style.shadow} md:order-2 order-1 md:h-60 flex flex-col justify-center scale-105 relative`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
                      Top Learner
                    </div>
                    <div className="relative mx-auto mb-3">
                      <img src={podiumUsers[0].avatar} alt={podiumUsers[0].name} className="w-20 h-20 avatar ring-4 ring-amber-400/40" />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-bold flex items-center justify-center">1</span>
                    </div>
                    <Link to={`/profile/${podiumUsers[0]._id}`} className="font-bold text-white hover:text-amber-300 block truncate text-lg">{podiumUsers[0].name}</Link>
                    <p className="text-xs text-amber-200/60 mt-0.5 truncate">{podiumUsers[0].bio || 'No bio yet'}</p>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-amber-400 font-bold text-base">
                      <Star className="w-5 h-5 fill-current text-amber-400" />
                      {podiumUsers[0].points} XP
                    </div>
                  </div>
                );
              })()}

              {/* 3rd Place */}
              {podiumUsers[2] && (() => {
                const style = getPodiumStyle(2);
                return (
                  <div className={`glass-card p-5 border text-center transition-all duration-300 ${style.border} ${style.shadow} md:order-3 order-3 md:h-48 flex flex-col justify-center`}>
                    <div className="relative mx-auto mb-3">
                      <img src={podiumUsers[2].avatar} alt={podiumUsers[2].name} className="w-14 h-14 avatar ring-2 ring-amber-700/30" />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-bold flex items-center justify-center">3</span>
                    </div>
                    <Link to={`/profile/${podiumUsers[2]._id}`} className="font-semibold text-white hover:text-amber-700 block truncate text-base">{podiumUsers[2].name}</Link>
                    <p className="text-xs text-amber-800/60 mt-0.5 truncate">{podiumUsers[2].bio || 'No bio yet'}</p>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-amber-600 font-bold text-sm">
                      <Star className="w-4 h-4 fill-current text-amber-600" />
                      {podiumUsers[2].points} XP
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* List Table */}
          {listUsers.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="divide-y divide-white/5">
                {listUsers.map((user, idx) => {
                  const rank = showPodium ? idx + 4 : (page - 1) * limit + idx + 1;
                  return (
                    <div key={user._id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-6 text-center font-bold text-white/40 text-sm">{rank}</span>
                        <Link to={`/profile/${user._id}`}>
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 avatar flex-shrink-0" />
                        </Link>
                        <div className="min-w-0">
                          <Link to={`/profile/${user._id}`} className="font-medium text-white hover:text-brand-300 block truncate text-sm">
                            {user.name}
                          </Link>
                          {user.bio && (
                            <p className="text-xs text-white/40 truncate max-w-md">{user.bio}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {user.streakCount !== undefined && user.streakCount > 0 && (
                          <div className="flex items-center gap-1 text-rose-500 font-medium text-xs bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            {user.streakCount}d
                          </div>
                        )}

                        <div className="text-white font-bold text-sm w-20 text-right flex items-center justify-end gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          {user.points}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-white/40 text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
