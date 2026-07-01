import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X, ArrowUpRight, Clock, Inbox } from 'lucide-react';
import { requestsApi } from '../services/api.service';
import { UserCardSkeleton } from '../components/ui/Skeletons';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

type Tab = 'incoming' | 'outgoing';

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  accepted: 'badge-success',
  rejected: 'badge-error',
};

export function RequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('incoming');
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: incomingData, isLoading: loadingIn } = useQuery({
    queryKey: ['requests', 'incoming'],
    queryFn: () => requestsApi.getIncoming(),
  });

  const { data: outgoingData, isLoading: loadingOut } = useQuery({
    queryKey: ['requests', 'outgoing'],
    queryFn: () => requestsApi.getOutgoing(),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => requestsApi.accept(id),
    onSuccess: () => {
      toast.success('Request accepted! A conversation has been created. 💬');
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to accept';
      toast.error(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => requestsApi.reject(id),
    onSuccess: () => {
      toast.success('Request declined');
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  const incoming = incomingData?.data?.data ?? [];
  const outgoing = outgoingData?.data?.data ?? [];
  const pendingIn = incoming.filter((r) => r.status === 'pending').length;

  const isLoading = activeTab === 'incoming' ? loadingIn : loadingOut;
  const requests = activeTab === 'incoming' ? incoming : outgoing;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Exchange Requests</h1>
        <p className="text-white/50 mt-1">Manage incoming and outgoing skill exchange requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl mb-6 w-fit">
        <button
          id="tab-incoming"
          onClick={() => setActiveTab('incoming')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'incoming'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-white/50 hover:text-white'
          )}
        >
          <Inbox className="w-4 h-4" />
          Incoming
          {pendingIn > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
              {pendingIn}
            </span>
          )}
        </button>
        <button
          id="tab-outgoing"
          onClick={() => setActiveTab('outgoing')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'outgoing'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-white/50 hover:text-white'
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          Outgoing
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <UserCardSkeleton key={i} />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Bell className="w-14 h-14 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white/40">No {activeTab} requests</h3>
          <p className="text-white/25 text-sm mt-1">
            {activeTab === 'incoming'
              ? "When others send you requests, they'll appear here"
              : 'Visit Discover to find peers and send requests'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const otherUser = activeTab === 'incoming' ? req.fromUser : req.toUser;
            return (
              <div key={req._id} className="glass-card p-5 animate-fade-in">
                <div className="flex items-start gap-4">
                  {otherUser.avatar ? (
                    <img src={otherUser.avatar} alt={otherUser.name} className="w-12 h-12 avatar flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center font-bold flex-shrink-0">
                      {otherUser.name[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{otherUser.name}</span>
                      <span className={STATUS_BADGE[req.status] ?? 'badge-brand'}>{req.status}</span>
                    </div>
                    <p className="text-sm text-white/50 mt-1">
                      Skill: <span className="text-brand-300 font-medium">{req.matchedSkill}</span>
                    </p>
                    {req.message && (
                      <p className="text-sm text-white/40 mt-2 italic">"{req.message}"</p>
                    )}
                    <p className="text-xs text-white/25 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {activeTab === 'incoming' && req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => acceptMutation.mutate(req._id)}
                          disabled={acceptMutation.isPending}
                          className="btn-primary text-xs px-3 py-2"
                          id={`accept-${req._id}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(req._id)}
                          disabled={rejectMutation.isPending}
                          className="btn-danger text-xs px-3 py-2"
                          id={`reject-${req._id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </>
                    )}
                    {req.status === 'accepted' && (
                      <button
                        onClick={() => navigate('/chats')}
                        className="btn-secondary text-xs px-3 py-2"
                      >
                        Open Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
