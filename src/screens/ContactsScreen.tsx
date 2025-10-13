import { useState } from 'react';
import { ArrowLeft, Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Contact } from '../hooks/useContacts';
import { BottomNav } from '../components/BottomNav';

interface ContactsScreenProps {
  onBack: () => void;
  onSelectContact: (contactId: string) => void;
  onNavigate: (screen: string) => void;
  contacts: Contact[];
}

export function ContactsScreen({ onBack, onSelectContact, onNavigate, contacts }: ContactsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'starred'>('all');

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags || [])));

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const letter = contact.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="bg-slate-50 px-6 pt-14 pb-6 border-b border-slate-200">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="p-2 -ml-2 active:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">Contacts</h1>
          <div className="ml-auto text-sm text-slate-600">{contacts.length} total</div>
        </div>

        <div className="relative mb-4">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or company..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
              selectedFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-white border-2 border-slate-200 text-slate-700'
            }`}
          >
            All Contacts
          </button>
          <button
            onClick={() => setSelectedFilter('recent')}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
              selectedFilter === 'recent'
                ? 'bg-orange-500 text-white'
                : 'bg-white border-2 border-slate-200 text-slate-700'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap bg-white border-2 border-slate-200 text-slate-700 flex items-center gap-2"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-slate-200">
            <div className="font-semibold text-slate-900 mb-3">Filter by Tags</div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border-2 border-orange-200 active:bg-amber-100 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedContacts).sort().map(letter => (
          <div key={letter}>
            <div className="sticky top-0 bg-slate-100 px-6 py-2 text-xs font-bold text-slate-600 border-b border-slate-200">
              {letter}
            </div>
            {groupedContacts[letter].map(contact => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                className="w-full px-6 py-4 flex items-center gap-4 border-b border-slate-100 active:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{contact.name}</div>
                  <div className="text-sm text-slate-600 truncate">{contact.company}</div>
                  {contact.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-1">
                      {contact.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(contact.met_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
      <BottomNav currentScreen="contacts" onNavigate={onNavigate} />
    </div>
  );
}
