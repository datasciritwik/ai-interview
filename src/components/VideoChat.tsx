import React, { useState, useRef, useEffect } from 'react';
import { Video, StopCircle, Play, Clock, Mic, MicOff, Loader } from 'lucide-react';
import CodeEditor from './CodeEditor';

interface Message {
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: Date;
}

const VideoChat: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'system', text: 'Welcome to the coding session!', timestamp: new Date() },
    { sender: 'user', text: 'I need help with my React component.', timestamp: new Date() },
    { sender: 'assistant', text: 'I\'d be happy to help with your React component. What specific issue are you having?', timestamp: new Date() }
  ]);
  
  const [code, setCode] = useState(`import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;`);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    // Cleanup function for video stream
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const startWebcam = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsRecording(true);
      setIsLoading(false);
      
      // Add system message
      setMessages(prev => [
        ...prev, 
        { 
          sender: 'system', 
          text: 'Recording started.', 
          timestamp: new Date() 
        }
      ]);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setIsLoading(false);
      setMessages(prev => [
        ...prev, 
        { 
          sender: 'system', 
          text: `Error accessing webcam: ${err instanceof Error ? err.message : String(err)}`, 
          timestamp: new Date() 
        }
      ]);
    }
  };
  
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    setIsMuted(false);
    
    // Add system message
    setMessages(prev => [
      ...prev, 
      { 
        sender: 'system', 
        text: 'Recording stopped.', 
        timestamp: new Date() 
      }
    ]);
  };
  
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex h-screen bg-blue-500">
      {/* Left side - Code Editor */}
      <div className="flex-1 flex flex-col p-4">
        <div className="bg-blue-600 rounded-lg p-4 mb-4 flex-grow">
          <div className="text-white text-xl font-bold mb-2">Code Editor</div>
          <div className="bg-gray-800 rounded h-full overflow-auto">
            <CodeEditor 
              initialCode={code} 
              onChange={handleCodeChange}
            />
          </div>
        </div>
        
        <div className="bg-blue-600 rounded-lg p-4 h-40 text-white">
          <div className="font-bold mb-2">Output</div>
          <div className="bg-gray-800 h-full rounded p-2 overflow-auto font-mono text-sm">
            {/* Output would appear here */}
          </div>
        </div>
      </div>
      
      {/* Right side - Webcam, Timer, and Chat */}
      <div className="w-80 flex flex-col bg-blue-700 p-4">
        {/* Webcam */}
        <div className="bg-gray-900 rounded-lg mb-4 relative overflow-hidden">
          <video 
            ref={videoRef}
            autoPlay
            muted={isMuted}
            playsInline
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {!isRecording && !isLoading && (
              <div className="bg-black/50 rounded-full p-4">
                <Video className="text-white" size={32} />
              </div>
            )}
            {isLoading && (
              <div className="bg-black/50 rounded-full p-4">
                <Loader className="text-white animate-spin" size={32} />
              </div>
            )}
          </div>
          
          {isRecording && (
            <div className="absolute top-2 right-2 flex space-x-2">
              <button 
                onClick={toggleMute}
                className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'}`}
              >
                {isMuted ? <MicOff size={16} className="text-white" /> : <Mic size={16} className="text-white" />}
              </button>
            </div>
          )}
        </div>
        
        {/* Timer and Controls */}
        <div className="bg-blue-600 rounded-lg p-3 mb-4 flex items-center justify-between">
          <button 
            className={`px-4 py-2 rounded-lg ${isRecording ? 'bg-red-500' : 'bg-green-500'} text-white flex items-center gap-2`}
            onClick={isRecording ? stopWebcam : startWebcam}
            disabled={isLoading}
          >
            {isRecording ? <StopCircle size={18} /> : <Play size={18} />}
            {isRecording ? 'End' : 'Start'}
          </button>
          
          <div className="flex items-center text-white gap-1">
            <Clock size={18} />
            <span className="font-mono">{formatTime(recordingTime)}</span>
          </div>
        </div>
        
        {/* Conversation Logs */}
        <div className="flex-1 bg-blue-600 rounded-lg p-3 overflow-hidden flex flex-col">
          <div className="text-white font-bold mb-2">Conversation Logs</div>
          <div className="flex-1 bg-gray-800 rounded p-2 overflow-y-auto mb-2">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-2 p-2 rounded ${
                msg.sender === 'user' 
                  ? 'bg-blue-500 text-white ml-4' 
                  : msg.sender === 'assistant' 
                    ? 'bg-gray-700 text-white mr-4'
                    : 'bg-gray-600 text-gray-300 text-sm italic'
              }`}>
                {msg.text}
                {msg.timestamp && (
                  <div className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;