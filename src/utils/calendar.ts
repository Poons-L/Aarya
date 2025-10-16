export interface CalendarEvent {
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  notes?: string;
}

export function addToNativeCalendar(event: CalendarEvent): boolean {
  try {
    const startISO = event.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endISO = event.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const encodedTitle = encodeURIComponent(event.title);
    const encodedLocation = event.location ? encodeURIComponent(event.location) : '';
    const encodedNotes = event.notes ? encodeURIComponent(event.notes) : '';

    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startISO}/${endISO}&location=${encodedLocation}&details=${encodedNotes}`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      const icsContent = generateICS(event);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } else if (isAndroid) {
      window.open(calendarUrl, '_blank');
      return true;
    } else {
      window.open(calendarUrl, '_blank');
      return true;
    }
  } catch (error) {
    console.error('Error adding to calendar:', error);
    return false;
  }
}

function generateICS(event: CalendarEvent): string {
  const startISO = event.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endISO = event.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Re.Me//Calendar Event//EN
BEGIN:VEVENT
UID:${now}@re-me-app
DTSTAMP:${now}
DTSTART:${startISO}
DTEND:${endISO}
SUMMARY:${event.title}
${event.location ? `LOCATION:${event.location}` : ''}
${event.notes ? `DESCRIPTION:${event.notes}` : ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

export function copyEventDetails(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  let details = `Event: ${event.title}\n`;
  details += `Start: ${formatDate(event.startTime)}\n`;
  details += `End: ${formatDate(event.endTime)}\n`;
  if (event.location) details += `Location: ${event.location}\n`;
  if (event.notes) details += `Notes: ${event.notes}\n`;

  return details;
}
