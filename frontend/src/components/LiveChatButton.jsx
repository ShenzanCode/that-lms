import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import LiveChatWindow from './LiveChatWindow';
import { chatService } from '@/services/chatService';

export default function LiveChatButton({ enabled = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Check for existing active session on mount
  useEffect(() => {
    const checkForActiveSession = async () => {
      try {
        // Only check for existing sessions, don't create a new one
        const response = await chatService.getMemberSessions();
        const sessions = response.data || [];
        
        // Find an active session (neither party has left)
        const activeSession = sessions.find(s => !s.memberLeft && !s.adminLeft);
        
        if (activeSession) {
          setHasActiveSession(true);
          setUnreadCount(activeSession.unreadCountMember || 0);
        }
      } catch (error) {
        console.error('Error checking for active session:', error);
      }
    };
    
    if (enabled && !isOpen) {
      checkForActiveSession();
    }
  }, [enabled, isOpen]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
            style={{
              background: hasActiveSession 
                ? 'linear-gradient(135deg, #011039 0%, #E76800 100%)' 
                : 'linear-gradient(135deg, #011039 0%, #E76800 100%)',
            }}
          >
            <MessageCircle className="h-6 w-6 text-white" />
            
            {/* Unread Badge or Active Indicator */}
            {unreadCount > 0 ? (
              <div className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            ) : hasActiveSession && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full" style={{ backgroundColor: '#E76800' }}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {hasActiveSession ? 'Resume Chat' : 'Get Help'}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <LiveChatWindow
          onClose={() => {
            setIsOpen(false);
            setHasActiveSession(false);
          }}
          onUnreadCountChange={setUnreadCount}
        />
      )}
    </>
  );
}
