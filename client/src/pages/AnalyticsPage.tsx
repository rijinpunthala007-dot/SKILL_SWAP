import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, Activity, TrendingUp } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsPage() {
  const { data: globalData, isLoading: loadingGlobal } = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.getGlobal(),
  });

  const { data: personalData, isLoading: loadingPersonal } = useQuery({
    queryKey: ['analytics', 'personal'],
    queryFn: () => analyticsApi.getPersonal(),
  });

  const globalStats = globalData?.data?.data;
  const personalStats = personalData?.data?.data;

  // Prepare Skill Comparison Data
  const skillNames = Array.from(
    new Set([
      ...(globalStats?.supply.map((s) => s.skillName) ?? []),
      ...(globalStats?.demand.map((d) => d.skillName) ?? []),
    ])
  );

  const skillComparisonData = skillNames.map((name) => {
    const offered = globalStats?.supply.find((s) => s.skillName.toLowerCase() === name.toLowerCase())?.count ?? 0;
    const wanted = globalStats?.demand.find((d) => d.skillName.toLowerCase() === name.toLowerCase())?.count ?? 0;
    return { name, Offered: offered, Wanted: wanted };
  });

  // Prepare Request Pie Chart Data
  const requestPieData = personalStats
    ? [
        { name: 'Accepted', value: personalStats.requests.accepted },
        { name: 'Pending', value: personalStats.requests.pending },
        { name: 'Rejected', value: personalStats.requests.rejected },
      ].filter((d) => d.value > 0)
    : [];

  // Prepare Message Bar Chart Data
  const messageData = personalStats
    ? [
        { name: 'Sent', Count: personalStats.messages.sent },
        { name: 'Received', Count: personalStats.messages.received },
      ]
    : [];

  const isLoading = loadingGlobal || loadingPersonal;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-brand-400" />
          Analytics Dashboard
        </h1>
        <p className="text-white/50 mt-1">Real-time statistics on your learning activity and global skill trends.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Personal Activity Card */}
          <div className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Your Activity Summary
            </h2>

            {requestPieData.length === 0 && messageData.every(d => d.Count === 0) ? (
              <div className="text-center py-12 text-white/40 text-sm">
                No activity logs found. Accept request exchanges and start chatting to view stats!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Request outcomes pie chart */}
                {requestPieData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 uppercase tracking-wider text-center">Exchange Requests</p>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={requestPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {requestPieData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex justify-center gap-3 flex-wrap">
                      {requestPieData.map((d, index) => (
                        <div key={d.name} className="flex items-center gap-1 text-[11px] text-white/60">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          {d.name} ({d.value})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages sent vs received bar chart */}
                {messageData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 uppercase tracking-wider text-center">Messages Activity</p>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={messageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                          <Tooltip
                            contentStyle={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="Count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                            {messageData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Global Skill Trends Card */}
          <div className="glass-card p-6 space-y-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Global Skill Demand vs Supply
            </h2>

            {skillComparisonData.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-sm">
                No user skills registered in system. Seed data first!
              </div>
            ) : (
              <div className="w-full overflow-x-auto scrollbar-hide">
                <div className="h-72 min-w-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar dataKey="Offered" name="Supply (Offered)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Wanted" name="Demand (Wanted)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
