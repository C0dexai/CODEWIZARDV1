import React, { useState, useEffect } from 'react';
import { CodeIcon, GithubIcon } from './components/Icons';
import EditorPanel from './components/AgentsPanel';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import LoginPage from './components/LoginPage';

type View = 'app' | 'terms' | 'privacy';

// Mock user data for display after login
const MOCK_USER = {
  name: 'CodeWizard',
  avatarUrl: 'https://github.com/github.png?size=40'
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('app');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check session storage for login state on initial load
  useEffect(() => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // Add/remove landing page background class from body
  useEffect(() => {
    if (!isLoggedIn) {
        document.body.classList.add('landing-background');
    } else {
        document.body.classList.remove('landing-background');
    }
    // Cleanup on component unmount
    return () => document.body.classList.remove('landing-background');
  }, [isLoggedIn]);


  const handleLogin = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('isLoggedIn', 'true');
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
    setCurrentView('app'); // Ensure we show the login page after logout
  };

  const AppHeader = () => (
    <header className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-sm border-b border-[var(--neon-purple)]">
      {isLoggedIn ? (
        <div className="flex items-center gap-3">
           <img src={MOCK_USER.avatarUrl} alt="user avatar" className="h-9 w-9 rounded-full border-2 border-[var(--neon-purple)]" />
           <div>
              <span className="font-bold text-white">{MOCK_USER.name}</span>
              <button onClick={handleLogout} className="text-xs text-[var(--neon-blue)] hover:text-[var(--neon-pink)] ml-3 transition-colors">Logout</button>
           </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
           <CodeIcon className="h-8 w-8 text-[var(--neon-purple)]" />
           <h1 className="text-2xl font-bold tracking-wider" style={{textShadow: '0 0 5px var(--neon-purple)'}}>Live Web Dev Sandbox</h1>
        </div>
      )}
      
      {isLoggedIn && (
         <div>
          <a 
            href="https://github.com/google/generative-ai-docs/tree/main/site/en/tutorials/web" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[var(--neon-pink)] transition-colors"
            aria-label="View source on GitHub"
            title="View source on GitHub"
          >
            <GithubIcon className="h-7 w-7" />
          </a>
        </div>
      )}
    </header>
  );

  const renderContent = () => {
    if (!isLoggedIn) {
      return <LoginPage onLogin={handleLogin} />;
    }
    
    switch (currentView) {
      case 'terms':
        return <TermsOfService onClose={() => setCurrentView('app')} />;
      case 'privacy':
        return <PrivacyPolicy onClose={() => setCurrentView('app')} />;
      case 'app':
      default:
        return <EditorPanel />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-transparent text-[var(--text-color)] font-sans">
      <AppHeader />
      
      <main className="flex-grow flex flex-col overflow-hidden">
        {renderContent()}
      </main>
      
      <footer className="bg-black/30 backdrop-blur-sm border-t border-[var(--neon-purple)] p-3 text-center text-xs text-gray-400">
        <p className="mb-2">
          An interactive web development environment.
        </p>
        <div>
          <button onClick={() => setCurrentView('terms')} className="hover:underline text-[var(--neon-blue)] hover:text-[var(--neon-pink)] mx-2 transition-colors">Terms of Service</button>
          |
          <button onClick={() => setCurrentView('privacy')} className="hover:underline text-[var(--neon-blue)] hover:text-[var(--neon-pink)] mx-2 transition-colors">Privacy Policy</button>
        </div>
      </footer>
    </div>
  );
};

export default App;