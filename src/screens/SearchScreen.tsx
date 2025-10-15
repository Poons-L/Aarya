import { useState, useEffect } from 'react';
import { Search as SearchIcon, Brain, User, Tag, Clock, Filter } from 'lucide-react';
import { useMemories, Memory } from '../hooks/useMemories';
import { Contact } from '../hooks/useContacts';
import { BottomNav } from '../components/BottomNav';

interface SearchScreenProps {
  onNavigate: (screen: string) => void;
  onSelectMemory: (memoryId: string) => void;
  onSelectContact: (contactId: string) => void;
  contacts: Contact[];
}

type SearchFilter = 'all' | 'memories' | 'people';

export function SearchScreen({ onNavigate, onSelectMemory, onSelectContact, contacts }: SearchScreenProps) {
  const { searchMemories, memories } = useMemories();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [searchResults, setSearchResults] = useState<Memory[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setSearchResults(memories);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await searchMemories(query);
        setSearchResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query, memories]);

  const filteredContacts = contacts.filter(contact => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      contact.name.toLowerCase().includes(q) ||
      contact.company?.toLowerCase().includes(q) ||
      contact.title?.toLowerCase().includes(q) ||
      contact.tags?.some(tag => tag.toLowerCase().includes(q))
    );
  });

  const showMemories = activeFilter === 'all' || activeFilter === 'memories';
  const showPeople = activeFilter === 'all' || activeFilter === 'people';

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInHours = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="bg-white px-6 pt-14 pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Search</h1>

        <div className="relative mb-4">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories, people, topics..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-colors"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('memories')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 ${
              activeFilter === 'memories'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            <Brain size={16} />
            Memories
          </button>
          <button
            onClick={() => setActiveFilter('people')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 ${
              activeFilter === 'people'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            <User size={16} />
            People
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!query.trim() && memories.length === 0 && contacts.length === 0 && (
          <div className="text-center py-12">
            <SearchIcon size={64} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-2">No data yet</p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Start adding memories and contacts to search them
            </p>
          </div>
        )}

        {isSearching && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-600">Searching...</p>
          </div>
        )}

        {!isSearching && (searchResults.length > 0 || filteredContacts.length > 0) && (
          <div className="space-y-6">
            {showMemories && searchResults.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
                  Memories ({searchResults.length})
                </h2>
                <div className="space-y-3">
                  {searchResults.map((memory) => (
                    <button
                      key={memory.id}
                      onClick={() => onSelectMemory(memory.id)}
                      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white flex-shrink-0">
                          <Brain size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock size={12} />
                              {formatTimeAgo(memory.created_at)}
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 line-clamp-2">
                            {memory.summary || memory.text}
                          </p>
                        </div>
                      </div>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {memory.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full flex items-center gap-1"
                            >
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showPeople && filteredContacts.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
                  People ({filteredContacts.length})
                </h2>
                <div className="space-y-3">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => onSelectContact(contact.id)}
                      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 active:bg-slate-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-slate-900">{contact.name}</div>
                        <div className="text-sm text-slate-600 truncate">
                          {contact.company && contact.title
                            ? `${contact.title} at ${contact.company}`
                            : contact.company || contact.title || 'No company info'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && !isSearching && searchResults.length === 0 && filteredContacts.length === 0 && (
              <div className="text-center py-12">
                <SearchIcon size={64} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium mb-2">No results found</p>
                <p className="text-sm text-slate-500">
                  Try different keywords or create a new memory
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav active="search" onNavigate={onNavigate} />
    </div>
  );
}
