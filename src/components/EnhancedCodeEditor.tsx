import React, { useState, useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/themes/prism-tomorrow.css';
import { languageOptions, executeCode } from '../utils/language';

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  onChange?: (code: string) => void;
  onLanguageChange?: (language: string) => void;
  onExecuteComplete?: (result: string | null, error: string | null) => void;
}

const EnhancedCodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  initialLanguage = 'javascript',
  onChange,
  onLanguageChange,
  onExecuteComplete
}) => {
  const defaultLanguageOption = languageOptions.find(lang => lang.value === initialLanguage) || languageOptions[0];
  
  const [language, setLanguage] = useState(defaultLanguageOption.value);
  const [code, setCode] = useState(initialCode || defaultLanguageOption.default);
  const [highlighted, setHighlighted] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  
  // Apply syntax highlighting
  useEffect(() => {
    // Handle different languages for Prism
    const prismLanguage = 
      language === 'cpp' ? 'cpp' :
      language === 'csharp' ? 'csharp' :
      language === 'r' ? 'r' : language;
      
    try {
      const highlighted = Prism.highlight(
        code,
        Prism.languages[prismLanguage] || Prism.languages.javascript,
        prismLanguage
      );
      setHighlighted(highlighted);
    } catch (error) {
      console.error("Error highlighting code:", error);
      // Fallback to plain text if highlighting fails
      setHighlighted(code);
    }
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
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    const languageOption = languageOptions.find(lang => lang.value === newLanguage);
    
    setLanguage(newLanguage);
    
    // If code is default or empty, set to new language default
    if (!code || code === defaultLanguageOption.default) {
      const newDefaultCode = languageOption?.default || '';
      setCode(newDefaultCode);
      if (onChange) {
        onChange(newDefaultCode);
      }
    }
    
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };
  
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
  
  const runCode = async () => {
    setIsExecuting(true);
    try {
      const result = await executeCode(language, code);
      if (onExecuteComplete) {
        onExecuteComplete(result.result, null);
      }
    } catch (error) {
      console.error("Execution error:", error);
      if (onExecuteComplete) {
        onExecuteComplete(null, error instanceof Error ? error.message : String(error));
      }
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div className="code-editor-with-execution flex flex-col h-full">
      <div className="bg-gray-800 p-2 flex items-center justify-between">
        <select 
          value={language}
          onChange={handleLanguageChange}
          className="bg-gray-700 text-white px-3 py-1 rounded outline-none"
        >
          {languageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <button 
          onClick={runCode}
          disabled={isExecuting}
          className={`px-4 py-1 rounded ${
            isExecuting 
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isExecuting ? 'Running...' : 'Run Code'}
        </button>
      </div>
      
      <div className="code-editor-container relative flex-1 font-mono">
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
    </div>
  );
};

export default EnhancedCodeEditor;