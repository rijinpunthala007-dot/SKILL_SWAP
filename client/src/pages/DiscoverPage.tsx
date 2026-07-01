import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Sparkles } from 'lucide-react';
import { usersApi } from '../services/api.service';
import { UserCard } from '../components/profile/UserCard';
import { UserCardSkeleton } from '../components/ui/Skeletons';
import { useDebounce } from '../hooks/useDebounce';

export function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', 'search', debouncedSearch, page],
    queryFn: () => usersApi.searchUsers({ skill: debouncedSearch, page, limit: 12 }),
    placeholderData: (prev) => prev,
  });

  const { data: matchesData, isLoading: loadingMatches } = useQuery({
    queryKey: ['matches'],
    queryFn: () => usersApi.getMatches(),
    enabled: !debouncedSearch,
  });

  const users = data?.data?.data ?? [];
  const pagination = data?.data?.meta?.pagination;
  const topMatches = matchesData?.data?.data ?? [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const isSearching = Boolean(debouncedSearch);
  const displayUsers = isSearching ? users : topMatches;
  const isLoadingAny = isSearching ? isLoading || isFetching : loadingMatches;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Discover Peers</h1>
        <p className="text-white/50 mt-1">Find students with complementary skills</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          id="discover-search"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by skill, name, or description..."
          className="input pl-12 py-3.5 text-base"
        />
        {isFetching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Section label */}
      <div className="flex items-center gap-2 mb-5">
        {isSearching ? (
          <>
            <Search className="w-4 h-4 text-white/40" />
            <h2 className="text-sm font-medium text-white/40">
              {isLoading ? 'Searching...' : `${users.length} result${users.length !== 1 ? 's' : ''} for "${debouncedSearch}"`}
            </h2>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-medium text-white/60">Best matches for your skill goals</h2>
          </>
        )}
      </div>

      {/* Results grid */}
      {isLoadingAny ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <UserCardSkeleton key={i} />)}
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
          {isSearching ? (
            <>
              <h3 className="text-lg font-semibold text-white/40">No users found</h3>
              <p className="text-white/25 text-sm mt-1">Try a different skill or keyword</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-white/40">No matches yet</h3>
              <p className="text-white/25 text-sm mt-1">Add skills to your profile to see matches</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayUsers.map((scored) => (
              <UserCard key={scored.user._id} scoredUser={scored} />
            ))}
          </div>

          {/* Pagination (search results only) */}
          {isSearching && pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm px-4"
              >
                Previous
              </button>
              <span className="text-white/40 text-sm">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
                className="btn-secondary text-sm px-4"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
