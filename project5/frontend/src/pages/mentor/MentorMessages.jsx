import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Clock,
  CheckCheck,
  Circle,
} from 'lucide-react';

export default function MentorMessages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMenteeTyping, setIsMenteeTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchMentees();
  }, []);

  const fetchMentees = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/mentors/my-students');
      const list = res.data?.data || [];
      setMentees(list);
      if (list.length > 0) {
        selectMentee(list[0]);
      }
    } catch (err) {
      console.error('Error fetching mentees:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectMentee = async (mentee) => {
    setSelectedMentee(mentee);
    try {
      const res = await axiosClient.get(`/messages/thread/${mentee._id}`);
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching thread:', err);
    }
  };

  useEffect(() => {
    if (!socket || !selectedMentee?._id) return;

    const handleReceiveMessage = (newMsg) => {
      if (
        newMsg.sender === selectedMentee._id ||
        newMsg.sender?._id === selectedMentee._id ||
        newMsg.sender === user?._id ||
        newMsg.sender?._id === user?._id
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    const handleTyping = (data) => {
      if (data.senderId === selectedMentee._id) {
        setIsMenteeTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (data.senderId === selectedMentee._id) {
        setIsMenteeTyping(false);
      }
    };

        // Listen for incoming new messages
    const handleMessageNew = (newMsg) => {
      const isRelevant =
        newMsg.senderId &&
        (newMsg.senderId._id === selectedMentee?._id || newMsg.receiverId._id === selectedMentee?._id ||
          newMsg.senderId._id === user?._id || newMsg.receiverId._id === user?._id);
      if (isRelevant) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        // Acknowledge delivery
        socket.emit('message:delivered', { messageId: newMsg._id });
      }
    };

    const handleTypingStatus = (data) => {
      if (data.senderId === selectedMentee?._id) {
        setIsMenteeTyping(data.isTyping);
      }
    };

    socket.on('message:new', handleMessageNew);
    socket.on('typing:status', handleTypingStatus);

    return () => {
      socket.off('message:new', handleMessageNew);
      socket.off('typing:status', handleTypingStatus);
    };
  }, [socket, selectedMentee, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMenteeTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedMentee?._id) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const res = await axiosClient.post('/messages', {
        receiverId: selectedMentee._id,
        content,
      });

      const sentMsg = res.data?.data;
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }

      if (socket) {
        socket.emit('stop_typing', { recipientId: selectedMentee._id });
      }
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !selectedMentee?._id) return;

    socket.emit('typing', { recipientId: selectedMentee._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { recipientId: selectedMentee._id });
    }, 1500);
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading messaging center..." />;

  const filteredMentees = mentees.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.usn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Left Sidebar: Mentees List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50/50 dark:bg-slate-900/40">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search mentees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus-role"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filteredMentees.map((m) => {
            const isSelected = selectedMentee?._id === m._id;
            return (
              <button
                key={m._id}
                onClick={() => selectMentee(m)}
                className={`w-full p-3.5 text-left flex items-center gap-3 transition ${
                  isSelected
                    ? 'bg-role-soft dark:bg-role-soft-dark border-l-4 border-role-primary'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {m.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {m.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {m.usn} • Sem {m.currentSemester || 1}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Active Thread */}
      {selectedMentee ? (
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-role-primary text-white flex items-center justify-center font-bold text-xs">
                {selectedMentee.name?.[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {selectedMentee.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedMentee.usn} • {selectedMentee.department} • CGPA: {selectedMentee.cgpa?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-indigo-300 rounded-lg">
              Mentee Channel
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
            {messages.length > 0 ? (
              messages.map((m) => {
                const isMine =
                  m.sender === user?._id ||
                  m.sender?._id === user?._id;

                return (
                  <div
                    key={m._id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[65%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMine
                          ? 'bg-role-primary text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none'
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
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No messages with {selectedMentee.name} yet.</p>
                <p className="text-[11px]">Send guidance or discuss upcoming assessments.</p>
              </div>
            )}

            {isMenteeTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic">
                <span>{selectedMentee.name} is typing...</span>
                <span className="w-1.5 h-1.5 bg-role-primary rounded-full animate-bounce" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Send guidance to ${selectedMentee.name}...`}
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-role-primary hover:bg-role-primary disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
          Select a mentee to start conversation.
        </div>
      )}
    </div>
  );
}
