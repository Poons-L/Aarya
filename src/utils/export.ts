import { Memory } from '../hooks/useMemories';
import { Contact } from '../hooks/useContacts';
import { Reminder } from '../hooks/useReminders';

export interface ExportData {
  memories: Memory[];
  contacts: Contact[];
  reminders: Reminder[];
  exportedAt: string;
  version: string;
}

export function exportToJSON(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `re-me-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: ExportData): void {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `re-me-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateCSV(data: ExportData): string {
  let csv = '';

  csv += 'MEMORIES\n';
  csv += 'ID,Text,Summary,Tags,Source Type,Created At\n';
  data.memories.forEach(memory => {
    const tags = Array.isArray(memory.tags) ? memory.tags.join('; ') : '';
    csv += `"${memory.id}","${escapeCSV(memory.text)}","${escapeCSV(memory.summary || '')}","${tags}","${memory.source_type}","${memory.created_at}"\n`;
  });

  csv += '\nCONTACTS\n';
  csv += 'ID,Name,Company,Title,Email,Phone,Met At,Met Date,Created At\n';
  data.contacts.forEach(contact => {
    csv += `"${contact.id}","${escapeCSV(contact.name)}","${escapeCSV(contact.company || '')}","${escapeCSV(contact.title || '')}","${contact.email || ''}","${contact.phone || ''}","${escapeCSV(contact.met_at || '')}","${contact.met_date}","${contact.created_at}"\n`;
  });

  csv += '\nREMINDERS\n';
  csv += 'ID,Title,Description,Due Date,Priority,Completed,Created At\n';
  data.reminders.forEach(reminder => {
    csv += `"${reminder.id}","${escapeCSV(reminder.title)}","${escapeCSV(reminder.description || '')}","${reminder.due_date}","${reminder.priority}","${reminder.completed}","${reminder.created_at}"\n`;
  });

  return csv;
}

function escapeCSV(text: string): string {
  if (!text) return '';
  return text.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
}
