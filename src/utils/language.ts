export interface LanguageOption {
    value: string;
    label: string;
    default: string;
  }
  
  export const languageOptions: LanguageOption[] = [
    { value: 'python', label: 'Python', default: 'print("Hello, World!")' },
    { value: 'javascript', label: 'JavaScript', default: 'console.log("Hello, World!");' },
    { value: 'typescript', label: 'TypeScript', default: 'console.log("Hello, World!");' },
    { value: 'java', label: 'Java', default: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
    { value: 'cpp', label: 'C++', default: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}' },
    { value: 'c', label: 'C', default: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' },
    { value: 'csharp', label: 'C#', default: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}' },
    { value: 'go', label: 'Go', default: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}' },
    { value: 'swift', label: 'Swift', default: 'print("Hello, World!")' },
    { value: 'r', label: 'R', default: 'print("Hello, World!")' },
    { value: 'sql', label: 'SQL', default: 'SELECT "Hello, World!" as greeting;' }
  ];
  
  export interface ExecutionResult {
    // Standard fields from code execution APIs
    stdout?: string;
    stderr?: string;
    exit_code?: number;
    
    // Alternative result format
    result?: string | any;
    error?: string;
  }
  
  export async function executeCode(language: string, code: string): Promise<ExecutionResult> {
    try {
      const response = await fetch('https://code-executor-924828558796.us-central1.run.app/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          code,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute code');
      }
      
      return data;
    } catch (error) {
      console.error('Code execution error:', error);
      throw error;
    }
  }