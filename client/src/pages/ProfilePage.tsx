import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Plus, X, Save, User } from 'lucide-react';
import { usersApi } from '../services/api.service';
import { ProfileSkeleton } from '../components/ui/Skeletons';
import { toast } from 'react-hot-toast';
import type { SkillOffered, SkillWanted } from '../types';

const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const PRIORITY_LEVELS = ['Low', 'Medium', 'High'] as const;

export function ProfilePage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => usersApi.getMe(),
  });

  const profile = data?.data?.data;

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [skillsOffered, setSkillsOffered] = useState<SkillOffered[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<SkillWanted[]>([]);
  const [newOfferedSkill, setNewOfferedSkill] = useState('');
  const [newOfferedLevel, setNewOfferedLevel] = useState<typeof PROFICIENCY_LEVELS[number]>('Intermediate');
  const [newWantedSkill, setNewWantedSkill] = useState('');
  const [newWantedPriority, setNewWantedPriority] = useState<typeof PRIORITY_LEVELS[number]>('Medium');

  // Populate from server data on load
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setAvatar(profile.avatar ?? '');
      setBio(profile.bio ?? '');
      setSkillsOffered(profile.skillsOffered ?? []);
      setSkillsWanted(profile.skillsWanted ?? []);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({ name, bio, avatar, skillsOffered, skillsWanted }),
    onSuccess: () => {
      toast.success('Profile updated! ✨');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: () => {
      toast.success('Avatar updated!');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Failed to upload avatar'),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  };

  const addOfferedSkill = () => {
    if (!newOfferedSkill.trim()) return;
    if (skillsOffered.some((s) => s.skillName.toLowerCase() === newOfferedSkill.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }
    setSkillsOffered([...skillsOffered, { skillName: newOfferedSkill.trim(), proficiency: newOfferedLevel }]);
    setNewOfferedSkill('');
  };

  const addWantedSkill = () => {
    if (!newWantedSkill.trim()) return;
    if (skillsWanted.some((s) => s.skillName.toLowerCase() === newWantedSkill.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }
    setSkillsWanted([...skillsWanted, { skillName: newWantedSkill.trim(), priority: newWantedPriority }]);
    setNewWantedSkill('');
  };

  const generateAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
        <p className="text-white/50 mt-1">Showcase your skills to find the perfect learning partners</p>
      </div>

      <div className="space-y-6">
        {/* Avatar + Basic Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="avatar-input"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group"
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-24 h-24 avatar" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-3xl font-bold text-white ring-2 ring-brand-500/30">
                      {name?.[0]?.toUpperCase() ?? <User className="w-10 h-10" />}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
                {avatarMutation.isPending && (
                  <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={generateAvatar}
                type="button" 
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors bg-white/5 px-3 py-1.5 rounded-lg"
              >
                Auto-generate
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">Bio</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Tell others about yourself, what you're studying, your learning goals..."
              maxLength={500}
            />
            <p className="text-xs text-white/25 mt-1 text-right">{bio.length}/500</p>
          </div>
        </div>

        {/* Skills Offered */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Skills I Can Offer</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {skillsOffered.map((skill) => (
              <span key={skill.skillName} className="badge-brand flex items-center gap-1.5 text-sm">
                {skill.skillName}
                <span className="opacity-60 text-xs">• {skill.proficiency}</span>
                <button
                  onClick={() => setSkillsOffered(skillsOffered.filter((s) => s.skillName !== skill.skillName))}
                  className="hover:text-red-400 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id="offered-skill-input"
              type="text"
              value={newOfferedSkill}
              onChange={(e) => setNewOfferedSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOfferedSkill()}
              placeholder="Add a skill..."
              className="input flex-1"
            />
            <select
              value={newOfferedLevel}
              onChange={(e) => setNewOfferedLevel(e.target.value as typeof PROFICIENCY_LEVELS[number])}
              className="input w-36 flex-shrink-0"
            >
              {PROFICIENCY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={addOfferedSkill} className="btn-secondary px-3">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Skills Wanted */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Skills I Want to Learn</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {skillsWanted.map((skill) => (
              <span key={skill.skillName} className="badge-warning flex items-center gap-1.5 text-sm">
                {skill.skillName}
                <span className="opacity-60 text-xs">• {skill.priority}</span>
                <button
                  onClick={() => setSkillsWanted(skillsWanted.filter((s) => s.skillName !== skill.skillName))}
                  className="hover:text-red-400 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id="wanted-skill-input"
              type="text"
              value={newWantedSkill}
              onChange={(e) => setNewWantedSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWantedSkill()}
              placeholder="Add a skill you want to learn..."
              className="input flex-1"
            />
            <select
              value={newWantedPriority}
              onChange={(e) => setNewWantedPriority(e.target.value as typeof PRIORITY_LEVELS[number])}
              className="input w-28 flex-shrink-0"
            >
              {PRIORITY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={addWantedSkill} className="btn-secondary px-3">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          id="save-profile"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="btn-primary w-full py-3"
        >
          {updateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Profile
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
