import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, HelpCircle, ChevronRight } from 'lucide-react';

const FAQ_DATA = [
  {
    category: 'Academics & Grading',
    questions: [
      {
        q: 'How is CIE calculated?',
        a: 'Continuous Internal Evaluation (CIE) considers the best 2 out of 3 internal test marks (each out of 50) scaled down to 40 marks, plus 10 marks for assignments/quizzes, giving a total of 50 CIE marks.',
      },
      {
        q: 'How is SGPA & CGPA computed?',
        a: 'SGPA is calculated as the sum of (Credits × Grade Points) divided by the total semester credits. CGPA is the cumulative weighted average of all semesters completed to date on a 10.0 scale.',
      },
      {
        q: 'What is the grading scale?',
        a: 'Grades: O (90-100%, 10 pts), A+ (80-89%, 9 pts), A (70-79%, 8 pts), B+ (60-69%, 7 pts), B (55-59%, 6 pts), C (50-54%, 5 pts), P (40-49%, 4 pts), F (<40%, 0 pts / Backlog).',
      },
    ],
  },
  {
    category: 'Mentoring & Sessions',
    questions: [
      {
        q: 'How do I book a session with my mentor?',
        a: 'Navigate to "Sessions" in your dashboard, click "Book Office Hours", pick an available open slot from your assigned mentor, select the mode (in-person/online), and submit your agenda.',
      },
      {
        q: 'Can I submit feedback after a mentoring session?',
        a: 'Yes! Once a session is completed by your mentor, a "Provide Feedback" action appears in your session history where you can rate 1-5 stars and leave comments.',
      },
      {
        q: 'Who is my assigned mentor?',
        a: 'Your mentor details (Name, Department, Email, Office) are displayed on your Student Dashboard overview card and on the Sessions page.',
      },
    ],
  },
  {
    category: 'Risk Analysis & Alerts',
    questions: [
      {
        q: 'What does my Academic Risk Level mean?',
        a: 'Risk is computed using 3 academic parameters: Low CIE (<50% marks = 40% weight), Active Backlogs (40% weight), and Negative SGPA trends (20% weight). Levels range from Low to Critical.',
      },
      {
        q: 'How can I lower my risk score?',
        a: 'Attend remedial academic sessions, book one-on-one sessions with your mentor, clear backlogs, and focus on upcoming CIE exams.',
      },
    ],
  },
  {
    category: 'Goals & Achievements',
    questions: [
      {
        q: 'How do I upload achievement certificates?',
        a: 'Go to "Achievements", click "Add Achievement", fill in the title, category, and attach certificate files (PDF, PNG, JPG). You can also download your entire certificate portfolio as a ZIP file!',
      },
      {
        q: 'What are Academic Badges?',
        a: 'Badges are automatically unlocked based on milestones such as "Academic Star" (CGPA >= 9.0), "Backlog Buster" (0 backlogs), "Goal Crusher" (5+ completed goals), and "Consistent Improver".',
      },
    ],
  },
];

export default function FaqChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am MentorBot, your academic mentoring assistant. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const findAnswer = (query) => {
    const qLower = query.toLowerCase().trim();
    let bestMatch = null;

    for (const group of FAQ_DATA) {
      for (const item of group.questions) {
        if (qLower.includes(item.q.toLowerCase()) || item.q.toLowerCase().includes(qLower)) {
          return item.a;
        }
        // Keyword match
        const keywords = item.q.toLowerCase().split(' ').filter((w) => w.length > 3);
        const matchCount = keywords.filter((k) => qLower.includes(k)).length;
        if (matchCount >= 2) {
          bestMatch = item.a;
        }
      }
    }

    if (bestMatch) return bestMatch;

    if (qLower.includes('cie') || qLower.includes('internal') || qLower.includes('test')) {
      return 'Continuous Internal Evaluation (CIE) uses your best 2 of 3 internal tests scaled to 40 marks + 10 marks for assignments (Total: 50 marks).';
    }
    if (qLower.includes('sgpa') || qLower.includes('cgpa') || qLower.includes('gpa') || qLower.includes('grade')) {
      return 'SGPA is calculated per semester based on credits & 10-point grades (O, A+, A, B+, B, C, P, F). CGPA is the cumulative aggregate across all completed semesters.';
    }
    if (qLower.includes('session') || qLower.includes('book') || qLower.includes('appointment') || qLower.includes('mentor')) {
      return 'You can book mentoring sessions via the "Sessions" tab by choosing from your mentor\'s available office hours slots.';
    }
    if (qLower.includes('risk') || qLower.includes('warning') || qLower.includes('alert')) {
      return 'The Academic Risk engine evaluates CIE marks, backlogs, and semester GPA trends to flag students needing mentoring support.';
    }
    if (qLower.includes('report') || qLower.includes('pdf') || qLower.includes('transcript')) {
      return 'You can download your official PDF Progress Report Card directly from the "Academics" page by clicking "Download PDF Report".';
    }
    if (qLower.includes('parent') || qLower.includes('father') || qLower.includes('mother')) {
      return 'Parents can log in with their registered phone number and password to view their ward\'s academic progress, semester SGPA, risk status, and mentor notes.';
    }

    return "I couldn't find a direct answer for that. Try asking about CIE calculation, SGPA/CGPA, booking mentor sessions, academic risk levels, or downloading PDF report cards!";
  };

  const handleSend = (textToSend = null) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = findAnswer(text);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          aria-label="Open Mentoring FAQ Assistant"
        >
          <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
          <span className="text-sm font-semibold tracking-wide">Ask MentorBot</span>
        </button>
      )}

      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">MentorBot Assistant</h4>
                <p className="text-[11px] text-indigo-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
                  Instant Mentoring & Academic FAQ
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick FAQ Chips */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-none flex gap-1.5 flex-nowrap text-xs">
            <button
              onClick={() => handleSend('How is CIE calculated?')}
              className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-role-primary dark:hover:text-indigo-400 transition"
            >
              📊 CIE Formula
            </button>
            <button
              onClick={() => handleSend('How is SGPA & CGPA computed?')}
              className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-role-primary dark:hover:text-indigo-400 transition"
            >
              🎓 SGPA / CGPA
            </button>
            <button
              onClick={() => handleSend('How do I book a session with my mentor?')}
              className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-role-primary dark:hover:text-indigo-400 transition"
            >
              📅 Book Session
            </button>
            <button
              onClick={() => handleSend('What does my Academic Risk Level mean?')}
              className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-role-primary dark:hover:text-indigo-400 transition"
            >
              ⚠️ Risk Engine
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-900/40">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[88%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-role-primary text-white'
                      : 'bg-role-soft text-role-primary dark:bg-role-primary/60 dark:text-indigo-300'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-role-primary text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block px-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 mr-auto items-center text-xs text-slate-500 dark:text-slate-400 italic">
                <div className="w-7 h-7 rounded-full bg-role-soft dark:bg-role-primary/50 flex items-center justify-center text-role-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-3 py-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-role-primary rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-role-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-role-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about grades, risk, sessions..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-role-primary hover:bg-role-primary disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-sm transition"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
