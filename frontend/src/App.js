import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import AuthPage from './AuthPage'; // Import the AuthPage

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

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setAuthToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setAuthToken(null);
    setMessages([]);
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

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
      const response = await axios.post(
        'http://localhost:5000/api/ask',
        { query: query }
      );

      const botMessage = { sender: 'bot', text: response.data.answer };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Error fetching bot response:", error);
      let errorMessage = "Sorry, I'm having trouble connecting.";
      if (error.response && error.response.status === 401) {
        errorMessage = "Your session has expired. Please log out and log back in.";
      }

      const errorMessageObj = { sender: 'bot', text: errorMessage };
      setMessages((prev) => [...prev, errorMessageObj]);
    }
  };

  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // --- HTML Structure Updated ---
  return (
    <div className="app-container">
      {/* --- Buttons moved to a new top bar --- */}
      <header className="top-bar">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Switch Theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          🚪
        </button>
      </header>

      {/* --- Sidebar <aside> REMOVED --- */}

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

