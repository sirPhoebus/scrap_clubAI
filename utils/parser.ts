import { ExtractedLink, ParseResult } from '../types';

export const parseChatFile = (text: string): ParseResult => {
  const lines = text.split('\n');
  const links: ExtractedLink[] = [];
  const authors = new Set<string>();

  // Regex matches: [date, time] Author: Message
  const regex = /^\[(.*?)]\s(.*?):\s(.*)$/;
  // Fallback regex
  const fallbackRegex = /^(\d{1,4}[-./]\d{1,2}[-./]\d{1,4}.*?)\s-\s(.*?):\s(.*)$/;
  
  // URL Regex (simple)
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  lines.forEach((line) => {
    // Clean invisible characters
    const cleanLine = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    if (!cleanLine) return;

    let match = cleanLine.match(regex);
    if (!match) {
        match = cleanLine.match(fallbackRegex);
    }

    if (match) {
      const [_, dateStr, authorName, content] = match;
      const cleanAuthor = authorName.trim();
      const cleanDate = dateStr.trim();
      
      authors.add(cleanAuthor);

      // Find all URLs in this message line
      const foundUrls = content.match(urlRegex);

      if (foundUrls) {
        foundUrls.forEach((url) => {
          // Basic timestamp parsing attempt for sorting
          // If parsing fails, we use insertion order (via index roughly) or Date.now()
          let timestamp = Date.now();
          try {
            // Attempt to parse date string. This is highly dependent on locale
            // Removing brackets and trying standard parse
            const datePart = cleanDate.replace(/[\[\]]/g, '').replace(/,/g, '');
            const parsed = Date.parse(datePart);
            if (!isNaN(parsed)) {
              timestamp = parsed;
            }
          } catch (e) {
            // ignore date parse errors
          }

          links.push({
            id: crypto.randomUUID(),
            url: url,
            date: cleanDate,
            author: cleanAuthor,
            timestamp: timestamp,
            originalMessage: content.trim()
          });
        });
      }
    }
  });

  // Sort by date (oldest to newest based on requirement "Ordered by date")
  // If the log is already ordered, this might be redundant, but safe.
  // Note: The prompt says "Ordered by date". Usually chat logs are ascending. 
  // If the user wants newest first, we would reverse this. Let's assume Chronological.
  links.sort((a, b) => a.timestamp - b.timestamp);

  return {
    links,
    totalLinks: links.length,
    authors: Array.from(authors),
  };
};