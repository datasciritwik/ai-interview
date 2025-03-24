import React, { useState, useRef, useEffect } from 'react';

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onChange?: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = '// Start coding here',
  language = 'javascript',
  onChange
}) => {
  const [code, setCode] = useState(initialCode);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  // Simple syntax highlighting logic would go here
  // For a real app, you'd use libraries like Prism or CodeMirror
  
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
        if (editorRef.current) {
          editorRef.current.selectionStart = start + 2;
          editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
      
      if (onChange) {
        onChange(newCode);
      }
    }
  };
  
  return (
    <div className="code-editor-container h-full">
      <div className="relative h-full">
        <textarea
          ref={editorRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleTab}
          className="w-full h-full bg-gray-800 text-white font-mono p-4 resize-none outline-none"
          spellCheck="false"
          placeholder="Write your code here..."
        />
      </div>
    </div>
  );
};

export default CodeEditor;