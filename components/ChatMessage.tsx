import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { GeminiIcon, UserCircleIcon, CheckIcon, CopyIcon, HtmlIcon, CssIcon, JsIcon, DocumentTextIcon, IconProps, BookmarkIcon, PlusIcon, MinusIcon, SpeakerIcon, UsersIcon } from './Icons';
import { marked } from 'marked';

interface ChatMessageProps {
    message: ChatMessage;
    onApplyCode: (code: { path: string; content: string }[]) => void;
    onSpeak: (text: string) => void;
}

const getFileIcon = (path: string): React.ReactElement<IconProps> => {
    if (path.endsWith('.html')) return <HtmlIcon className="text-[var(--neon-pink)]" />;
    if (path.endsWith('.css')) return <CssIcon className="text-[var(--neon-blue)]" />;
    if (path.endsWith('.js')) return <JsIcon className="text-[var(--neon-green)]" />;
    return <DocumentTextIcon className="text-gray-400" />;
};

const CodePreview: React.FC<{ path: string, code: string, icon: React.ReactElement<IconProps> }> = ({ path, code, icon }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="chat-code-preview">
            <div className="chat-code-preview-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-2">
                    {React.cloneElement(icon, { className: "h-4 w-4"})}
                    <span className="text-xs font-semibold tracking-wider">{path}</span>
                </div>
                <svg className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {isOpen && <pre><code>{code}</code></pre>}
        </div>
    )
}

