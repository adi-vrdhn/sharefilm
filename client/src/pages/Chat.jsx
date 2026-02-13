import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";

const Chat = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const pollingIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load friends on mount
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const response = await api.get("/getFriends");
        setFriends(response.data);
      } catch (error) {
        setStatus("Failed to load friends");
      }
    };
    loadFriends();
  }, []);

  // Load messages when friend is selected
  useEffect(() => {
    if (!selectedFriend) {
      setMessages([]);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/getMessages?with=${selectedFriend.id}`);
        setMessages(response.data);
      } catch (error) {
        setStatus("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();

    // Set up real-time polling every 1.5 seconds
    const pollMessages = setInterval(async () => {
      try {
        const response = await api.get(`/getMessages?with=${selectedFriend.id}`);
        setMessages(response.data);
      } catch (error) {
        // Silent fail for polling to avoid spamming errors
      }
    }, 1500);

    pollingIntervalRef.current = pollMessages;

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedFriend]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    setStatus("");
    try {
      const response = await api.post("/sendMessage", {
        to: selectedFriend.id,
        content: newMessage
      });
      setMessages([...messages, response.data]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to send message");
    }
  };

  return (
    <div className="container">
      <h1>Messages</h1>
      <p className="helper-text">Chat with your friends.</p>

      <div className="chat-container">
        {/* Friends List */}
        <div className="chat-sidebar">
          <h3>Friends</h3>
          {friends.length === 0 ? (
            <p className="helper-text">No friends yet</p>
          ) : (
            <div className="friends-list">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  className={`friend-item ${
                    selectedFriend?.id === friend.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedFriend(friend)}
                >
                  {friend.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="chat-main">
          {selectedFriend ? (
            <>
              <div className="chat-header">
                <h2>{selectedFriend.name}</h2>
              </div>

              <div className="messages-list">
                {loading ? (
                  <p className="helper-text">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="helper-text">No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${
                        msg.sender.id === selectedFriend.id
                          ? "message-received"
                          : "message-sent"
                      }`}
                    >
                      <p className="message-content">{msg.content}</p>
                      <p className="message-time">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-form" onSubmit={handleSend}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !newMessage.trim()}>
                  Send
                </button>
              </form>

              {status && <p className="helper-text" style={{ color: "red" }}>{status}</p>}
            </>
          ) : (
            <div className="chat-empty">
              <p className="helper-text">Select a friend to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
