import { Link } from 'react-router-dom';
import { Star, Sparkles, Award } from 'lucide-react';
import type { ScoredUser } from '../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const PROFICIENCY_COLOR: Record<string, string> = {
  Advanced: 'badge-success',
  Intermediate: 'badge-brand',
  Beginner: 'badge-warning',
};

const PRIORITY_COLOR: Record<string, string> = {
  High: 'badge-error',
  Medium: 'badge-warning',
  Low: 'badge-brand',
};

interface UserCardProps {
  scoredUser: ScoredUser;
  showMatchScore?: boolean;
}

export function UserCard({ scoredUser, showMatchScore = true }: UserCardProps) {
  const { user, matchScore, matchReasons } = scoredUser;
  const qc = useQueryClient();

  const requestMutation = useMutation({
    mutationFn: (skill: string) =>
      requestsApi.send({ toUserId: user._id, matchedSkill: skill }),
    onSuccess: () => {
      toast.success('Exchange request sent! 🚀');
      qc.invalidateQueries({ queryKey: ['requests', 'outgoing'] });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to send request';
      toast.error(msg);
    },
  });

  const handleSendRequest = () => {
    const firstMatchedSkill =
      user.skillsOffered[0]?.skillName ?? user.skillsWanted[0]?.skillName ?? 'General';
    requestMutation.mutate(firstMatchedSkill);
  };

  return (
    <div className="glass-card p-5 hover:border-brand-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-brand-900/20 animate-fade-in group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link to={`/profile/${user._id}`} className="flex-shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-14 h-14 avatar" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white ring-2 ring-brand-500/30">
              {user.name[0]?.toUpperCase()}
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${user._id}`}
              className="font-semibold text-white hover:text-brand-300 transition-colors"
            >
              {user.name}
            </Link>
            {showMatchScore && matchScore > 0 && (
              <span className={`badge ${matchScore >= 80 ? 'badge-success' : matchScore >= 50 ? 'badge-warning' : 'badge-brand'} flex items-center gap-1`}>
                <Star className="w-3 h-3 fill-current" />
                {matchScore.toFixed(0)}% Match
              </span>
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-white/50 mt-1 line-clamp-2">{user.bio}</p>
          )}

          {/* Skills Offered */}
          {user.skillsOffered.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-white/30 mb-1.5 uppercase tracking-wider">Offers</p>
              <div className="flex flex-wrap gap-1.5">
                {user.skillsOffered.slice(0, 4).map((s) => {
                  const isVerified = user.verifiedSkills?.some(
                    (vs) => vs.skillName.toLowerCase() === s.skillName.toLowerCase()
                  );
                  return (
                    <span key={s.skillName} className={`${PROFICIENCY_COLOR[s.proficiency] ?? 'badge-brand'} flex items-center gap-1`}>
                      {isVerified && (
                        <span title="Verified Skill"><Award className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" /></span>
                      )}
                      {s.skillName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skills Wanted */}
          {user.skillsWanted.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-white/30 mb-1.5 uppercase tracking-wider">Wants</p>
              <div className="flex flex-wrap gap-1.5">
                {user.skillsWanted.slice(0, 4).map((s) => (
                  <span key={s.skillName} className={PRIORITY_COLOR[s.priority] ?? 'badge-brand'}>
                    {s.skillName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Match reasons tooltip */}
          {matchReasons.length > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
              <div className="flex items-center gap-1 text-xs text-brand-300 mb-1">
                <Sparkles className="w-3 h-3" />
                Complementary skills
              </div>
              <p className="text-xs text-white/60 line-clamp-1">{matchReasons[0]}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-surface-border">
        <button
          onClick={handleSendRequest}
          disabled={requestMutation.isPending}
          className="btn-primary text-xs flex-1"
        >
          {requestMutation.isPending ? 'Sending...' : 'Request Exchange'}
        </button>
        <Link
          to={`/profile/${user._id}`}
          className="btn-secondary text-xs px-3"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
