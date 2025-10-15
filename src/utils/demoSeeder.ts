import { supabase } from '../lib/supabase';

export async function seedDemoData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const sampleContacts = [
      {
        user_id: user.id,
        name: 'Sarah Chen',
        company: 'TechVision Inc.',
        title: 'VP of Product',
        email: 'sarah.chen@techvision.com',
        phone: '+1 (555) 123-4567',
        met_at: 'Tech Conference 2024',
        met_date: '2024-10-01',
        source: 'ocr',
        notes: 'Interested in AI integration for their product suite',
      },
      {
        user_id: user.id,
        name: 'Michael Rodriguez',
        company: 'Innovate Labs',
        title: 'Head of Engineering',
        email: 'm.rodriguez@innovatelabs.io',
        phone: '+1 (555) 234-5678',
        met_at: 'Developer Meetup',
        met_date: '2024-10-05',
        source: 'manual',
        notes: 'Looking for collaboration on open source projects',
      },
      {
        user_id: user.id,
        name: 'Emily Thompson',
        company: 'DataFlow Solutions',
        title: 'Chief Data Officer',
        email: 'emily.t@dataflow.com',
        phone: '+1 (555) 345-6789',
        met_at: 'Networking Event',
        met_date: '2024-10-10',
        source: 'text',
        notes: 'Discussed data pipeline optimization strategies',
      },
    ];

    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(sampleContacts)
      .select();

    if (contactsError) throw contactsError;

    const sampleMemories = [
      {
        user_id: user.id,
        text: 'Met Sarah at the Tech Conference. She mentioned they are looking to integrate AI capabilities into their product suite. They have a team of 50 engineers and are planning a Q2 2025 launch. Follow up needed on technical requirements and pricing.',
        summary: 'Discussion with Sarah Chen about AI integration opportunities for TechVision Inc.',
        tags: ['AI', 'TechVision', 'partnership', 'Q2-2025'],
        source_type: 'voice',
        linked_contact_id: insertedContacts?.[0]?.id,
      },
      {
        user_id: user.id,
        text: 'Coffee chat with Michael Rodriguez from Innovate Labs. He shared insights about their microservices architecture and challenges with scaling. They use Kubernetes and are interested in contributing to open source tooling. Mentioned their team is growing rapidly and they might need consultants.',
        summary: 'Technical discussion with Michael about microservices and open source collaboration',
        tags: ['microservices', 'kubernetes', 'open-source', 'consulting'],
        source_type: 'text',
        linked_contact_id: insertedContacts?.[1]?.id,
      },
      {
        user_id: user.id,
        text: 'Emily Thompson gave an excellent presentation on data pipeline optimization. Key takeaways: stream processing with Kafka, real-time analytics, and cost optimization strategies. She mentioned DataFlow is hiring and expanding to new markets. Great networking opportunity.',
        summary: 'Learned about data pipeline strategies from Emily at networking event',
        tags: ['data-pipelines', 'kafka', 'analytics', 'hiring'],
        source_type: 'text',
        linked_contact_id: insertedContacts?.[2]?.id,
      },
      {
        user_id: user.id,
        text: 'Brainstorming session on product roadmap. Focus areas: mobile app improvements, AI-powered search, better collaboration tools. Need to research competitors and validate with user interviews. Timeline: draft by end of month.',
        summary: 'Product roadmap brainstorming session with key priorities',
        tags: ['product', 'roadmap', 'mobile', 'AI'],
        source_type: 'text',
        linked_contact_id: null,
      },
      {
        user_id: user.id,
        text: 'Attended webinar on modern authentication practices. Topics covered: OAuth 2.0, OpenID Connect, passwordless auth, biometrics. Important security considerations for our next project. Bookmark resources for team review.',
        summary: 'Webinar notes on authentication best practices',
        tags: ['security', 'authentication', 'oauth', 'webinar'],
        source_type: 'text',
        linked_contact_id: null,
      },
    ];

    const { error: memoriesError } = await supabase
      .from('memories')
      .insert(sampleMemories);

    if (memoriesError) throw memoriesError;

    const sampleReminders = [
      {
        user_id: user.id,
        contact_id: insertedContacts?.[0]?.id,
        title: 'Follow up with Sarah about AI integration',
        description: 'Send technical requirements doc and pricing proposal',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
      },
      {
        user_id: user.id,
        contact_id: insertedContacts?.[1]?.id,
        title: 'Share open source project ideas with Michael',
        description: 'Compile list of potential collaboration projects',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
      },
      {
        user_id: user.id,
        contact_id: null,
        title: 'Complete product roadmap draft',
        description: 'Finalize Q1 priorities and validate with stakeholders',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
      },
    ];

    const { error: remindersError } = await supabase
      .from('reminders')
      .insert(sampleReminders);

    if (remindersError) throw remindersError;

    return {
      success: true,
      message: 'Demo data seeded successfully',
      counts: {
        contacts: sampleContacts.length,
        memories: sampleMemories.length,
        reminders: sampleReminders.length,
      },
    };
  } catch (error: any) {
    console.error('Error seeding demo data:', error);
    return {
      success: false,
      message: error.message || 'Failed to seed demo data',
    };
  }
}

export async function clearAllData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await supabase.from('reminders').delete().eq('user_id', user.id);
    await supabase.from('memories').delete().eq('user_id', user.id);
    await supabase.from('contacts').delete().eq('user_id', user.id);

    return { success: true, message: 'All data cleared successfully' };
  } catch (error: any) {
    console.error('Error clearing data:', error);
    return { success: false, message: error.message || 'Failed to clear data' };
  }
}