const ChatMessageView: React.FC<ChatMessageProps> = ({ message, onApplyCode, onSpeak }) => {
    const [parsedContent, setParsedContent] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [fontSize, setFontSize] = useState(14); // Default font size in px

    useEffect(() => {
        const parseMd = async () => {
            try {
                const contentToParse = message.role === 'model'
                    ? (message.explanation || message.content)
                    : message.content;
                
                const html = await marked.parse(contentToParse, { breaks: true }); // breaks: true adds <br> for newlines
                setParsedContent(html);
            } catch (error) {
                console.error("Error parsing markdown", error);
                const rawContent = message.role === 'model' ? (message.explanation || message.content) : message.content;
                setParsedContent(`<p>${rawContent.replace(/\n/g, '<br>')}</p>`);
            }
        };

        if (message.role !== 'system') {
            parseMd();
        }
    }, [message.content, message.explanation, message.role]);

    const getRoleStyles = () => {
        switch (message.role) {
            case 'model':
                return {
                    container: 'justify-start',
                    iconContainer: 'bg-[var(--neon-purple)]',
                    icon: <GeminiIcon className="h-5 w-5 text-black" />,
                    bubble: 'bg-black/30 border border-[var(--neon-purple)] text-left',
                    glow: 'neon-glow-purple',
                };
            case 'user':
            default:
                return {
                    container: 'justify-end',
                    iconContainer: 'bg-[var(--neon-blue)]',
                    icon: <UserCircleIcon className="h-5 w-5 text-black" />,
                    bubble: 'bg-black/30 border border-[var(--neon-blue)] text-left', // Text is still left-aligned within the bubble
                    glow: 'neon-glow-blue',
                };
        }
    };
    
    const styles = getRoleStyles();
    const isUserMessage = message.role === 'user';
    
    if (message.role === 'system') {
        return (
            <div className="text-center my-4">
                <p className="text-xs text-gray-500 italic px-4 py-2 bg-black/20 rounded-full inline-block">
                    {message.content}
                </p>
            </div>
        );
    }
    
    const handleCopy = () => {
        const textToCopy = message.role === 'model' 
            ? (message.explanation || message.content) 
            : message.content;
            
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleSpeak = () => {
        const textToSpeak = message.role === 'model' 
            ? (message.explanation || message.content) 
            : message.content;
        onSpeak(textToSpeak);
    };

    // Special renderer for Orchestration Plans
    if (message.orchestration) {
        return (
            <div className={`flex w-full my-4 ${styles.container}`}>
                 <div className="flex items-start gap-3 w-full">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${styles.iconContainer} ${styles.glow}`}>
                        {styles.icon}
                    </div>
                    <div className="p-4 rounded-xl max-w-2xl relative group bg-black/30 border border-[var(--neon-green)] text-left">
                        <div className="flex items-center gap-3 mb-3 border-b border-white/20 pb-3">
                            <UsersIcon className="h-6 w-6 text-[var(--neon-green)]" />
                            <div>
                                <h3 className="font-bold text-white">{message.orchestration.title}</h3>
                                <p className="text-xs text-gray-400">Execution Plan Generated</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            {message.orchestration.steps.map((step, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                    <div className="w-5 h-5 flex-shrink-0 bg-black/30 border border-white/20 rounded-full flex items-center justify-center font-mono text-xs mt-0.5">{index + 1}</div>
                                    <p className="text-gray-300">{step.description}</p>
                                </div>
                            ))}
                        </div>
                        
                        {message.orchestration.review && (
                            <div className="my-4 p-3 bg-black/20 rounded-lg border border-[var(--card-border)]">
                                <p className="text-xs font-bold text-[var(--neon-pink)] mb-1">Agent Review</p>
                                <p className="text-xs text-gray-400 italic">{message.orchestration.review}</p>
                            </div>
                        )}
                        
                        {message.orchestration.code && message.orchestration.code.length > 0 && (
                             <div className="mt-4 pt-3 border-t border-[var(--neon-green)]/30 space-y-2">
                                <p className="text-xs font-semibold text-gray-400 mb-2">Code to be applied:</p>
                                {message.orchestration.code.map(({ path, content }) => (
                                    <CodePreview key={path} path={path} code={content} icon={getFileIcon(path)} />
                                ))}

                                <button
                                    onClick={() => onApplyCode(message.orchestration!.code!)}
                                    className="flex items-center gap-2 w-full justify-center text-sm bg-[var(--neon-green)] hover:brightness-125 text-black font-bold py-2 px-3 rounded-md transition-all mt-2"
                                    aria-label="Execute this plan and apply code"
                                >
                                    <CheckIcon className="h-4 w-4" />
                                    <span>Execute Plan</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const MessageToolbar = () => (
        <div className="absolute top-0 -mt-4 right-2 flex items-center gap-1 p-0.5 bg-black/40 border border-[var(--card-border)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {message.role === 'model' && (
              <button onClick={handleSpeak} title="Read aloud" className="p-1 hover:bg-black/50 rounded-full"><SpeakerIcon className="h-4 w-4 text-gray-300" /></button>
            )}
            <button onClick={() => setIsBookmarked(!isBookmarked)} title="Bookmark" className={`p-1 hover:bg-black/50 rounded-full ${isBookmarked ? 'text-[var(--neon-pink)]' : 'text-gray-300'}`}>
                <BookmarkIcon className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`}/>
            </button>
            <button onClick={() => setFontSize(s => Math.min(s + 1, 24))} title="Increase text size" className="p-1 hover:bg-black/50 rounded-full"><PlusIcon className="h-4 w-4 text-gray-300" /></button>
            <button onClick={() => setFontSize(s => Math.max(s - 1, 10))} title="Decrease text size" className="p-1 hover:bg-black/50 rounded-full"><MinusIcon className="h-4 w-4 text-gray-300" /></button>
            <button onClick={handleCopy} title={isCopied ? "Copied!" : "Copy text"} className="p-1 hover:bg-black/50 rounded-full">
                {isCopied ? <CheckIcon className="h-4 w-4 text-[var(--neon-green)]" /> : <CopyIcon className="h-4 w-4 text-gray-300" />}
            </button>
        </div>
    );

    const messageContent = (
        <div className={`flex items-start gap-3 w-full ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${styles.iconContainer} ${styles.glow}`}>
                {styles.icon}
            </div>
            <div className={`p-4 rounded-xl max-w-2xl relative group ${styles.bubble} ${isBookmarked ? 'border-[var(--neon-pink)]' : ''}`}>
                <MessageToolbar />
                
                <div 
                    className="text-sm prose" 
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6, overflowWrap: 'break-word' }}
                    dangerouslySetInnerHTML={{ __html: parsedContent }}
                ></div>

                {message.code && message.role === 'model' && message.code.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[var(--neon-green)]/30 space-y-2">
                        {message.code.map(({ path, content }) => (
                            <CodePreview key={path} path={path} code={content} icon={getFileIcon(path)} />
                        ))}

                        <button
                            onClick={() => onApplyCode(message.code!)}
                            className="flex items-center gap-2 w-full justify-center text-sm bg-[var(--neon-green)] hover:brightness-125 text-black font-bold py-2 px-3 rounded-md transition-all mt-2"
                            aria-label="Apply generated code to editor"
                        >
                            <CheckIcon className="h-4 w-4" />
                            <span>Apply to Editor</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`flex w-full my-4 ${styles.container}`}>
            {messageContent}
        </div>
    );
};

export default ChatMessageView;
