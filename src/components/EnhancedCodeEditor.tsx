import React, { useState, useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeEditorProps {
  initialCode?: string;
  language?: 'javascript' | 'typescript' | 'jsx' | 'tsx';
  onChange?: (code: string) => void;
}

const EnhancedCodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = '// Start coding here',
  language = 'javascript',
  onChange
}) => {
  const [code, setCode] = useState(initialCode);
  const [highlighted, setHighlighted] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  
  // Apply syntax highlighting
  useEffect(() => {
    const highlighted = Prism.highlight(
      code,
      Prism.languages[language],
      language
    );
    setHighlighted(highlighted);
  }, [code, language]);
  
  // Sync scroll between textarea and highlighted code
  useEffect(() => {
    const syncScroll = () => {
      if (preRef.current && textareaRef.current) {
        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    };
    
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', syncScroll);
      return () => textarea.removeEventListener('scroll', syncScroll);
    }
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onChange) {
      onChange(newCode);
    }
  };
  
  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      // Insert 2 spaces for tab
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      
      // Move cursor position after the inserted tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
      
      if (onChange) {
        onChange(newCode);
      }
    }
  };
  
  return (
    <div className="code-editor-container relative h-full font-mono">
      <pre 
        ref={preRef}
        className="absolute inset-0 overflow-auto p-4 m-0 bg-transparent pointer-events-none"
        aria-hidden="true"
      >
        <code 
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleChange}
        onKeyDown={handleTab}
        className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-4 resize-none outline-none font-mono"
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
};

export default EnhancedCodeEditor;