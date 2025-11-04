import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import AuthPage from './AuthPage'; // Import the new AuthPage

// This function will set the auth token for all future axios requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

function App() {
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const messagesEndRef = useRef(null);

  // --- New Auth Logic ---
  // On app load, check localStorage for an existing token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
    }
  }, []);

  // Function to be passed to AuthPage.js
  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken); // Save token to local storage
    setAuthToken(newToken); // Set token for future axios requests
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token'); // Remove token from local storage
    setAuthToken(null); // Clear token from axios
    setMessages([]); // Clear chat history
  };
  // --- End of New Auth Logic ---


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);

    const query = input;
    setInput('');

    try {
      // The token is already in the axios headers, so this request is now authenticated
      const response = await axios.post(
        'http://localhost:5000/api/ask',
        { query: query }
        // No need to pass headers here, they are set globally by setAuthToken
      );

      const botMessage = { sender: 'bot', text: response.data.answer };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Error fetching bot response:", error);
      let errorMessage = "Sorry, I'm having trouble connecting.";
      if (error.response && error.response.status === 401) {
        // Handle unauthorized error (e.g., token expired)
        errorMessage = "Your session has expired. Please log out and log back in.";
      }

      const errorMessageObj = { sender: 'bot', text: errorMessage };
      setMessages((prev) => [...prev, errorMessageObj]);
    }
  };

  // --- New Conditional Rendering ---
  // If no token, show the AuthPage. If there is a token, show the chat.
  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // This is your existing chat UI
  return (
    <div className="app-container">
      <aside className="sidebar">
        <button className="new-chat-btn">New Chat</button>
        {/* We can add a logout button here */}
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="chat-window">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about finance..."
          />
        </form>
      </main>
    </div>
  );
}

export default App;