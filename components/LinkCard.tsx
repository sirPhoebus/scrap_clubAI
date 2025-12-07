import React, { useState, useEffect, useRef } from 'react';
import { ExtractedLink, LinkMetadata } from '../types';
import { Calendar, Globe, Image as ImageIcon, PlayCircle, ExternalLink, Twitter } from 'lucide-react';
import { LinkModal } from './LinkModal';

interface LinkCardProps {
  linkItem: ExtractedLink;
}

export const LinkCard: React.FC<LinkCardProps> = ({ linkItem }) => {
  const [metadata, setMetadata] = useState<LinkMetadata>({
    isLoading: true,
    domain: new URL(linkItem.url).hostname.replace('www.', ''),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // Helper to detect YouTube
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasFetched.current) {
          fetchMetadata();
          hasFetched.current = true;
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [linkItem.url]);

  const fetchMetadata = async () => {
    const youtubeId = getYoutubeId(linkItem.url);
    const isTwitter = linkItem.url.includes('x.com') || linkItem.url.includes('twitter.com');

    // --- STRATEGY 1: Twitter / X (via FxTwitter API) ---
    if (isTwitter) {
      // Extract Tweet ID
      const match = linkItem.url.match(/\/status\/(\d+)/);
      const tweetId = match ? match[1] : null;

      if (tweetId) {
        try {
          // api.fxtwitter.com returns clean JSON for tweets
          // We use corsproxy to ensure we don't get blocked by CORS policies in the browser
          const apiUrl = `https://api.fxtwitter.com/status/${tweetId}`;
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
          
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Tweet fetch failed");
          
          const data = await response.json();
          const tweet = data.tweet;

          if (!tweet) throw new Error("No tweet data");

          // Safe string conversions
          const authorName = String(tweet.author?.name || "Unknown");
          const screenName = String(tweet.author?.screen_name || "twitter");
          const tweetText = String(tweet.text || "");
          
          // Try to find an image (photo or video thumbnail)
          let imageUrl = '';
          if (tweet.media?.photos?.length > 0) {
            imageUrl = tweet.media.photos[0].url;
          } else if (tweet.media?.videos?.length > 0) {
            imageUrl = tweet.media.videos[0].thumbnail_url;
          } else if (tweet.author?.avatar_url) {
            imageUrl = tweet.author.avatar_url;
          }

          setMetadata(prev => ({
            ...prev,
            title: `Tweet by ${authorName} (@${screenName})`,
            description: tweetText,
            summary: tweetText,
            image: String(imageUrl || ''),
            isLoading: false,
            error: false,
            domain: 'x.com'
          }));
          return;

        } catch (e) {
          // Fallback if FxTwitter fails
          console.error("Twitter fetch error:", e);
          setMetadata(prev => ({
            ...prev,
            title: "X / Twitter Post",
            description: "Click to view this post on X.",
            summary: "Content could not be loaded automatically. Please visit the link to view the content.",
            isLoading: false,
            error: true
          }));
          return;
        }
      }
    }

    // --- STRATEGY 2: YouTube ---
    if (youtubeId) {
      try {
        const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
        
        // Fetch Title using Noembed
        const response = await fetch(`https://noembed.com/embed?url=${linkItem.url}`);
        const data = await response.json();

        setMetadata(prev => ({
          ...prev,
          title: String(data.title || "YouTube Video"),
          description: data.author_name ? `Video by ${String(data.author_name)}` : "",
          summary: `Watch "${String(data.title || 'this video')}" on YouTube.\n\nAuthor: ${String(data.author_name || 'Unknown')}\nProvider: YouTube`,
          image: thumbnailUrl,
          isLoading: false,
          error: false
        }));
      } catch (e) {
        setMetadata(prev => ({
          ...prev,
          title: "YouTube Video",
          image: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
          isLoading: false,
          error: false
        }));
      }
      return;
    }

    // --- STRATEGY 3: General Web Crawl ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(linkItem.url)}`;
      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Fetch failed");

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
      const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
      const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      const title = doc.querySelector('title')?.textContent;
      const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');

      let summaryText = ogDesc || metaDesc || "";

      if (summaryText.length < 200) {
        const paragraphs = Array.from(doc.querySelectorAll('p'));
        const extractedText = paragraphs
          .map(p => p.textContent?.trim() || "")
          .filter(text => text.length > 50)
          .slice(0, 3)
          .join('\n\n');
        
        if (extractedText) {
          summaryText = extractedText;
        }
      }

      if (summaryText.length > 1000) {
        summaryText = summaryText.substring(0, 1000) + "...";
      }

      setMetadata(prev => ({
        ...prev,
        title: String(ogTitle || title || linkItem.url),
        description: String(ogDesc || metaDesc || ''),
        summary: String(summaryText || "No summary available for this content."),
        image: ogImage || undefined,
        isLoading: false,
        error: false
      }));

    } catch (error) {
      setMetadata(prev => ({
        ...prev,
        title: linkItem.url,
        isLoading: false,
        error: true,
        summary: "Could not fetch content preview. The website might be blocking automated access."
      }));
    } finally {
        clearTimeout(timeoutId);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
      'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
      'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
      'bg-violet-500', 'bg-purple-500', 'bg-pink-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const showImage = !metadata.error && metadata.image;
  const isYoutube = metadata.domain?.includes('youtu');
  const isTwitter = metadata.domain?.includes('x.com') || metadata.domain?.includes('twitter');

  return (
    <>
      <div 
        ref={cardRef}
        onClick={() => setIsModalOpen(true)}
        className="group relative flex flex-col bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full cursor-pointer"
      >
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 pointer-events-none z-10 transition-colors" />

        <div className="relative w-full aspect-video bg-slate-900 overflow-hidden border-b border-slate-700/50">
          {metadata.isLoading ? (
            <div className="absolute inset-0 animate-pulse bg-slate-800 flex items-center justify-center">
              <ImageIcon className="text-slate-700" size={32} />
            </div>
          ) : showImage ? (
            <>
              <img 
                src={metadata.image} 
                alt={String(metadata.title || "Link preview")} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                   e.currentTarget.style.display = 'none';
                }}
              />
              {isYoutube && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                  <PlayCircle size={48} className="text-white opacity-80 group-hover:scale-110 transition-transform drop-shadow-lg" fill="rgba(0,0,0,0.5)" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500 p-4 text-center group-hover:bg-slate-750 transition-colors">
              {isTwitter ? <Twitter size={32} className="mb-2 opacity-50" /> : <Globe size={32} className="mb-2 opacity-50" />}
              <span className="text-xs font-mono font-medium text-slate-400">{String(metadata.domain)}</span>
            </div>
          )}
          
          <a 
            href={linkItem.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} 
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-blue-600 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
            title="Open directly"
          >
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="flex-1 p-4 flex flex-col">
          <h3 className="text-slate-100 font-semibold text-sm leading-snug mb-2 line-clamp-2 min-h-[2.5em]" title={metadata.title}>
            {metadata.isLoading ? "Loading preview..." : String(metadata.title || linkItem.url)}
          </h3>
          
          {metadata.description && !metadata.error && (
            <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
              {String(metadata.description)}
            </p>
          )}

          <div className="mt-auto pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${getAvatarColor(linkItem.author)} shadow-sm`}>
                {linkItem.author.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[80px] font-medium">{linkItem.author}</span>
            </div>
            
            <div className="flex items-center gap-1 opacity-70">
              <Calendar size={10} />
              <span>{linkItem.date.split(',')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      <LinkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        linkItem={linkItem}
        metadata={metadata}
      />
    </>
  );
};