import { describe, expect, it } from 'vitest';
import {
  createMailtoLink,
  escapeCsvValue,
  escapeVCardValue,
  generateHubSpotCSV,
  generateSalesforceCSV,
  generateVCard,
  safeHttpUrl,
} from '../contactExport';
import type { Contact } from '../../hooks/useContacts';

const contact = (overrides: Partial<Contact> = {}): Contact => ({
  id: 'c1',
  user_id: 'u1',
  name: 'Ada Lovelace',
  met_date: '2026-10-01',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  ...overrides,
} as Contact);

describe('safeHttpUrl', () => {
  it('keeps http(s) URLs', () => {
    expect(safeHttpUrl('https://linkedin.com/in/ada')).toBe('https://linkedin.com/in/ada');
    expect(safeHttpUrl('http://example.com')).toBe('http://example.com/');
  });

  it('adds https:// to bare hosts', () => {
    expect(safeHttpUrl('linkedin.com/in/ada')).toBe('https://linkedin.com/in/ada');
  });

  it('rejects script and data URLs', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('JavaScript:alert(1)')).toBeNull();
    expect(safeHttpUrl(' javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('handles empty values', () => {
    expect(safeHttpUrl('')).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});

describe('escapeCsvValue', () => {
  it('leaves plain values alone', () => {
    expect(escapeCsvValue('Ada')).toBe('Ada');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(escapeCsvValue('a,b')).toBe('"a,b"');
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"');
  });

  it.each(['=HYPERLINK("http://evil")', '+1+2', '-2+3', '@SUM(A1)', '\t=1', '\r=1'])(
    'neutralises formula %j',
    (value) => {
      const escaped = escapeCsvValue(value);
      expect(escaped.startsWith(`"'`)).toBe(true);
    },
  );
});

describe('CRM CSV exports', () => {
  it('neutralises formulas in HubSpot rows', () => {
    const csv = generateHubSpotCSV(contact({ name: '=cmd Evil', company: '@corp' }));
    const row = csv.split('\n')[1];
    expect(row.startsWith(`"'=cmd"`)).toBe(true);
    expect(row).toContain(`"'@corp"`);
  });

  it('neutralises formulas in Salesforce descriptions', () => {
    const csv = generateSalesforceCSV(contact({ notes: '=1+1' }));
    expect(csv).toContain(`"'=1+1 | Met on:`);
  });
});

describe('vCard', () => {
  it('escapes values so they cannot inject properties', () => {
    // String.raw keeps backslashes literal: input a;b,c\d<newline>e
    expect(escapeVCardValue('a;b,c\\d\ne')).toBe(String.raw`a\;b\,c\\d\ne`);
    const card = generateVCard(contact({ company: 'Evil\r\nTEL:+100' }));
    const lines = card.split('\r\n');
    expect(lines.filter((l) => l.startsWith('TEL'))).toHaveLength(0);
    expect(lines).toContain(String.raw`ORG:Evil\nTEL:+100`);
  });

  it('splits the structured name as last;first', () => {
    expect(generateVCard(contact({ name: 'Ada King Lovelace' }))).toContain('N:Lovelace;Ada King;;;');
  });

  it('drops unsafe URLs', () => {
    expect(generateVCard(contact({ linkedin_url: 'javascript:alert(1)' }))).not.toContain('URL:');
  });
});

describe('createMailtoLink', () => {
  it('encodes subject and body', () => {
    expect(createMailtoLink('ada@example.com', 'Hi there', 'a&b')).toBe(
      'mailto:ada@example.com?subject=Hi%20there&body=a%26b',
    );
  });

  it('prevents parameter injection through the address', () => {
    expect(createMailtoLink('ada@example.com?bcc=eve@evil.com')).toBe(
      'mailto:ada@example.com%3Fbcc%3Deve@evil.com',
    );
  });
});
