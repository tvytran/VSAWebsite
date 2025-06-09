import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AnnouncementsSidebar() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError('');
      try {
        // Use the public announcements endpoint
        const apiUrl = 'http://localhost:5001/api/posts/announcements';
        console.log(`Fetching announcements from: ${apiUrl}`);
        const res = await axios.get(apiUrl);
        setAnnouncements(res.data.posts || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
        setError('Failed to load announcements.');
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const truncateText = (text, id) => {
    // Regex to find raw URLs
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/|=~_|])/gi;
    // Regex to find markdown links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const renderTextWithLinks = (contentText) => {
      const elements = [];
      let lastIndex = 0;

      let match;
      // First find markdown links
      while ((match = markdownLinkRegex.exec(contentText)) !== null) {
        const precedingText = contentText.substring(lastIndex, match.index);
        // Process preceding text for raw URLs
        if (precedingText) {
          const urlParts = precedingText.split(urlRegex);
          urlParts.forEach((part, index) => {
            if (part.match(urlRegex)) { // Check if the part is a URL
              elements.push(<a key={`url-${lastIndex}-${index}`} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{part}</a>);
            } else {
              elements.push(<span key={`text-${lastIndex}-${index}`}>{part}</span>);
            }
          });
        }

        // Add the markdown link
        const linkText = match[1];
        const linkUrl = match[2];
        elements.push(<a key={`markdown-${match.index}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{linkText}</a>);

        lastIndex = markdownLinkRegex.lastIndex;
      }

      // Process any remaining text for raw URLs
      const remainingText = contentText.substring(lastIndex);
      if (remainingText) { // Check if remainingText is not empty
          const urlParts = remainingText.split(urlRegex);
          urlParts.forEach((part, index) => {
            if (part.match(urlRegex)) { // Check if the part is a URL
              elements.push(<a key={`url-end-${lastIndex}-${index}`} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{part}</a>);
            } else {
              elements.push(<span key={`text-end-${lastIndex}-${index}`}>{part}</span>);
            }
          });
      }

      return elements;
    };

    // Always render full text with links, no truncation
    return renderTextWithLinks(text);
  };

  return (
    <div className="w-full">
      {loading && <p className="text-gray-600">Loading announcements...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && announcements.length === 0 && (
        <p className="text-gray-600">No announcements yet.</p>
      )}

      {/* Display announcements in a scrollable container */}
      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {announcements.map(announcement => (
            <div 
              key={announcement.id} 
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-300 ease-in-out border-l-8 border-[#EFB639] transform"
            >
              <h3 className="font-bold text-gray-800 mb-2">{announcement.title}</h3>
              <p className="text-gray-600 text-sm mb-2">
                {truncateText(announcement.content, announcement.id)}
              </p>
              {announcement.image_path && (
                <img 
                  src={announcement.image_path}
                  alt="Announcement" 
                  className="mt-2 w-full object-cover rounded-md"
                />
              )}
              <div className="text-xs text-gray-500 mt-2">
                {announcement.created_at ? new Date(announcement.created_at).toLocaleString() : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsSidebar; 