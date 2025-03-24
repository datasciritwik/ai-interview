import React, { useState, useRef, useEffect } from 'react';
import { Video, StopCircle, Play, Clock, MessageSquare, Mic } from 'lucide-react';
import EnhancedCodeEditor from './EnhancedCodeEditor';
import { languageOptions } from '../utils/language';

const ImprovedVideoChat: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [code, setCode] = useState<string>(languageOptions[0].default);
  const [language, setLanguage] = useState<string>(languageOptions[0].value);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Clean up function for when component unmounts
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
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
  
  // Stop all media tracks
  const stopMediaTracks = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  // Toggle mute functionality
  const toggleMute = (): void => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };
  
  // Start recording and access webcam
  const startRecording = async (): Promise<void> => {
    try {
      setStreamError(null);
      
      // Request access to webcam and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Set the stream as the video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      
      // Start recording state
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setStreamError(err instanceof Error ? err.message : "Failed to access camera");
    }
  };
  
  // Stop recording
  const stopRecording = (): void => {
    stopMediaTracks();
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    setIsMuted(false);
  };
  
  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Handle code execution results
  const handleExecutionComplete = (result: string | null, errorMsg: string | null) => {
    setOutput(result);
    setError(errorMsg);
    setIsExecuting(false);
  };

  return (
    <div className="flex h-screen bg-amber-50 text-gray-800">
      <div className="flex w-full p-4">
        {/* Left side - Code Editor and Output */}
        <div className="flex flex-col w-3/5 pr-4 h-full">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col rounded-lg overflow-hidden shadow-md mb-4">
            <div className="bg-amber-100 px-4 py-3 font-semibold border-b border-amber-200">
              Code Editor
            </div>
            <div className="flex-1 bg-gray-900 text-amber-50 font-mono text-sm overflow-hidden">
              <EnhancedCodeEditor
                initialCode={code}
                initialLanguage={language}
                onChange={setCode}
                onLanguageChange={setLanguage}
                onExecuteComplete={handleExecutionComplete}
              />
            </div>
          </div>
          
          {/* Output section */}
          <div className="bg-amber-100 rounded-lg shadow-md h-40 overflow-hidden flex flex-col">
            <div className="px-4 py-3 font-semibold border-b border-amber-200">
              Output
            </div>
            <div className="bg-gray-900 text-amber-50 p-4 font-mono text-sm flex-1 overflow-auto">
              {isExecuting && (
                <div className="text-amber-400">Running code...</div>
              )}
              
              {error && (
                <div className="text-red-400">{error}</div>
              )}
              
              {!isExecuting && !error && output && (
                <div className="text-green-300 whitespace-pre-wrap">{output}</div>
              )}
              
              {!isExecuting && !error && !output && (
                <div className="text-gray-500">Click "Run Code" to see output here</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right side - Webcam and Controls */}
        <div className="w-2/5 pl-4 flex flex-col h-full">
          {/* Webcam card */}
          <div className="bg-amber-100 rounded-lg shadow-md overflow-hidden mb-4">
            <div className="aspect-video bg-gray-900 relative overflow-hidden">
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={isMuted}
              />
              
              {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
                  {streamError ? (
                    <div className="text-red-400 text-center px-4">
                      <div className="text-lg mb-1">Camera Error</div>
                      <div className="text-xs">{streamError}</div>
                    </div>
                  ) : (
                    <Video className="text-amber-200 opacity-50" size={48} />
                  )}
                </div>
              )}
              
              {isRecording && (
                <>
                  <div className="absolute top-2 right-2">
                    <button 
                      onClick={toggleMute}
                      className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-amber-200'}`}
                    >
                      <Mic size={16} className={isMuted ? 'text-white' : 'text-gray-800'} />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-1 animate-pulse"></div>
                      <span className="text-white text-xs">REC</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Timer and Controls */}
          <div className="bg-amber-100 rounded-lg shadow-md p-4 mb-4 flex items-center justify-between">
            <button 
              className={`px-6 py-2 rounded-lg ${isRecording ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'} font-medium flex items-center gap-2`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <StopCircle size={18} /> : <Play size={18} />}
              {isRecording ? 'End' : 'Start'}
            </button>
            
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg shadow-sm">
              <Clock size={18} className="text-amber-700" />
              <span className="font-mono text-amber-800">{formatTime(recordingTime)}</span>
            </div>
          </div>
          
          {/* Conversation Logs */}
          <div className="flex-1 bg-amber-100 rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="px-4 py-3 font-semibold border-b border-amber-200 flex items-center">
              <MessageSquare className="mr-2" size={16} />
              Conversation Logs
            </div>
            
            <div className="flex-1 bg-white p-3 overflow-y-auto">
              <div className="mb-2 p-2 rounded bg-amber-50 text-gray-500 text-sm">
                Session started
              </div>
              
              <div className="mb-2 p-2 rounded bg-amber-200 text-gray-800 ml-4">
                Can you help me with this component?
              </div>
              
              <div className="mb-2 p-2 rounded bg-gray-100 text-gray-800 mr-4">
                Sure, I see you're working on a code component. What would you like to know?
              </div>
              
              {output && (
                <div className="mb-2 p-2 rounded bg-gray-100 text-gray-800 mr-4">
                  Your code ran successfully. The output is shown in the output panel.
                </div>
              )}
              
              {error && (
                <div className="mb-2 p-2 rounded bg-gray-100 text-gray-800 mr-4">
                  There was an error running your code. Please check the output panel for details.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedVideoChat;