import { Contact } from '../hooks/useContacts';

/**
 * Returns an http(s) URL safe to use as a link target, or null.
 * Rejects javascript:, data: and other schemes; adds https:// to bare hosts like "linkedin.com/in/x".
 */
export function safeHttpUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Quotes a CSV field and neutralises spreadsheet formulas: a cell starting with
 * = + - @ (or tab/CR) would otherwise be executed by Excel/Sheets when opened.
 */
export function escapeCsvValue(value: string): string {
  const neutralised = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(neutralised) || neutralised !== value) {
    return `"${neutralised.replace(/"/g, '""')}"`;
  }
  return neutralised;
}

/** Escapes a vCard 3.0 text value so it can't break out into new properties */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export function generateVCard(contact: Contact): string {
  const nameParts = contact.name.trim().split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const firstNames = (nameParts.length > 1 ? nameParts.slice(0, -1) : nameParts).join(' ');

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(contact.name)}`,
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstNames)};;;`,
  ];

  if (contact.company) {
    vcard.push(`ORG:${escapeVCardValue(contact.company)}`);
  }

  if (contact.title) {
    vcard.push(`TITLE:${escapeVCardValue(contact.title)}`);
  }

  if (contact.email) {
    vcard.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(contact.email)}`);
  }

  if (contact.phone) {
    vcard.push(`TEL;TYPE=CELL:${escapeVCardValue(contact.phone)}`);
  }

  const linkedin = safeHttpUrl(contact.linkedin_url);
  if (linkedin) {
    vcard.push(`URL:${linkedin}`);
  }

  if (contact.notes) {
    vcard.push(`NOTE:${escapeVCardValue(contact.notes)}`);
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
  // Encode the address so a stored value like "a@b.com?bcc=x" can't add parameters
  let mailto = `mailto:${encodeURIComponent(email.trim()).replace(/%40/g, '@')}`;
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
