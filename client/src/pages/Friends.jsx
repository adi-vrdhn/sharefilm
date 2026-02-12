import React, { useEffect, useState } from "react";
import api from "../api/axios";

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const loadFriends = async () => {
    try {
      const response = await api.get("/getFriends");
      setFriends(response.data);
    } catch (error) {
      setStatus("Failed to load friends");
    }
  };

  const searchUsers = async (query) => {
    if (!query) {
      setUsers([]);
      return;
    }

    try {
      const response = await api.get(`/discoverUsers?q=${encodeURIComponent(query)}`);
      setUsers(response.data);
    } catch (error) {
      setStatus("Failed to search users");
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleAddFriend = async (friendName) => {
    try {
      await api.post("/addFriend", { friendName });
      setStatus(`Added ${friendName}`);
      setSearch("");
      setUsers([]);
      loadFriends();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to add friend");
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/removeFriend/${id}`);
      setFriends((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      setStatus("Failed to remove friend");
    }
  };

  return (
    <div className="container">
      <h1>My Friends</h1>
      <p className="helper-text">Add friends to share movie recommendations.</p>

      <div className="form-card" style={{ marginTop: 20, marginBottom: 20 }}>
        <div className="form-row autocomplete">
          <label>Search Users</label>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a username"
          />
          {users.length > 0 && (
            <div className="autocomplete-list">
              {users.map((user) => (
                <div
                  className="autocomplete-item"
                  key={user.id}
                  onClick={() => handleAddFriend(user.name)}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <strong>{user.name}</strong>
                    <div className="helper-text">{user.email}</div>
                  </div>
                  <button className="secondary" style={{ padding: "6px 12px" }}>
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {status && <p className="helper-text">{status}</p>}

      <div className="card-grid">
        {friends.map((friend) => (
          <div className="notice-card" key={friend.id}>
            <div>
              <strong>{friend.name}</strong>
              <div className="helper-text">{friend.email}</div>
            </div>
            <button className="secondary" onClick={() => handleRemove(friend.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      {friends.length === 0 && <p className="helper-text">No friends yet. Search and add someone!</p>}
    </div>
  );
};

export default Friends;
