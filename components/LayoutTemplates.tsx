import React from 'react';
import { LayoutIcon } from './Icons';
import type { LayoutTemplateData } from '../types';

const layouts: LayoutTemplateData[] = [
    {
        id: 'api-showcase',
        name: 'API Showcase',
        description: 'A glass-morphism layout demonstrating Fetch API (GET/POST) with local data.',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Showcase</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main class="container">
        <div class="glass-panel">
            <h1>API Fetch Showcase</h1>
            <p>Examples of using the Fetch API to get and post data to local files.</p>
            
            <div class="api-section">
                <h2>GET JSON Data</h2>
                <p>Fetch user data from <code>/api/data.json</code>.</p>
                <button id="get-json-btn">Get Users</button>
                <pre id="json-result">Data will appear here...</pre>
            </div>
            
            <div class="api-section">
                <h2>GET Text Data</h2>
                <p>Fetch plain text from <code>/api/data.txt</code>.</p>
                <button id="get-text-btn">Get Text</button>
                <pre id="text-result">Data will appear here...</pre>
            </div>
            
            <div class="api-section">
                <h2>POST JSON Data</h2>
                <p>Simulate posting a new user. The request and a success message will be shown.</p>
                <button id="post-json-btn">Post New User</button>
                <pre id="post-result">Data will appear here...</pre>
            </div>
        </div>
    </main>
    <script src="script.js"></script>
</body>
</html>`,
        css: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  min-height: 100vh;
  background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  box-sizing: border-box;
  overflow-y: auto;
}

.container {
  width: 100%;
  max-width: 800px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2.5rem;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.3);
}

.glass-panel h1 {
  font-size: 2.25rem;
  margin-top: 0;
  text-align: center;
  margin-bottom: 0.5rem;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.glass-panel > p {
    text-align: center;
    opacity: 0.9;
    margin-bottom: 3rem;
}

.api-section {
    background: rgba(0, 0, 0, 0.15);
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.api-section:last-child {
    margin-bottom: 0;
}

.api-section h2 {
    margin-top: 0;
    margin-bottom: 0.25rem;
    font-size: 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    padding-bottom: 0.5rem;
}

.api-section p {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-bottom: 1rem;
}

button {
  background: #ffffff;
  color: #333;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: translateY(0);
}

pre {
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.85rem;
    white-space: pre-wrap;
    word-break: break-all;
    border: 1px solid rgba(255, 255, 255, 0.1);
    min-height: 40px;
    transition: background-color 0.3s;
}`,
      js: `document.addEventListener('DOMContentLoaded', () => {

    const getJsonBtn = document.getElementById('get-json-btn');
    const jsonResult = document.getElementById('json-result');

    const getTextBtn = document.getElementById('get-text-btn');
    const textResult = document.getElementById('text-result');

    const postJsonBtn = document.getElementById('post-json-btn');
    const postResult = document.getElementById('post-result');

    // Helper to disable buttons during fetch
    const toggleButtons = (disabled) => {
        getJsonBtn.disabled = disabled;
        getTextBtn.disabled = disabled;
        postJsonBtn.disabled = disabled;
    };

    // 1. GET JSON data
    getJsonBtn.addEventListener('click', () => {
        toggleButtons(true);
        jsonResult.textContent = 'Fetching JSON...';
        fetch('/api/data.json')
            .then(response => {
                if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
                return response.json();
            })
            .then(data => {
                jsonResult.textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => {
                jsonResult.textContent = \`Error: \${error.message}\`;
            })
            .finally(() => {
                toggleButtons(false);
            });
    });

    // 2. GET Text data
    getTextBtn.addEventListener('click', () => {
        toggleButtons(true);
        textResult.textContent = 'Fetching text...';
        fetch('/api/data.txt')
            .then(response => {
                if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
                return response.text();
            })
            .then(data => {
                textResult.textContent = data;
            })
            .catch(error => {
                textResult.textContent = \`Error: \${error.message}\`;
            })
            .finally(() => {
                toggleButtons(false);
            });
    });

    // 3. POST JSON data (simulation)
    postJsonBtn.addEventListener('click', () => {
        toggleButtons(true);
        postResult.textContent = 'Posting new user...';
        
        const newUser = {
            name: 'Cyberpunk Sam',
            job: 'Netrunner'
        };

        // This fetch is simulated; it won't actually modify server files.
        fetch('/api/users', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser),
        })
        .then(response => {
            // In a real app, you'd check response.ok. We simulate success here
            // because the development server doesn't handle POST requests.
            console.warn("Simulating successful POST as server is not live.");
            return { status: 201, statusText: "Created (Simulated)" };
        })
        .then(data => {
            const output = \`
Simulated POST request to /api/users
Status: \${data.status} \${data.statusText}

Request Body Sent:
\${JSON.stringify(newUser, null, 2)}

In a real application, the server would process this and return a confirmation.
            \`;
            postResult.textContent = output.trim();
        })
        .catch(error => {
            // This catch block might not be reached due to the simulation, but it's good practice.
            postResult.textContent = \`Error: \${error.message}. This is expected as there is no live server. The simulation logic should handle this.\`;
        })
        .finally(() => {
            toggleButtons(false);
        });
    });

});`
    },
    {
        id: 'glass-profile-card',
        name: 'Glass Profile Card',
        description: 'A sleek, modern profile card using the glass morphism effect.',
        html: `
<div class="glass-card">
  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500" alt="User Avatar" class="avatar">
  <h2 class="user-name">Alex Johnson</h2>
  <p class="user-title">UI/UX Designer</p>
  <div class="social-links">
    <a href="#">Twitter</a>
    <a href="#">LinkedIn</a>
    <a href="#">GitHub</a>
  </div>
  <button class="contact-btn">Contact Me</button>
</div>`,
        css: `
body {
  margin: 0;
  font-family: sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(45deg, #f02fc2, #6094ea);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
	0% { background-position: 0% 50%; }
	50% { background-position: 100% 50%; }
	100% { background-position: 0% 50%; }
}

.glass-card {
  width: 320px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  text-align: center;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
  object-fit: cover;
}

.user-name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: bold;
}

.user-title {
  margin: 0.25rem 0 1.5rem 0;
  font-size: 1rem;
  font-weight: 300;
  opacity: 0.8;
}

.social-links {
  margin-bottom: 2rem;
}

.social-links a {
  color: white;
  text-decoration: none;
  margin: 0 0.75rem;
  transition: opacity 0.2s;
  opacity: 0.7;
}

.social-links a:hover {
  opacity: 1;
}

.contact-btn {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.contact-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}
`
    },
    {
        id: 'glass-hero-section',
        name: 'Glass Hero Section',
        description: 'A stunning landing page hero with a background image and a frosted glass info panel.',
        html: `
<div class="hero-section">
  <div class="glass-panel">
    <h1>Modern Design, Elevated.</h1>
    <p>Discover how glass morphism can transform your user interface into something truly special.</p>
    <button>Learn More &rarr;</button>
  </div>
</div>`,
        css: `
body {
  margin: 0;
  font-family: sans-serif;
  height: 100vh;
  background-image: url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  color: #fff;
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.glass-panel {
  max-width: 600px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.glass-panel h1 {
  font-size: 2.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.glass-panel p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.glass-panel button {
  background: #ffffff;
  color: #1a1a1a;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.glass-panel button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}
`
    },
    {
        id: 'glass-hero-with-profile',
        name: 'Hero with Profile',
        description: 'A hero section followed by a glass profile card.',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hero with Profile</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main>
        <section class="hero-section">
          <div class="glass-panel">
            <h1>Modern Design, Elevated.</h1>
            <p>Discover how glass morphism can transform your user interface into something truly special.</p>
            <button>Learn More &rarr;</button>
          </div>
        </section>

        <section class="glass-card-container">
            <div class="glass-card">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500" alt="User Avatar" class="avatar">
              <h2 class="user-name">Alex Johnson</h2>
              <p class="user-title">UI/UX Designer</p>
              <div class="social-links">
                <a href="#">Twitter</a>
                <a href="#">LinkedIn</a>
                <a href="#">GitHub</a>
              </div>
              <button class="contact-btn">Contact Me</button>
            </div>
        </section>
    </main>
</body>
</html>`,
        css: `body {
  margin: 0;
  font-family: sans-serif;
  background-image: url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  background-attachment: fixed; /* Keep background fixed while scrolling */
  color: #fff;
}

/* --- Hero Section Styles --- */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh; /* Full viewport height */
  padding: 2rem;
  box-sizing: border-box;
}

.hero-section .glass-panel {
  max-width: 600px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.hero-section .glass-panel h1 {
  font-size: 2.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.hero-section .glass-panel p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-section .glass-panel button {
  background: #ffffff;
  color: #1a1a1a;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.hero-section .glass-panel button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

/* --- Profile Card Section Styles --- */
.glass-card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4rem 2rem; /* Give it space from the hero section */
}

.glass-card {
  width: 320px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  text-align: center;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
  object-fit: cover;
}

.user-name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: bold;
}

.user-title {
  margin: 0.25rem 0 1.5rem 0;
  font-size: 1rem;
  font-weight: 300;
  opacity: 0.8;
}

.social-links {
  margin-bottom: 2rem;
}

.social-links a {
  color: white;
  text-decoration: none;
  margin: 0 0.75rem;
  transition: opacity 0.2s;
  opacity: 0.7;
}

.social-links a:hover {
  opacity: 1;
}

.contact-btn {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.contact-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}
`
    }
];


const LayoutPreview: React.FC<{ layout: LayoutTemplateData }> = ({ layout }) => {
    // This is a simplified visual representation.
    const getPreviewStructure = () => {
        switch(layout.id) {
            case 'api-showcase':
                return (
                     <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600">
                        <div className="w-16 h-10 bg-white/20 rounded-md border border-white/30 p-1 flex flex-col gap-1">
                            <div className="w-full h-2 bg-black/20 rounded-sm"></div>
                            <div className="w-full h-2 bg-black/20 rounded-sm"></div>
                            <div className="w-full h-2 bg-black/20 rounded-sm"></div>
                        </div>
                    </div>
                );
            case 'glass-profile-card':
                return (
                    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-pink-500 to-blue-500">
                        <div className="w-10 h-12 bg-white/30 rounded-md border border-white/40"></div>
                    </div>
                );
            case 'glass-hero-section':
                 return (
                    <div className="flex items-center justify-center w-full h-full bg-gray-600">
                        <div className="w-16 h-8 bg-black/30 rounded-md border border-white/20"></div>
                    </div>
                );
            case 'glass-hero-with-profile':
                return (
                    <div className="flex flex-col items-center justify-start w-full h-full bg-gray-600 p-1 gap-1">
                        <div className="w-full h-6 bg-black/30 rounded-sm border border-white/20"></div>
                        <div className="w-8 h-10 bg-white/30 rounded-sm border border-white/40"></div>
                    </div>
                );
            default:
                return <LayoutIcon className="w-8 h-8 text-gray-400" />
        }
    }
    return getPreviewStructure();
};

interface LayoutTemplatesProps {
    onLayoutSelect: (layout: LayoutTemplateData) => void;
}

const LayoutTemplates: React.FC<LayoutTemplatesProps> = ({ onLayoutSelect }) => {
    return (
        <div className="grid grid-cols-2 gap-2">
            {layouts.map(layout => (
                 <div
                    key={layout.id}
                    onClick={() => onLayoutSelect(layout)}
                    className="flex flex-col items-center p-2 bg-black/20 hover:bg-black/40 rounded-md cursor-pointer transition-all duration-200 border border-transparent hover:border-[var(--neon-green)]"
                    title={`Apply ${layout.name} layout`}
                >
                    <div className="h-16 w-full bg-black/20 rounded-sm mb-2 overflow-hidden border border-gray-600">
                        <LayoutPreview layout={layout} />
                    </div>
                    <p className="text-xs text-center text-gray-300 font-semibold">{layout.name}</p>
                    <p className="text-[10px] text-center text-gray-400 mt-1 hidden lg:block">{layout.description}</p>
                </div>
            ))}
        </div>
    );
};

export default LayoutTemplates;