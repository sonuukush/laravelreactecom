import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import api from '../utils/api';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    {
      sender: 'bot',
      text: 'Hi there! 👋 Main aapka AI shopping assistant hoon. Main aapko products recommend kar sakta hoon aur aapke order status ya return queries me help kar sakta hoon. Aaj main aapki kya help karoon?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Recommend a budget phone',
    'Best products shown',
    'Track my order',
    'Refund Policy kya hai?',
  ];

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || message;
    if (!text.trim()) return;

    // Clear input if sending from type field
    if (!textToSend) {
      setMessage('');
    }

    // Add user message to history
    const newHistory = [...history, { sender: 'user', text }];
    setHistory(newHistory);
    setLoading(true);

    try {
      // Send chat message along with previous history to backend
      const response = await api.post('/chatbot/message', {
        message: text,
        history: history.slice(-10), // Limit history context to last 10 messages to save token limit
      });

      setHistory((prev) => [...prev, { sender: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error('Chatbot API error:', error);
      let errorMsg = 'Sorry, server connection issue. Please check back later.';
      if (error.response && error.response.data && error.response.data.reply) {
        errorMsg = error.response.data.reply;
      }
      setHistory((prev) => [...prev, { sender: 'bot', text: errorMsg, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Helper to parse bold (**text**) and links ([text](url)) in Gemini response
  const renderMessageContent = (text) => {
    if (!text) return '';
    const parts = [];
    let lastIndex = 0;
    
    // Regex matches bold (**text**) or markdown links ([text](url))
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={matchIndex} className="font-bold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('[') && token.includes('](')) {
        const closingBracket = token.indexOf(']');
        const linkText = token.slice(1, closingBracket);
        const url = token.slice(closingBracket + 2, -1);

        if (url.startsWith('/')) {
          parts.push(
            <Link
              key={matchIndex}
              to={url}
              className="text-primary-300 font-medium underline hover:text-primary-200 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {linkText}
            </Link>
          );
        } else {
          parts.push(
            <a
              key={matchIndex}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-300 font-medium underline hover:text-primary-200 transition-colors"
            >
              {linkText}
            </a>
          );
        }
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.map((part, i) => {
      if (typeof part === 'string') {
        return part.split('\n').map((line, j) => (
          <React.Fragment key={`${i}-${j}`}>
            {line}
            {j < part.split('\n').length - 1 && <br />}
          </React.Fragment>
        ));
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20 hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer group"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6 group-hover:rotate-6 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-500"></span>
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[550px] w-96 max-w-[calc(100vw-2rem)] flex-col rounded-2xl glass-premium shadow-2xl transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/3 px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/20 text-primary-400">
                <Bot className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-dark-100"></span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  AI Assistant <Sparkles className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                </h3>
                <p className="text-[10px] text-gray-400">Online & Ready to Help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] items-start space-x-2 rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-red-500/10 border border-red-500/20 text-red-200 rounded-tl-none flex items-center gap-2'
                      : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                  }`}
                >
                  {msg.isError && <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
                  <span className="leading-relaxed break-words">
                    {renderMessageContent(msg.text)}
                  </span>
                </div>
              </div>
            ))}

            {/* Pulse typing loader */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] items-center space-x-1.5 rounded-2xl rounded-tl-none bg-white/5 border border-white/5 px-4 py-3 text-gray-400">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          {history.length <= 2 && !loading && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/5">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full bg-white/5 border border-white/8 px-2.5 py-1 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer Area */}
          <div className="border-t border-white/5 p-3 bg-dark-200/50">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 rounded-xl glass-input px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:ring-0 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !message.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-md shadow-primary-500/10"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}

export default Chatbot;
