import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}) {
  const handleConversationClick = (e, id) => {
    // Allow cmd+click (Mac) or ctrl+click (Windows) to open in new tab
    if (e.metaKey || e.ctrlKey) {
      // Let the default anchor behavior handle it
      return;
    }
    e.preventDefault();
    onSelectConversation(id);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>LLM Council</h1>
        <button className="new-conversation-btn" onClick={onNewConversation}>
          + New Conversation
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <a
              key={conv.id}
              href={`?conversation=${conv.id}`}
              className={`conversation-item ${
                conv.id === currentConversationId ? 'active' : ''
              }`}
              onClick={(e) => handleConversationClick(e, conv.id)}
            >
              <div className="conversation-title">
                {conv.title || 'New Conversation'}
              </div>
              <div className="conversation-meta">
                {conv.message_count} messages
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
