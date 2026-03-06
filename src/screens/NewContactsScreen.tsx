import { useState, useMemo } from 'react';
import { Search, Filter, Users, Plus, X, ChevronDown } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';

interface NewContactsScreenProps {
  onViewContact: (contactId: string) => void;
  onAddContact: () => void;
}

export function NewContactsScreen({ onViewContact, onAddContact }: NewContactsScreenProps) {
  const { contacts } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'company'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    contacts.forEach(contact => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [contacts]);

  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.title?.toLowerCase().includes(query) ||
          (contact.tags && Array.isArray(contact.tags) &&
           contact.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(
        contact => contact.tags && Array.isArray(contact.tags) && contact.tags.includes(selectedTag)
      );
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'company':
        sorted.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
        break;
      case 'recent':
      default:
        sorted.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return sorted;
  }, [contacts, searchQuery, selectedTag, sortBy]);

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
            <p className="text-sm text-slate-600 mt-1">
              {filteredAndSortedContacts.length} {filteredAndSortedContacts.length === 1 ? 'contact' : 'contacts'}
            </p>
          </div>
          <button
            onClick={onAddContact}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || selectedTag
                ? 'bg-orange-100 text-orange-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="recent">Recent</option>
            <option value="name">Name A-Z</option>
            <option value="company">Company</option>
          </select>
        </div>

        {showFilters && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">Filter by Tag</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  !selectedTag
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tag === selectedTag
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredAndSortedContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <Users size={40} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || selectedTag ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchQuery || selectedTag
                ? 'Try adjusting your search or filters'
                : 'Start building your network by adding your first contact'}
            </p>
            {!searchQuery && !selectedTag && (
              <button
                onClick={onAddContact}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium active:scale-95 transition-transform"
              >
                Add First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {filteredAndSortedContacts.map(contact => (
              <div
                key={contact.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('clicked');
                  onViewContact(contact.id);
                }}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-slate-200 active:scale-98 transition-transform cursor-pointer select-none"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {contact.photo_url ? (
                      <img
                        src={contact.photo_url}
                        alt={contact.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      contact.name[0]
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {contact.name}
                    </div>
                    {(contact.title || contact.company) && (
                      <div className="text-sm text-slate-600 truncate">
                        {contact.title && contact.company
                          ? `${contact.title} at ${contact.company}`
                          : contact.company || contact.title}
                      </div>
                    )}
                    {contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contact.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                            +{contact.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
