import { useState, useEffect } from 'react';
import { X, MessageCircle, User, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import socketService from '@/lib/socket';
import toast from 'react-hot-toast';

export default function NewChatPopup() {
  const [popup, setPopup] = useState(null);
  const [timeAgo, setTimeAgo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for new session popups
    socketService.onNewSessionPopup((data) => {
      console.log('🔔 New chat session popup:', data);
      setPopup(data);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {}); // Ignore if sound file doesn't exist
      } catch (error) {}
      
      // Auto-dismiss after 45 seconds if not interacted with
      setTimeout(() => {
        setPopup(null);
      }, 45000);
    });

    return () => {
      socketService.offNewSessionPopup();
    };
  }, []);

  // Update time ago every second
  useEffect(() => {
    if (!popup) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const timestamp = new Date(popup.timestamp);
      const seconds = Math.floor((now - timestamp) / 1000);
      
      if (seconds < 10) {
        setTimeAgo('Just now');
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [popup]);

  const handleAccept = () => {
    // Navigate to live-chat page with the session ID
    navigate('/live-chat', { 
      state: { 
        openSessionId: popup.sessionId,
        memberName: popup.memberName 
      } 
    });
    toast.success(`Opening chat with ${popup.memberName}`);
    setPopup(null);
  };

  const handleDismiss = () => {
    setPopup(null);
  };

  if (!popup) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm overflow-hidden">
        {/* Header with gradient */}
        <div 
          className="px-5 py-3.5 text-white flex items-center justify-between relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #011039 0%, #E76800 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
            </div>
            <div>
              <h3 className="font-bold text-sm">New Chat Request</h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition-all"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Member Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #011039 0%, #E76800 100%)' }}>
              {popup.memberName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-bold">{popup.memberName}</p>
              <p className="text-xs text-gray-500">Member ID: {popup.memberId?.slice(-8) || 'N/A'}</p>
            </div>
          </div>

          {/* Message Preview */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 mb-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 font-bold">First Message:</p>
            <p className="text-sm text-gray-700 line-clamp-2 italic">
              "{popup.message}"
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-bold hover:from-blue-700 hover:to-orange-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Reply Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-bold"
            >
              Later
            </button>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #011039 0%, #E76800 100%)' }}></div>
      </div>
    </div>
  );
}
