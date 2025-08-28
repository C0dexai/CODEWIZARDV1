import React from 'react';
import { TextAlignLeftIcon, TextAlignCenterIcon, TextAlignRightIcon, BoldIcon, ItalicIcon } from './Icons';

interface FloatingToolbarProps {
    position: { top: number; left: number };
    onAlign: (alignment: 'left' | 'center' | 'right') => void;
    onStyle: (style: 'bold' | 'italic') => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ position, onAlign, onStyle }) => {
    
    const toolbarStyle: React.CSSProperties = {
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, calc(-100% - 8px))', // Center above the element with a small gap
    };

    const buttonClass = "p-2 text-gray-300 hover:bg-black/50 hover:text-[var(--neon-pink)] rounded-md transition-colors";

    return (
        <div 
            style={toolbarStyle}
            className="absolute z-50 flex items-center gap-1 p-1 bg-[var(--card-bg)] backdrop-blur-md border border-[var(--neon-purple)] rounded-lg shadow-2xl neon-glow-purple"
            // Prevent clicks on the toolbar from de-selecting the element in the iframe
            onMouseDown={(e) => e.preventDefault()} 
        >
            <button onClick={() => onAlign('left')} className={buttonClass} title="Align Left"><TextAlignLeftIcon className="h-5 w-5"/></button>
            <button onClick={() => onAlign('center')} className={buttonClass} title="Align Center"><TextAlignCenterIcon className="h-5 w-5"/></button>
            <button onClick={() => onAlign('right')} className={buttonClass} title="Align Right"><TextAlignRightIcon className="h-5 w-5"/></button>
            <div className="w-px h-5 bg-[var(--card-border)] mx-1"></div>
            <button onClick={() => onStyle('bold')} className={buttonClass} title="Bold"><BoldIcon className="h-5 w-5"/></button>
            <button onClick={() => onStyle('italic')} className={buttonClass} title="Italic"><ItalicIcon className="h-5 w-5"/></button>
        </div>
    );
};

export default FloatingToolbar;