import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/messages.css";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-select friend from URL
  useEffect(() => {
    const friendId = searchParams.get("with");
    if (friendId && conversations.length > 0) {
      const friend = conversations.find((c) => c.friend.id === parseInt(friendId));
      if (friend) {
        handleSelectFriend(friend.friend);
      }
    }
  }, [searchParams, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await api.get("/getConversations");
      setConversations(response.data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend);
    setShowProfile(false);
    setSearchParams({ with: friend.id });
    
    try {
      const response = await api.get("/getMessages", {
        params: { with: friend.id }
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || sending) return;

    setSending(true);
    try {
      const response = await api.post("/sendMessage", {
        to: selectedFriend.id,
        content: newMessage.trim()
      });
      
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
      
      // Update conversation list with new last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.friend.id === selectedFriend.id
            ? {
                ...conv,
                lastMessage: {
                  content: newMessage.trim(),
                  createdAt: new Date(),
                  senderId: user.id
                }
              }
            : conv
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="messages-loading">
        <div className="loading-spinner">🎬</div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {/* Conversations List */}
      <div className={`conversations-panel ${selectedFriend ? "hidden-mobile" : ""}`}>
        <div className="conversations-header">
          <h2>{user?.username}</h2>
        </div>
        
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>No conversations yet</p>
              <span className="helper-text">Add friends to start chatting</span>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.friend.id}
                className={`conversation-item ${
                  selectedFriend?.id === conv.friend.id ? "active" : ""
                }`}
                onClick={() => handleSelectFriend(conv.friend)}
              >
                <div className="conversation-avatar">
                  {conv.friend.profilePicture ? (
                    <img src={conv.friend.profilePicture} alt={conv.friend.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {conv.friend.name?.[0] || "U"}
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount}</span>
                  )}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">{conv.friend.name}</div>
                  {conv.lastMessage && (
                    <div className="conversation-preview">
                      {conv.lastMessage.senderId === user.id && "You: "}
                      {conv.lastMessage.content.substring(0, 30)}
                      {conv.lastMessage.content.length > 30 && "..."}
                    </div>
                  )}
                </div>
                <div className="conversation-time">
                  {conv.lastMessage && formatTime(conv.lastMessage.createdAt)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {selectedFriend ? (
        <div className="chat-panel">
          {/* Chat Header */}
          <div className="chat-header">
            <button
              className="back-btn mobile-only"
              onClick={() => setSelectedFriend(null)}
            >
              ←
            </button>
            <div
              className="chat-header-user"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="chat-avatar">
                {selectedFriend.profilePicture ? (
                  <img src={selectedFriend.profilePicture} alt={selectedFriend.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {selectedFriend.name?.[0] || "U"}
                  </div>
                )}
              </div>
              <div className="chat-user-info">
                <div className="chat-user-name">{selectedFriend.name}</div>
                <div className="chat-user-username">@{selectedFriend.username}</div>
              </div>
            </div>
            <button className="info-btn" onClick={() => setShowProfile(!showProfile)}>
              ⓘ
            </button>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="empty-messages">
                <p>No messages yet</p>
                <span className="helper-text">Start the conversation!</span>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn = msg.sender_id === user.id;
                const showAvatar =
                  index === messages.length - 1 ||
                  messages[index + 1]?.sender_id !== msg.sender_id;

                return (
                  <div
                    key={msg.id}
                    className={`message-wrapper ${isOwn ? "own" : "other"}`}
                  >
                    <div className={`message-bubble ${isOwn ? "own" : "other"}`}>
                      {!isOwn && showAvatar && (
                        <div className="message-avatar">
                          {selectedFriend.profilePicture ? (
                            <img
                              src={selectedFriend.profilePicture}
                              alt={selectedFriend.name}
                            />
                          ) : (
                            <div className="avatar-placeholder-small">
                              {selectedFriend.name?.[0] || "U"}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="message-content">
                        <p>{msg.content}</p>
                        <span className="message-time">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form className="message-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="message-input"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      ) : (
        <div className="no-chat-selected desktop-only">
          <div className="no-chat-icon">✉️</div>
          <h3>Your messages</h3>
          <p>Select a conversation to start chatting</p>
        </div>
      )}

      {/* Profile Sidebar */}
      {showProfile && selectedFriend && (
        <div className="profile-sidebar">
          <div className="profile-sidebar-header">
            <button className="close-btn" onClick={() => setShowProfile(false)}>
              ×
            </button>
          </div>
          <div className="profile-sidebar-body">
            <div className="profile-avatar-large">
              {selectedFriend.profilePicture ? (
                <img src={selectedFriend.profilePicture} alt={selectedFriend.name} />
              ) : (
                <div className="avatar-placeholder-large">
                  {selectedFriend.name?.[0] || "U"}
                </div>
              )}
            </div>
            <h3>{selectedFriend.name}</h3>
            <p className="profile-username">@{selectedFriend.username}</p>
            
            <div className="profile-actions">
              <button className="profile-action-btn">View Profile</button>
              <button className="profile-action-btn">Shared Movies</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
