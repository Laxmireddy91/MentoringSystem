import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCheck,
  ShieldAlert,
} from 'lucide-react';

export default function StudentMessages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMentorTyping, setIsMentorTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchMentorAndMessages();
  }, []);

  const fetchMentorAndMessages = async () => {
    setLoading(true);
    try {
      const profRes = await axiosClient.get('/students/profile');
      const assignedMentor = profRes.data?.data?.mentor;
      setMentor(assignedMentor);

      if (assignedMentor?._id) {
        const msgRes = await axiosClient.get(`/messages/thread/${assignedMentor._id}`);
        setMessages(msgRes.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !mentor?._id) return;

    // Listen for incoming new messages
    const handleReceiveMessage = (newMsg) => {
      if (
        (newMsg.sender === mentor._id || newMsg.sender?._id === mentor._id) ||
        (newMsg.sender === user?._id || newMsg.sender?._id === user?._id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    const handleTyping = (data) => {
      if (data.senderId === mentor._id) {
        setIsMentorTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (data.senderId === mentor._id) {
        setIsMentorTyping(false);
      }
    };

        // Listen for incoming new messages
    const handleMessageNew = (newMsg) => {
      // newMsg contains populated senderId and receiverId
      const isRelevant =
        newMsg.senderId &&
        (newMsg.senderId._id === mentor?._id || newMsg.receiverId._id === mentor?._id ||
          newMsg.senderId._id === user?._id || newMsg.receiverId._id === user?._id);
      if (isRelevant) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        // Acknowledge delivery to server
        socket.emit('message:delivered', { messageId: newMsg._id });
      }
    };

    const handleTypingStatus = (data) => {
      if (data.senderId === mentor?._id) {
        setIsMentorTyping(data.isTyping);
      }
    };

    socket.on('message:new', handleMessageNew);
    socket.on('typing:status', handleTypingStatus);

    return () => {
      socket.off('message:new', handleMessageNew);
      socket.off('typing:status', handleTypingStatus);
    };
  }, [socket, mentor, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMentorTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !mentor?._id) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const res = await axiosClient.post('/messages', {
        receiverId: mentor._id,
        content,
      });

      const sentMsg = res.data?.data;
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }

      if (socket) {
        socket.emit('stop_typing', { recipientId: mentor._id });
      }
    } catch (err) {
      alert('Failed to deliver message.');
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !mentor?._id) return;

    socket.emit('typing', { recipientId: mentor._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { recipientId: mentor._id });
    }, 1500);
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Connecting to secure mentoring channel..." />;

  if (!mentor) {
    return (
      <div className="p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
        <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-amber-500" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Mentor Assigned Yet</h3>
        <p className="text-xs text-slate-500 mt-1">Please contact your department HOD to assign your faculty mentor.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Chat Top Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {mentor.name?.[0]}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              {mentor.name}
              <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
            </h3>
            <p className="text-[11px] text-slate-500">
              {mentor.department || ''} Faculty Mentor{mentor.officeRoom ? ` • ${mentor.officeRoom}` : ''}
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline-block">
          End-to-End Logged Mentoring Chat
        </span>
      </div>

      {/* Message History Feed */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-50/40 dark:bg-slate-900/30">
        {messages.length > 0 ? (
          messages.map((m) => {
            const isMine =
              m.sender === user?._id ||
              m.sender?._id === user?._id ||
              m.sender?.usn === user?.usn;

            return (
              <div
                key={m._id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[65%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isMine
                      ? 'bg-role-primary text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                  }`}
                >
                  <p>{m.content}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMine && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 space-y-1">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-semibold">No previous messages with {mentor.name}.</p>
            <p className="text-[11px]">Send a greeting or query to initiate discussion.</p>
          </div>
        )}

        {isMentorTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic">
            <span>{mentor.name} is typing...</span>
            <span className="w-1.5 h-1.5 bg-role-primary rounded-full animate-bounce" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Message ${mentor.name}...`}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2.5 bg-role-primary hover:bg-role-primary disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
