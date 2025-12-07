export interface ExtractedLink {
  id: string;
  url: string;
  date: string; // String representation from chat
  author: string;
  timestamp: number; // For sorting
  originalMessage: string;
}

export interface ChatMessage {
  id: string;
  date: string;
  author: string;
  content: string;
}

export interface LinkMetadata {
  title?: string;
  description?: string;
  summary?: string; // New field for the longer extracted content
  image?: string;
  domain?: string;
  isLoading: boolean;
  error?: boolean;
}

export interface ParseResult {
  links: ExtractedLink[];
  totalLinks: number;
  authors: string[];
}