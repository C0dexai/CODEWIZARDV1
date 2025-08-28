import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';

import CodeEditor from './CodePreview';
import FileExplorer from './FileExplorer';
import ChatMessageView from './ChatMessage';
import ComponentLibrary from './ComponentLibrary';
import LayoutTemplates from './LayoutTemplates';
import CollapsibleSection from './CollapsibleSection';
import FloatingToolbar from './FloatingToolbar';
import Modal from './Modal';

import {
    GeminiIcon, MagicWandIcon, SpinnerIcon, XIcon,
    LightbulbIcon, MicrophoneIcon, PaperclipIcon, PlayIcon, UsersIcon, ReloadIcon,
    MonitorIcon, TabletIcon, SmartphoneIcon, SettingsIcon
} from './Icons';

import type { FileSystemState, ChatMessage, LayoutTemplateData, DraggableComponent, OrchestrationPlan } from '../types';
import { chatWithAgent, getAiHint } from '../services/geminiService';
import { runDeconstructionTask } from '../services/orchestrationService';
import dbService from '../services/dbService';

const DEFAULT_FILES: FileSystemState = {
    '/index.html': `<!DOCTYPE html>
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
    '/style.css': `body {
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
    '/script.js': `document.addEventListener('DOMContentLoaded', () => {

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

});`,
    '/utils.ts': `/**
 * A sample TypeScript utility file.
 * 
 * You can write and edit TypeScript and TSX files in this sandbox.
 * However, the live preview environment does not include a build step to
 * transpile this code into JavaScript that can run in the browser.
 * 
 * This file is for demonstrating the editing capabilities.
 */
export function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

console.log(greet('TypeScript'));
`,
    '/api/.placeholder': '',
    '/api/data.json': `[
  { "id": 1, "name": "Fusion Core", "value": 1500 },
  { "id": 2, "name": "Neutronium Alloy", "value": 3500 }
]`,
    '/api/data.xml': `<items>
    <item id="1">
        <name>Item 1</name>
        <value>100</value>
    </item>
    <item id="2">
        <name>Item 2</name>
        <value>200</value>
    </item>
</items>`,
    '/api/data.txt': `This is some sample text data.`
};

const INITIAL_CHAT_HISTORY: ChatMessage[] = [
    { id: 'init', role: 'system', content: 'Welcome to the Live Web Dev Sandbox! Describe what you want to build.' }
];

const DEFAULT_INSTRUCTIONS = `✨ CUSTOM INSTRUCTIONS: Elegant Document Formatting

General Style

Write in professional, easy-to-read prose with short, clear paragraphs.

Each paragraph should be 3–5 sentences with smooth transitions.

Keep tone confident but approachable (like a designer explaining to stakeholders).

Lists (Special Rule)

Always format lists (bulleted or numbered) inside blockquotes.

This makes them stand out from body text.

Keep list items short and parallel in structure.

Example (Bulleted List):

> - Define project vision
> - Identify target audience
> - Clarify business goals

Example (Numbered List):

> 1. Establish requirements
> 2. Allocate resources
> 3. Set milestones

Blockquotes (Callouts & Highlights)

Use blockquotes to emphasize important points, warnings, or summaries.

Keep them 1–3 sentences for maximum impact.

Lists inside blockquotes are strongly preferred for clarity.

Document Structure

Title + Author + Date at the top.

Introduction (purpose & context).

Main Body (organized with headings, paragraphs, and blockquoted lists).

Closing/Outcomes (summarize and emphasize next steps).

💡 Instruction Reminder for AI:
When writing structured documents:

- Use normal paragraphs for narrative.
- Use blockquotes for all lists (bulleted or numbered).
- Sprinkle in blockquotes for emphasis or key warnings.
- Always keep spacing clean, with one blank line before/after blockquotes.`;

const liveEditScript = `
document.addEventListener('DOMContentLoaded', () => {
    // Only run if inside an iframe
    if (window.frameElement) { 
        const addPaths = (element, path) => {
            element.setAttribute('data-path', path);
            Array.from(element.children).forEach((child, index) => {
                addPaths(child, \`\${path}.\${index}\`);
            });
        };
        // Initial pathing
        Array.from(document.body.children).forEach((child, index) => addPaths(child, \`\${index}\`));

        const editableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BUTTON', 'A', 'LI', 'SPAN', 'DIV'];
        let lastHovered = null;

        document.body.addEventListener('mousedown', (e) => {
            const target = e.target.closest('[data-path]');
            if (!target || !editableTags.includes(target.tagName)) return;
            // Prevent nested content-editable elements
            if (target.closest('[contenteditable="true"]')) return;
            
            e.preventDefault();
            e.stopPropagation();

            // Deselect any other element that might be editable
            document.querySelectorAll('[contenteditable="true"]').forEach(el => {
                if (el !== target) {
                    el.contentEditable = 'false';
                    el.style.outline = 'none';
                    el.blur();
                }
            });

            target.contentEditable = 'true';
            target.focus();
            target.style.outline = '2px solid #FF1493';
            target.style.outlineOffset = '2px';
            
            const onBlur = () => {
                target.contentEditable = 'false';
                target.style.outline = 'none';
                const newContent = target.innerHTML;
                const path = target.getAttribute('data-path');
                
                window.parent.postMessage({
                    type: 'element-update',
                    payload: { path, content: newContent }
                }, '*');
                
                target.removeEventListener('blur', onBlur);
            };
            target.addEventListener('blur', onBlur);
        });

        document.body.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-path]');
            if (lastHovered && lastHovered !== target && lastHovered.contentEditable !== 'true') {
                 lastHovered.style.outline = 'none';
            }
            if (target && editableTags.includes(target.tagName) && target.contentEditable !== 'true') {
                target.style.outline = '2px dashed #00BFFF';
                target.style.outlineOffset = '2px';
                lastHovered = target;
            }
        });
        document.body.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-path]');
            if(target && target.contentEditable !== 'true') {
                target.style.outline = 'none';
            }
        });

        // --- Drag and Drop Handling inside iframe ---
        let dropIndicator = null;
        const createDropIndicator = () => {
            if (!dropIndicator) {
                dropIndicator = document.createElement('div');
                Object.assign(dropIndicator.style, {
                    height: '4px',
                    backgroundColor: '#00BFFF',
                    position: 'absolute',
                    zIndex: '9999',
                    pointerEvents: 'none',
                    boxShadow: '0 0 8px #00BFFF',
                    display: 'none',
                    transition: 'top 0.1s ease, left 0.1s ease, width 0.1s ease',
                });
                document.body.appendChild(dropIndicator);
            }
            return dropIndicator;
        }
        
        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
            const indicator = createDropIndicator();
            const target = e.target.closest('[data-path]');
            if (target) {
                const rect = target.getBoundingClientRect();
                const isAfter = e.clientY > rect.top + rect.height / 2;
                indicator.style.display = 'block';
                indicator.style.top = \`\${window.scrollY + (isAfter ? rect.bottom : rect.top) - 2}px\`;
                indicator.style.left = \`\${rect.left}px\`;
                indicator.style.width = \`\${rect.width}px\`;
            } else {
                 indicator.style.display = 'none';
            }
        });

        document.body.addEventListener('dragleave', (e) => {
            // Hide indicator if we are leaving the body for real
            if (e.relatedTarget === null) {
                if(dropIndicator) dropIndicator.style.display = 'none';
            }
        });

        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if(dropIndicator) dropIndicator.style.display = 'none';
            
            const DATA_TYPE = 'application/vnd.live-dev-sandbox.component+json';
            const componentData = e.dataTransfer.getData(DATA_TYPE);
            if (!componentData) return;

            const target = e.target.closest('[data-path]');
            if (!target) return;

            const path = target.getAttribute('data-path');
            const rect = target.getBoundingClientRect();
            const insertBefore = e.clientY < rect.top + rect.height / 2;
            
            window.parent.postMessage({
                type: 'element-drop',
                payload: {
                    component: JSON.parse(componentData),
                    targetPath: path,
                    insertBefore
                }
            }, '*');
        });
    }
});
`;

type Viewport = 'desktop' | 'tablet' | 'mobile';

const EditorPanel: React.FC = () => {
    // Core application state
    const [isInitialized, setIsInitialized] = useState(false);
    const [fileSystem, setFileSystem] = useState<FileSystemState>(DEFAULT_FILES);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(INITIAL_CHAT_HISTORY);
    const [activeFile, setActiveFile] = useState<string | null>('/index.html');
    const [openFiles, setOpenFiles] = useState<string[]>(['/index.html', '/style.css', '/script.js', '/utils.ts']);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [promptInput, setPromptInput] = useState('');
    const [aiHint, setAiHint] = useState('');
    const [previewRoot, setPreviewRoot] = useState<string | null>(null);
    const [customInstructions, setCustomInstructions] = useState<string>(DEFAULT_INSTRUCTIONS);
    const [modelName, setModelName] = useState('gemini-2.5-flash');


    // Layout and UI state
    const [panelSizes, setPanelSizes] = useState([33.33, 33.34, 33.33]);
    const [rightPanelVerticalSplit, setRightPanelVerticalSplit] = useState(60); // Preview height %
    const [leftPanelVisible, setLeftPanelVisible] = useState(true);
    const [viewport, setViewport] = useState<Viewport>('desktop');

    // Orchestration & Modals
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskGoal, setTaskGoal] = useState('');
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [saveAsFileName, setSaveAsFileName] = useState('');
    const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
    const [tempInstructions, setTempInstructions] = useState('');
    const [tempModelName, setTempModelName] = useState('');


    // Visual editing state
    const [selectedElementPath, setSelectedElementPath] = useState<string | null>(null);
    const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const promptInputRef = useRef<HTMLTextAreaElement>(null);
    const horizontalResizeRef = useRef<{ index: number, startX: number, initialSizes: number[] } | null>(null);
    const verticalResizeRef = useRef<{ startY: number, initialHeight: number } | null>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);

    const resolvePath = useCallback((relativePath: string, basePath: string): string => {
        // A dummy origin is needed to construct a valid URL object.
        const DUMMY_ORIGIN = 'http://localhost';

        // The base path should represent a directory, so ensure it ends with a slash.
        const base = new URL(basePath.endsWith('/') ? basePath : `\${basePath}/`, DUMMY_ORIGIN);
        
        // Resolve the relative path against the base URL.
        const resolved = new URL(relativePath, base);

        // Return the absolute pathname from the origin.
        return resolved.pathname;
    }, []);
    
    const handleCodeChange = useCallback((path: string, content: string) => {
        setFileSystem(prev => ({ ...prev, [path]: content }));
    }, []);

    // --- Core Logic: State Persistence ---
    const handleSaveState = useCallback(() => {
        if (!isInitialized) return;
        dbService.saveState({
            fileSystem, chatHistory, panelSizes, previewRoot, openFiles, activeFile, rightPanelVerticalSplit, customInstructions, modelName
        }).catch(err => console.error("Failed to save state:", err));
    }, [isInitialized, fileSystem, chatHistory, panelSizes, previewRoot, openFiles, activeFile, rightPanelVerticalSplit, customInstructions, modelName]);

    const handleLoadState = useCallback(async () => {
        try {
            await dbService.initDB();
            const savedState = await dbService.loadState();
            if (savedState) {
                setFileSystem(savedState.fileSystem);
                setChatHistory(savedState.chatHistory.length > 0 ? savedState.chatHistory : INITIAL_CHAT_HISTORY);
                setPanelSizes(savedState.panelSizes);
                setPreviewRoot(savedState.previewRoot);
                setOpenFiles(savedState.openFiles);
                setActiveFile(savedState.activeFile);
                setRightPanelVerticalSplit(savedState.rightPanelVerticalSplit || 60);
                setCustomInstructions(savedState.customInstructions || DEFAULT_INSTRUCTIONS);
                setModelName(savedState.modelName || 'gemini-2.5-flash');
            }
        } catch (err) {
            console.error("Failed to load state:", err);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        handleLoadState();
    }, [handleLoadState]);
    
    useEffect(() => {
        const handler = setTimeout(handleSaveState, 1000);
        return () => clearTimeout(handler);
    }, [handleSaveState]);

    // --- Core Logic: iFrame Preview & Visual Editing ---
    const updateIframeContent = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const root = previewRoot || '/';
        // Resolve the path to index.html within the current preview root.
        let htmlPath = resolvePath('index.html', root);
        
        // If index.html doesn't exist in the preview root, fallback to the global index.html
        if(!fileSystem[htmlPath]) { 
            htmlPath = '/index.html'; 
        }

        let htmlContent = fileSystem[htmlPath] || '<p>Error: index.html not found in project.</p>';
        
        // Regex to find src/href attributes that are not absolute URLs (http/https) or data URIs.
        const assetRegex = /(href|src)=["'](?!https?:\/\/|data:)([^"']+)["']/g;

        htmlContent = htmlContent.replace(assetRegex, (_, attr, path) => {
            // For each found asset, resolve its absolute path in the file system.
            const resolvedPath = resolvePath(path, root);
            const content = fileSystem[resolvedPath];

            if (content) {
                let mimeType: string;
                const extension = resolvedPath.split('.').pop()?.toLowerCase() || '';
                
                switch(extension) {
                    case 'css': mimeType = 'text/css'; break;
                    case 'js': mimeType = 'application/javascript'; break;
                    case 'png': mimeType = 'image/png'; break;
                    case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
                    case 'svg': mimeType = 'image/svg+xml'; break;
                    case 'gif': mimeType = 'image/gif'; break;
                    case 'webp': mimeType = 'image/webp'; break;
                    case 'ico': mimeType = 'image/x-icon'; break;
                    default: mimeType = 'text/plain';
                }
                
                // Create a blob from the file content and generate a temporary URL.
                const blob = new Blob([content], { type: mimeType });
                return `\${attr}="\${URL.createObjectURL(blob)}"`;
            }
            // If the file is not found in the file system, return the original path.
            // The browser will likely fail to load it, showing a 404 in the console.
            return `\${attr}="\${path}"`;
        });
        
        // Inject the live editing script
        const scriptTag = `<script>\${liveEditScript}</script>`;
        if (htmlContent.includes('</head>')) {
            htmlContent = htmlContent.replace('</head>', `\${scriptTag}</head>`);
        } else {
            htmlContent += scriptTag;
        }

        iframe.srcdoc = htmlContent;
    }, [fileSystem, previewRoot, resolvePath]);

    useEffect(() => {
        const timeoutId = setTimeout(updateIframeContent, 250);
        return () => clearTimeout(timeoutId);
    }, [updateIframeContent]);
    
    useEffect(() => {
        const handleIframeMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return;

            const { type, payload } = event.data;
            if (!type || !payload) return;

            const root = previewRoot || '/';
            let htmlPath = resolvePath('index.html', root);
            if (!fileSystem[htmlPath]) htmlPath = '/index.html';
            
            const htmlContent = fileSystem[htmlPath];
            if (!htmlContent) return;

            const updateHtmlFile = (newDoc: Document) => {
                 const hasDoctype = htmlContent.trim().toLowerCase().startsWith('<!doctype html>');
                let newHtmlContent = newDoc.documentElement.outerHTML;
                if (hasDoctype && !newHtmlContent.trim().toLowerCase().startsWith('<!doctype html>')) {
                    newHtmlContent = '<!DOCTYPE html>\n' + newHtmlContent;
                }
                handleCodeChange(htmlPath, newHtmlContent);
            }

            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, 'text/html');

                if (type === 'element-update') {
                    const { path, content } = payload;
                    if (!path) return;
                    
                    const pathParts = path.split('.');
                    let elementToUpdate: Element | null = doc.body;
                    for (const part of pathParts) {
                        elementToUpdate = elementToUpdate?.children[parseInt(part, 10)] ?? null;
                    }

                    if (elementToUpdate) {
                        elementToUpdate.innerHTML = content;
                        updateHtmlFile(doc);
                    }
                } else if (type === 'element-drop') {
                    const { component, targetPath, insertBefore } = payload as { component: DraggableComponent, targetPath: string, insertBefore: boolean };
                    if (!component || !targetPath) return;

                    const pathParts = targetPath.split('.');
                    let targetElement: Element | null = doc.body;
                    for (const part of pathParts) {
                         targetElement = targetElement?.children[parseInt(part, 10)] ?? null;
                    }
                    
                    if (targetElement) {
                        const template = doc.createElement('template');
                        template.innerHTML = component.html.trim();
                        const newElement = template.content.firstChild;

                        if (newElement) {
                            if (insertBefore) {
                                targetElement.parentNode?.insertBefore(newElement, targetElement);
                            } else {
                                targetElement.parentNode?.insertBefore(newElement, targetElement.nextSibling);
                            }
                            updateHtmlFile(doc);
                        }
                    }
                }
            } catch (e) {
                console.error("Error updating HTML from live preview:", e);
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, [fileSystem, previewRoot, handleCodeChange, resolvePath]);

    // --- Core Logic: Chat & Orchestration ---
    const handleStartDeconstructionTask = async () => {
        if (!taskGoal.trim() || isAiThinking) return;
    
        setIsTaskModalOpen(false);
        setIsAiThinking(true);
    
        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: `Goal: \${taskGoal}` };
        const systemMessage: ChatMessage = { id: crypto.randomUUID(), role: 'system', content: `Starting agent orchestration for goal: "\${taskGoal}"` };
        setChatHistory(prev => [...prev, userMessage, systemMessage]);
        
        const currentGoal = taskGoal;
        setTaskGoal('');
        setAiHint('');
    
        try {
            const plan: OrchestrationPlan = await runDeconstructionTask(currentGoal, fileSystem, customInstructions, modelName);
            
            const newModelMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: `I have generated a plan to achieve your goal: \${plan.title}`, // Fallback content
                orchestration: plan,
            };
            setChatHistory(prev => [...prev, newModelMessage]);
    
        } catch (error) {
            console.error("Error with Agent Orchestration:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'system',
                content: error instanceof Error ? error.message : "An unexpected error occurred during orchestration.",
            };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsAiThinking(false);
        }
    };
    
    const handlePromptSubmit = async (prompt: string) => {
        if (!prompt.trim() || isAiThinking) return;

        const newUserMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt };
        const newHistory = [...chatHistory, newUserMessage];
        setChatHistory(newHistory);
        setPromptInput('');
        setIsAiThinking(true);
        setAiHint('');

        try {
            const result = await chatWithAgent(newHistory, fileSystem, previewRoot, customInstructions, modelName);
            const newModelMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: result.text,
                explanation: result.explanation,
                code: result.code,
            };
            setChatHistory(prev => [...prev, newModelMessage]);

            if (result.code) {
                handleApplyCode(result.code);
            }

        } catch (error) {
            console.error("Error with Gemini Agent:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'system',
                content: error instanceof Error ? error.message : "An unexpected error occurred.",
            };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsAiThinking(false);
        }
    };
    
    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        if (!isAiThinking && chatHistory.length > 1 && chatHistory[chatHistory.length - 1]?.role === 'model') {
            getAiHint(chatHistory, customInstructions, modelName).then(setAiHint);
        }
    }, [chatHistory, isAiThinking, customInstructions, modelName]);

    // --- Resizing Logic ---
    const handleHorizontalResizeStart = useCallback((index: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        horizontalResizeRef.current = { index, startX: e.clientX, initialSizes: [...panelSizes] };
        document.addEventListener('mousemove', handleHorizontalResizeMove);
        document.addEventListener('mouseup', handleHorizontalResizeEnd);
    }, [panelSizes]);

    const handleHorizontalResizeMove = useCallback((e: MouseEvent) => {
        if (!horizontalResizeRef.current) return;
        const { index, startX, initialSizes } = horizontalResizeRef.current;
        const deltaX = e.clientX - startX;
        const containerWidth = window.innerWidth;
        const deltaPercentage = (deltaX / containerWidth) * 100;
        
        const newSizes = [...initialSizes];
        const minSize = 10;

        let leftSize = newSizes[index] + deltaPercentage;
        let rightSize = newSizes[index + 1] - deltaPercentage;
        
        if (leftSize < minSize) {
            const diff = minSize - leftSize;
            leftSize = minSize;
            rightSize -= diff;
        }
        if (rightSize < minSize) {
            const diff = minSize - rightSize;
            rightSize = minSize;
            leftSize -= diff;
        }

        if (leftSize >= minSize && rightSize >= minSize) {
            newSizes[index] = leftSize;
            newSizes[index + 1] = rightSize;
            setPanelSizes(newSizes);
        }
    }, []);
    
    const handleHorizontalResizeEnd = useCallback(() => {
        horizontalResizeRef.current = null;
        document.removeEventListener('mousemove', handleHorizontalResizeMove);
        document.removeEventListener('mouseup', handleHorizontalResizeEnd);
    }, [handleHorizontalResizeMove]);

    const handleVerticalResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        verticalResizeRef.current = { startY: e.clientY, initialHeight: rightPanelVerticalSplit };
        document.addEventListener('mousemove', handleVerticalResizeMove);
        document.addEventListener('mouseup', handleVerticalResizeEnd);
    }, [rightPanelVerticalSplit]);

    const handleVerticalResizeMove = useCallback((e: MouseEvent) => {
        if (!verticalResizeRef.current || !rightPanelRef.current) return;
        const { startY, initialHeight } = verticalResizeRef.current;
        const deltaY = e.clientY - startY;
        const containerHeight = rightPanelRef.current.clientHeight;

        if (containerHeight > 0) {
            const deltaPercentage = (deltaY / containerHeight) * 100;
            setRightPanelVerticalSplit(Math.max(10, Math.min(90, initialHeight + deltaPercentage)));
        }
    }, []);

    const handleVerticalResizeEnd = useCallback(() => {
        verticalResizeRef.current = null;
        document.removeEventListener('mousemove', handleVerticalResizeMove);
        document.removeEventListener('mouseup', handleVerticalResizeEnd);
    }, [handleVerticalResizeMove]);

    // --- Event Handlers: Files & UI ---
    const handleFileSelect = (path: string) => {
        if (fileSystem[path] !== undefined && !path.endsWith('/')) {
            setActiveFile(path);
            if (!openFiles.includes(path)) setOpenFiles([...openFiles, path]);
        }
    };
    
    const handleCloseFile = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newOpenFiles = openFiles.filter(p => p !== path);
        setOpenFiles(newOpenFiles);
        if (activeFile === path) {
            setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[0] : null);
        }
    };
    
    const handleApplyCode = (codeChanges: { path: string, content: string }[]) => {
        const updatedFs = { ...fileSystem };
        const updatedOpenFiles = new Set(openFiles);
        let firstFileToSelect: string | null = null;

        codeChanges.forEach(({ path, content }) => {
            updatedFs[path] = content;
            if(!path.endsWith('/.placeholder')) {
                updatedOpenFiles.add(path);
                if (!firstFileToSelect) firstFileToSelect = path;
            }
        });
        setFileSystem(updatedFs);
        setOpenFiles(Array.from(updatedOpenFiles));

        if (firstFileToSelect) {
            setActiveFile(firstFileToSelect);
        }
    };

    const downloadProject = () => {
        const zip = new JSZip();
        Object.entries(fileSystem).forEach(([path, content]) => {
            if (!path.endsWith('/.placeholder')) {
                zip.file(path.substring(1), content);
            }
        });
        zip.generateAsync({ type: "blob" }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "live-dev-project.zip";
            link.click();
            URL.revokeObjectURL(link.href);
        });
    };

    const handleSaveAs = async () => {
        const sourceFile = activeFile;
        if (!sourceFile || !sourceFile.endsWith('.html') || !saveAsFileName.trim()) {
            alert("Please select an HTML file and provide a valid new name.");
            return;
        }

        const newBaseName = saveAsFileName.trim().replace(/\.html$/, '');
        const newHtmlPath = `/\${newBaseName}.html`;

        if (fileSystem[newHtmlPath]) {
            alert(`File "\${newHtmlPath}" already exists. Please choose a different name.`);
            return;
        }

        const originalHtmlContent = fileSystem[sourceFile];
        let newHtmlContent = originalHtmlContent;
        const newFiles: { path: string, content: string }[] = [];
        const replacementMap: Record<string, string> = {};
        const assetRegex = /(href|src)=["'](?!https?:\/\/|data:|#)([^"']+)["']/g;
        const matches = [...originalHtmlContent.matchAll(assetRegex)];
        const sourceDir = sourceFile.substring(0, sourceFile.lastIndexOf('/'));

        for (const match of matches) {
            const originalAssetRelativePath = match[2];
            const resolvedAssetPath = resolvePath(originalAssetRelativePath, sourceDir === '' ? '/' : `\${sourceDir}/`);

            if (fileSystem[resolvedAssetPath] && !replacementMap[originalAssetRelativePath]) {
                const extension = resolvedAssetPath.substring(resolvedAssetPath.lastIndexOf('.'));
                const newAssetFilename = `\${newBaseName}\${extension}`;
                const newAssetPath = `/\${newAssetFilename}`;
                
                replacementMap[originalAssetRelativePath] = newAssetFilename;
                
                if (!fileSystem[newAssetPath]) {
                    newFiles.push({ path: newAssetPath, content: fileSystem[resolvedAssetPath] });
                }
            }
        }

        for (const [oldPath, newPath] of Object.entries(replacementMap)) {
            newHtmlContent = newHtmlContent.split(`"\${oldPath}"`).join(`"\${newPath}"`);
            newHtmlContent = newHtmlContent.split(`'\${oldPath}'`).join(`'\${newPath}'`);
        }

        newFiles.push({ path: newHtmlPath, content: newHtmlContent });

        setFileSystem(prev => ({ ...prev, ...Object.fromEntries(newFiles.map(f => [f.path, f.content])) }));
        
        const newOpenFiles = new Set(openFiles);
        newFiles.forEach(f => newOpenFiles.add(f.path));
        setOpenFiles(Array.from(newOpenFiles));
        setActiveFile(newHtmlPath);
        
        setIsSaveAsModalOpen(false);
        setSaveAsFileName('');
    };

    
    const handleLayoutSelect = (layout: LayoutTemplateData) => {
        setFileSystem(fs => ({
            ...fs,
            '/index.html': layout.html,
            '/style.css': layout.css,
            '/script.js': layout.js || ''
        }));
        if(!openFiles.includes('/index.html')) setOpenFiles(prev => [...prev, '/index.html']);
        if(!openFiles.includes('/style.css')) setOpenFiles(prev => [...prev, '/style.css']);
        if(layout.js && !openFiles.includes('/script.js')) setOpenFiles(prev => [...prev, '/script.js']);
        setActiveFile('/index.html');
    };

    // --- JSX Rendering Components ---
    const LeftPanel = () => (
        <div className="flex flex-col h-full bg-[var(--card-bg)] text-white p-2 gap-4 overflow-y-auto">
            <FileExplorer 
                fileSystem={fileSystem} activeFile={activeFile} previewRoot={previewRoot}
                onFileSelect={handleFileSelect} onSetPreviewRoot={setPreviewRoot}
                onNewFile={() => {}} onNewFolder={() => {}} onFileUpload={() => {}}
                onDownloadProject={downloadProject}
                onSaveAs={() => setIsSaveAsModalOpen(true)}
            />
            <CollapsibleSection title="Layouts"><LayoutTemplates onLayoutSelect={handleLayoutSelect} /></CollapsibleSection>
            <CollapsibleSection title="Components"><ComponentLibrary onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)} /></CollapsibleSection>
        </div>
    );
    
    const EditorArea = () => (
         <div className="flex flex-col h-full bg-[#1e1e1e]">
            {openFiles.length > 0 && (
                <div className="flex-shrink-0 flex items-center bg-black/30 border-b border-[var(--card-border)] overflow-x-auto">
                    {openFiles.map(path => (
                        <button key={path} onClick={() => handleFileSelect(path)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-[var(--card-border)] whitespace-nowrap \${activeFile === path ? 'bg-[#1e1e1e] text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                            <span>{path.substring(path.lastIndexOf('/') + 1)}</span>
                            <span onClick={(e) => handleCloseFile(path, e)} className="p-1 rounded-full hover:bg-white/20"><XIcon className="h-4 w-4 text-gray-500 hover:text-white" /></span>
                        </button>
                    ))}
                </div>
            )}
            <div className="flex-grow relative">
                {activeFile && fileSystem[activeFile] !== undefined ? (
                    <CodeEditor key={activeFile} value={fileSystem[activeFile]} language={activeFile.split('.').pop() || 'html'} onChange={(content) => handleCodeChange(activeFile, content)} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">Select a file to begin editing.</div>
                )}
            </div>
        </div>
    );

    const PreviewPanel = () => {
        const viewportStyles: Record<Viewport, React.CSSProperties> = {
            desktop: { width: '100%', height: '100%', border: 'none' },
            tablet: { width: '768px', height: '1024px', border: '1px solid #4a4a4a', boxShadow: '0 0 20px rgba(0,0,0,0.3)' },
            mobile: { width: '375px', height: '667px', border: '1px solid #4a4a4a', boxShadow: '0 0 20px rgba(0,0,0,0.3)' }
        };

        const ViewportButton: React.FC<{
            type: Viewport;
            icon: React.ReactNode;
            label: string;
        }> = ({ type, icon, label }) => (
            <button
                onClick={() => setViewport(type)}
                title={label}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs \${viewport === type
                    ? 'bg-[var(--neon-green)]/20 text-[var(--neon-green)]'
                    : 'text-gray-400 hover:bg-black/40 hover:text-white'
                }`}
            >
                {icon}
            </button>
        );

        return (
            <div className="flex flex-col h-full bg-[#333] relative">
                <div className="flex-shrink-0 flex items-center justify-between p-2 bg-black border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1 bg-black/30 p-1 rounded-md">
                            <ViewportButton type="desktop" icon={<MonitorIcon className="h-4 w-4" />} label="Desktop" />
                            <ViewportButton type="tablet" icon={<TabletIcon className="h-4 w-4" />} label="Tablet" />
                            <ViewportButton type="mobile" icon={<SmartphoneIcon className="h-4 w-4" />} label="Mobile" />
                        </div>
                        <span className="text-xs font-semibold text-white hidden md:inline">{previewRoot ? `(from \${previewRoot})` : ''}</span>
                    </div>
                    <button onClick={updateIframeContent} className="p-1.5 text-gray-400 hover:text-[var(--neon-green)] hover:bg-black/30 rounded" title="Refresh Preview">
                        <ReloadIcon className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-grow w-full flex items-center justify-center overflow-auto bg-grid">
                     <iframe
                        ref={iframeRef}
                        title="Live Preview"
                        className="transition-all duration-300 ease-in-out bg-white"
                        style={viewportStyles[viewport]}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                </div>
                {isDragging && <div className="absolute inset-0 bg-blue-500/30 border-2 border-dashed border-blue-300 flex items-center justify-center text-white font-bold pointer-events-none">Drop to add component</div>}
                {toolbarPosition && <FloatingToolbar position={toolbarPosition} onAlign={() => {}} onStyle={() => {}} />}
            </div>
        );
    };

    const ChatPanel = () => (
        <div className="flex flex-col h-full bg-[var(--card-bg)] border-t-2 border-[var(--neon-purple)]">
            <header className="flex items-center justify-between p-2 bg-black/30 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2">
                    <GeminiIcon className="h-6 w-6 text-[var(--neon-purple)]" />
                    <h2 className="font-bold text-lg">AI Assistant</h2>
                </div>
                <button
                    onClick={() => {
                        setTempInstructions(customInstructions);
                        setTempModelName(modelName);
                        setIsInstructionsModalOpen(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-[var(--neon-blue)] hover:bg-black/30 rounded"
                    title="Custom AI Instructions"
                >
                    <SettingsIcon className="h-5 w-5" />
                </button>
            </header>
            <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto">
                {chatHistory.map(msg => <ChatMessageView key={msg.id} message={msg} onApplyCode={handleApplyCode} onSpeak={(text) => speechSynthesis.speak(new SpeechSynthesisUtterance(text))} />)}
                {isAiThinking && (
                    <div className="flex justify-start items-start gap-3 my-4">
                       <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 bg-[var(--neon-purple)] neon-glow-purple"><SpinnerIcon className="h-5 w-5 text-black animate-spin" /></div>
                       <div className="p-4 rounded-xl max-w-2xl bg-black/30 border border-[var(--neon-purple)] text-left text-gray-400 italic">The AI agents are working...</div>
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 p-3 border-t border-[var(--card-border)] bg-black/20">
                {aiHint && !isAiThinking && (
                     <button onClick={() => handlePromptSubmit(aiHint)} className="flex items-center gap-2 text-sm text-left w-full mb-2 p-2 bg-[var(--card-bg)] hover:bg-black/40 rounded-lg border border-[var(--card-border)]">
                        <LightbulbIcon className="h-4 w-4 text-[var(--neon-blue)] flex-shrink-0" /><span className="text-gray-300">{aiHint}</span>
                     </button>
                )}
                <div className="relative">
                    <textarea ref={promptInputRef} value={promptInput} onChange={(e) => setPromptInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePromptSubmit(promptInput); } }}
                        placeholder="Ask the AI to make changes..." rows={1} disabled={isAiThinking}
                        className="w-full bg-black/30 border border-[var(--neon-blue)] rounded-lg p-3 pr-36 text-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] resize-none" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button onClick={() => setIsTaskModalOpen(true)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-300" title="Start Agent Task"><UsersIcon className="h-5 w-5"/></button>
                        <button className="p-1.5 hover:bg-white/10 rounded-full text-gray-300"><PaperclipIcon className="h-5 w-5"/></button>
                        <button className="p-1.5 hover:bg-white/10 rounded-full text-gray-300"><MicrophoneIcon className="h-5 w-5"/></button>
                        <button onClick={() => handlePromptSubmit(promptInput)} disabled={isAiThinking || !promptInput.trim()} className="p-2 bg-[var(--neon-blue)] hover:brightness-125 rounded-full text-black disabled:bg-gray-600 disabled:cursor-not-allowed">
                            <MagicWandIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Modal
                isOpen={isInstructionsModalOpen}
                onClose={() => setIsInstructionsModalOpen(false)}
                title="AI Configuration"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-400">
                        Configure the AI's behavior and model. Custom instructions can include personality, formatting rules, or coding conventions.
                    </p>
                    
                    <div>
                        <label htmlFor="model-name" className="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
                        <input
                            id="model-name"
                            type="text"
                            value={tempModelName}
                            onChange={(e) => setTempModelName(e.target.value)}
                            placeholder="e.g., gemini-2.5-flash"
                            className="w-full bg-black/30 border border-[var(--neon-purple)] rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-purple)] font-mono text-sm"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                         <input
                            id="api-key"
                            type="text"
                            disabled
                            value="Configured via secure environment variable"
                            className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-gray-400 cursor-not-allowed"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="custom-instructions" className="block text-sm font-medium text-gray-300 mb-1">Custom Instructions</label>
                        <textarea
                            id="custom-instructions"
                            value={tempInstructions}
                            onChange={(e) => setTempInstructions(e.target.value)}
                            rows={10}
                            className="w-full bg-black/30 border border-[var(--neon-purple)] rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-purple)] resize-y font-mono text-sm"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setCustomInstructions(tempInstructions);
                            setModelName(tempModelName);
                            setIsInstructionsModalOpen(false);
                        }}
                        className="flex items-center gap-2 w-full justify-center text-sm bg-[var(--neon-green)] hover:brightness-125 text-black font-bold py-2.5 px-3 rounded-md transition-all"
                    >
                        <span>Save Configuration</span>
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                title="Deconstruct High-Level Goal"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-400">
                        Describe a feature or a webpage you want to build. The AI agents will create a step-by-step plan and generate the necessary code.
                    </p>
                    <textarea
                        value={taskGoal}
                        onChange={(e) => setTaskGoal(e.target.value)}
                        placeholder="e.g., 'Create a responsive pricing table with 3 tiers'"
                        rows={4}
                        className="w-full bg-black/30 border border-[var(--neon-purple)] rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-purple)] resize-y"
                    />
                    <button
                        onClick={handleStartDeconstructionTask}
                        disabled={!taskGoal.trim() || isAiThinking}
                        className="flex items-center gap-2 w-full justify-center text-sm bg-[var(--neon-green)] hover:brightness-125 text-black font-bold py-2.5 px-3 rounded-md transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <UsersIcon className="h-4 w-4" />
                        <span>Generate Plan</span>
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isSaveAsModalOpen}
                onClose={() => setIsSaveAsModalOpen(false)}
                title="Save As"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-400">
                        Enter a new name for your page. Associated CSS and JS files will be copied and renamed automatically. Current file: <strong>{activeFile}</strong>
                    </p>
                    <input
                        type="text"
                        value={saveAsFileName}
                        onChange={(e) => setSaveAsFileName(e.target.value)}
                        placeholder="e.g., 'about-page' or 'contact'"
                        className="w-full bg-black/30 border border-[var(--neon-purple)] rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-purple)]"
                    />
                    <button
                        onClick={handleSaveAs}
                        disabled={!saveAsFileName.trim() || !activeFile?.endsWith('.html')}
                        className="flex items-center gap-2 w-full justify-center text-sm bg-[var(--neon-green)] hover:brightness-125 text-black font-bold py-2.5 px-3 rounded-md transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <span>Save as New Page</span>
                    </button>
                </div>
            </Modal>

            <div className="flex h-full w-full overflow-hidden">
                {leftPanelVisible && (
                    <>
                        <div style={{ flexBasis: `\${panelSizes[0]}%` }} className="flex-shrink-0 h-full">
                            <LeftPanel />
                        </div>
                        <div className="resize-handle" onMouseDown={handleHorizontalResizeStart(0)}></div>
                    </>
                )}
                
                <div style={{ flexBasis: leftPanelVisible ? `\${panelSizes[1]}%` : `\${panelSizes[0] + panelSizes[1]}%` }} className="h-full flex flex-col">
                    <EditorArea />
                </div>
                
                <div className="resize-handle" onMouseDown={handleHorizontalResizeStart(1)}></div>
                
                <div ref={rightPanelRef} style={{ flexBasis: `\${panelSizes[2]}%` }} className="h-full flex flex-col">
                    <div style={{ flexBasis: `\${rightPanelVerticalSplit}%` }} className="w-full relative overflow-hidden">
                        <PreviewPanel />
                    </div>
                    <div className="resize-handle-vertical"
                        onMouseDown={handleVerticalResizeStart}>
                    </div>
                    <div className="w-full relative flex-grow overflow-hidden">
                         <ChatPanel />
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditorPanel;