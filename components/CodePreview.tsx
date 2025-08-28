import React, { useEffect, useRef } from 'react';
import { EditorView, keymap, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { bracketMatching, foldGutter } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentWithTab } from '@codemirror/commands';

interface CodeEditorProps {
    value: string;
    language: string;
    onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        const getLanguageExtension = () => {
            switch (language) {
                case 'js':
                case 'javascript':
                case 'ts':
                case 'tsx':
                    return javascript({ jsx: true, typescript: true });
                case 'html':
                    return html();
                case 'css':
                    return css();
                case 'md':
                case 'markdown':
                    return markdown({ base: markdownLanguage, codeLanguages: languages });
                default:
                    return [];
            }
        };

        const state = EditorState.create({
            doc: value,
            extensions: [
                getLanguageExtension(),
                oneDark,
                keymap.of([indentWithTab]),
                EditorView.lineWrapping,
                bracketMatching(),
                foldGutter(),
                highlightActiveLineGutter(),
                highlightActiveLine(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                }),
            ],
        });

        const view = new EditorView({
            state,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    // Re-create the editor only when the language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    useEffect(() => {
        const view = viewRef.current;
        if (view && value !== view.state.doc.toString()) {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: value },
            });
        }
    }, [value]);

    return <div ref={editorRef} className="h-full w-full" />;
};

export default CodeEditor;