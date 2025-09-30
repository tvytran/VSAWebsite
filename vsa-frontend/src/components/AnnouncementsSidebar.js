import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api'; // Corrected import path

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
        // Use the public announcements endpoint with a relative path
        const res = await api.get('/api/posts/announcements');
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
    // Decode any HTML entities first
    const decodeHtml = (str) => {
      if (typeof window === 'undefined' || !str) return str || '';
      const txt = document.createElement('textarea');
      txt.innerHTML = str;
      return txt.value;
    };
    const safeText = decodeHtml(text);
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

    // Preserve line breaks similar to Instagram by splitting on newlines
    const lines = String(safeText).split('\n');
    return (
      <>
        {lines.map((line, i) => (
          <React.Fragment key={`ann-ln-${id}-${i}`}>
            {renderTextWithLinks(line)}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
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
            <Link
              key={announcement.id}
              to={`/post/${announcement.id}`}
              className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-300 ease-in-out border-l-8 border-[#EFB639] transform cursor-pointer"
            >
              <h3 className="font-bold text-gray-800 mb-2">{announcement.title}</h3>
              <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsSidebar; 