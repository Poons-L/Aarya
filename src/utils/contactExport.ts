import { Contact } from '../hooks/useContacts';

export function generateVCard(contact: Contact): string {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name}`,
    `N:${contact.name.split(' ').reverse().join(';')};;;`,
  ];

  if (contact.company) {
    vcard.push(`ORG:${contact.company}`);
  }

  if (contact.title) {
    vcard.push(`TITLE:${contact.title}`);
  }

  if (contact.email) {
    vcard.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
  }

  if (contact.phone) {
    vcard.push(`TEL;TYPE=CELL:${contact.phone}`);
  }

  if (contact.linkedin_url) {
    vcard.push(`URL:${contact.linkedin_url}`);
  }

  if (contact.notes) {
    vcard.push(`NOTE:${contact.notes.replace(/\n/g, '\\n')}`);
  }

  vcard.push('END:VCARD');

  return vcard.join('\r\n');
}

export function downloadVCard(contact: Contact): void {
  const vcardContent = generateVCard(contact);
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function generateHubSpotCSV(contact: Contact): string {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone Number',
    'Company Name',
    'Job Title',
    'LinkedIn URL',
    'Website',
  ];

  const nameParts = contact.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const row = [
    firstName,
    lastName,
    contact.email || '',
    contact.phone || '',
    contact.company || '',
    contact.title || '',
    contact.linkedin_url || '',
    '',
  ];

  const escapeCsvValue = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.join(','),
    row.map(escapeCsvValue).join(','),
  ].join('\n');

  return csvContent;
}

export function generateSalesforceCSV(contact: Contact): string {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Title',
    'Company',
    'Description',
    'Lead Source',
  ];

  const nameParts = contact.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const description = [
    contact.notes || '',
    contact.met_at ? `Met at: ${contact.met_at}` : '',
    contact.met_date ? `Met on: ${new Date(contact.met_date).toLocaleDateString()}` : '',
  ].filter(Boolean).join(' | ');

  const row = [
    firstName,
    lastName,
    contact.email || '',
    contact.phone || '',
    contact.title || '',
    contact.company || '',
    description,
    contact.met_at || 'Networking',
  ];

  const escapeCsvValue = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.join(','),
    row.map(escapeCsvValue).join(','),
  ].join('\n');

  return csvContent;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function createMailtoLink(email: string, subject?: string, body?: string): string {
  let mailto = `mailto:${email}`;
  const params = [];

  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }

  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }

  if (params.length > 0) {
    mailto += '?' + params.join('&');
  }

  return mailto;
}

export function createCalendarEvent(contactName: string, email?: string): string {
  const subject = `Meeting with ${contactName}`;
  const body = `Meeting scheduled with ${contactName}${email ? ` (${email})` : ''}\n\nPlease add meeting details and time.`;

  const attendees = email ? `&add=${encodeURIComponent(email)}` : '';

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(subject)}${attendees}&details=${encodeURIComponent(body)}`;

  return googleCalendarUrl;
}
