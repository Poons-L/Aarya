export interface OCRResult {
  text: string;
  confidence: number;
  contact?: {
    name?: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
  };
}

export function parseBusinessCard(ocrText: string): OCRResult['contact'] {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);
  const contact: OCRResult['contact'] = {};

  const emailRegex = /[\w.+-]+@[\w.-]+\.\w+/i;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const urlRegex = /(https?:\/\/|www\.)[^\s]+/i;

  lines.forEach((line, index) => {
    if (emailRegex.test(line)) {
      const match = line.match(emailRegex);
      if (match) contact.email = match[0];
    } else if (phoneRegex.test(line)) {
      const match = line.match(phoneRegex);
      if (match) contact.phone = match[0];
    } else if (!contact.name && index === 0) {
      contact.name = line;
    } else if (!contact.title && index === 1 && !urlRegex.test(line)) {
      if (line.toLowerCase().includes('manager') ||
          line.toLowerCase().includes('director') ||
          line.toLowerCase().includes('engineer') ||
          line.toLowerCase().includes('designer') ||
          line.toLowerCase().includes('developer') ||
          line.toLowerCase().includes('ceo') ||
          line.toLowerCase().includes('cto') ||
          line.toLowerCase().includes('founder')) {
        contact.title = line;
      }
    } else if (!contact.company && !emailRegex.test(line) && !phoneRegex.test(line) && !urlRegex.test(line)) {
      if (index > 0 && (!contact.title || index > 1)) {
        contact.company = line;
      }
    }
  });

  return contact;
}

export function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'about', 'as', 'is', 'was', 'are', 'were',
    'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

export function generateSimpleSummary(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  if (sentences.length === 1) {
    return sentences[0].trim();
  }

  const firstSentence = sentences[0].trim();
  if (firstSentence.length > 100) {
    return firstSentence.substring(0, 97) + '...';
  }

  return firstSentence;
}
