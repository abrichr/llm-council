import { useState, useEffect, useRef, memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import './ChatInterface.css';

// Memoized user message to prevent re-rendering on input changes
const UserMessage = memo(function UserMessage({ content }) {
  return (
    <div className="user-message">
      <div className="message-label">You</div>
      <div className="message-content">
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
});

// Memoized assistant message
const AssistantMessage = memo(function AssistantMessage({ msg }) {
  return (
    <div className="assistant-message">
      <div className="message-label">LLM Council</div>

      {/* Stage 1 */}
      {msg.loading?.stage1 && (
        <div className="stage-loading">
          <div className="spinner"></div>
          <span>Running Stage 1: Collecting individual responses...</span>
        </div>
      )}
      {msg.stage1 && <Stage1 responses={msg.stage1} />}

      {/* Stage 2 */}
      {msg.loading?.stage2 && (
        <div className="stage-loading">
          <div className="spinner"></div>
          <span>Running Stage 2: Peer rankings...</span>
        </div>
      )}
      {msg.stage2 && (
        <Stage2
          rankings={msg.stage2}
          labelToModel={msg.metadata?.label_to_model}
          aggregateRankings={msg.metadata?.aggregate_rankings}
        />
      )}

      {/* Stage 3 */}
      {msg.loading?.stage3 && (
        <div className="stage-loading">
          <div className="spinner"></div>
          <span>Running Stage 3: Final synthesis...</span>
        </div>
      )}
      {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
    </div>
  );
});

// Export button component
function ExportButton({ messages }) {
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    // Build clean conversation export (user messages + Stage 3 only)
    const lines = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        lines.push(`## User\n\n${msg.content}\n`);
      } else if (msg.stage3?.response) {
        lines.push(`## Assistant\n\n${msg.stage3.response}\n`);
      }
    }

    const exportText = lines.join('\n---\n\n');

    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      className={`export-button ${copied ? 'copied' : ''}`}
      onClick={handleExport}
      title="Export conversation (User + Final Answers only)"
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Clean
        </>
      )}
    </button>
  );
}

// Memoized messages list
const MessagesList = memo(function MessagesList({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="messages-container">
        <div className="empty-state">
          <h2>Start a conversation</h2>
          <p>Ask a question to consult the LLM Council</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {messages.length > 0 && (
        <div className="conversation-toolbar">
          {messages.length > 2 && (
            <div className="context-indicator">
              💭 Using conversation context ({messages.length} messages)
            </div>
          )}
          <ExportButton messages={messages} />
        </div>
      )}
      {messages.map((msg, index) => (
        <div key={index} className="message-group">
          {msg.role === 'user' ? (
            <UserMessage content={msg.content} />
          ) : (
            <AssistantMessage msg={msg} />
          )}
        </div>
      ))}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Consulting the council...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
});

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <h2>Welcome to LLM Council</h2>
          <p>Create a new conversation to get started</p>
        </div>
      </div>
    );
  }

  const placeholder = conversation.messages.length === 0
    ? "Ask your question... (Shift+Enter for new line, Enter to send)"
    : "Ask a follow-up question...";

  return (
    <div className="chat-interface">
      <MessagesList messages={conversation.messages} isLoading={isLoading} />

      <form className="input-form" onSubmit={handleSubmit}>
        <textarea
          className="message-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={3}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!input.trim() || isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
