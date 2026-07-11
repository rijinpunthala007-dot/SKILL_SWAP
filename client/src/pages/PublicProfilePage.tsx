import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, requestsApi, endorsementsApi } from '../services/api.service';
import { ProfileSkeleton } from '../components/ui/Skeletons';
import { ArrowLeft, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

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

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const authUser = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => usersApi.getUserById(userId!),
    enabled: !!userId,
  });

  const requestMutation = useMutation({
    mutationFn: (skill: string) =>
      requestsApi.send({ toUserId: userId!, matchedSkill: skill }),
    onSuccess: () => {
      toast.success('Exchange request sent! 🚀');
      qc.invalidateQueries({ queryKey: ['requests', 'outgoing'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed';
      toast.error(msg);
    },
  });

  const endorseMutation = useMutation({
    mutationFn: (skillName: string) => endorsementsApi.endorse(userId!, skillName),
    onSuccess: (res) => {
      const data = res.data.data;
      if (data.verified) {
        toast.success(`Skill endorsed! This user is now verified for this skill! 🏅`);
      } else {
        toast.success(`Skill endorsed! (${data.totalEndorsements}/3 endorsements) 👍`);
      }
      qc.invalidateQueries({ queryKey: ['profile', userId] });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.error?.message ?? 'Failed to endorse';
      toast.error(msg);
    },
  });

  if (isLoading) return <ProfileSkeleton />;

  const profile = data?.data?.data;
  if (!profile) return null;

  const isOwnProfile = authUser?.id === userId;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Link to={-1 as unknown as string} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Profile header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-24 h-24 avatar flex-shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-3xl font-bold text-white ring-2 ring-brand-500/30 flex-shrink-0">
              {profile.name[0]?.toUpperCase()}
            </div>
          )}

          <div className="w-full flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            {profile.bio && (
              <p className="text-white/60 mt-2 text-sm leading-relaxed">{profile.bio}</p>
            )}

            {!isOwnProfile && (
              <div className="flex justify-center sm:justify-start gap-3 mt-4">
                <button
                  onClick={() => {
                    const skill = profile.skillsOffered[0]?.skillName ?? 'General';
                    requestMutation.mutate(skill);
                  }}
                  disabled={requestMutation.isPending}
                  className="btn-primary text-sm w-full sm:w-auto"
                  id="send-request-btn"
                >
                  {requestMutation.isPending ? 'Sending...' : 'Request Exchange'}
                </button>
              </div>
            )}
            {isOwnProfile && (
              <div className="flex justify-center sm:justify-start">
                <Link to="/profile" className="btn-secondary text-sm mt-4 inline-flex w-full sm:w-auto justify-center">
                  Edit Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills Offered */}
      {profile.skillsOffered.length > 0 && (
        <div className="glass-card p-6 mb-4">
          <h2 className="text-lg font-semibold text-white mb-4">Skills Offered</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skillsOffered.map((skill) => {
              const isVerified = profile.verifiedSkills?.some(
                (vs) => vs.skillName.toLowerCase() === skill.skillName.toLowerCase()
              );
              return (
                <span key={skill.skillName} className={`${PROFICIENCY_COLOR[skill.proficiency] ?? 'badge-brand'} text-sm px-3 py-1.5 flex items-center gap-1.5`}>
                  {isVerified && (
                    <span title="Verified Skill"><Award className="w-4 h-4 text-amber-400 fill-amber-400/20" /></span>
                  )}
                  {skill.skillName}
                  <span className="opacity-60">· {skill.proficiency}</span>
                  {!isOwnProfile && (
                    <button
                      onClick={() => endorseMutation.mutate(skill.skillName)}
                      disabled={endorseMutation.isPending}
                      className="ml-1 text-white/50 hover:text-white transition-colors"
                      title="Endorse this skill"
                    >
                      👍
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills Wanted */}
      {profile.skillsWanted.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Skills Wanted</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skillsWanted.map((skill) => (
              <span key={skill.skillName} className={`${PRIORITY_COLOR[skill.priority] ?? 'badge-brand'} text-sm px-3 py-1.5`}>
                {skill.skillName}
                <span className="ml-1.5 opacity-60">· {skill.priority} priority</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
