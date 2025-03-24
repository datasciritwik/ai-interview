import React, { useState, useRef, useEffect } from 'react';
import { Video, Monitor, StopCircle, Download, Play, Undo } from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'webcam' | 'screen' | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Start the timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      // Clear the timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setRecordingDuration(0);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    // Cleanup WebSocket connection when component unmounts
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    }
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  // Add better MIME type handling
  const getMimeType = () => {
    const types = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=h264,opus',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  };

  const setupWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    const reconnect = () => {
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        setupWebSocket();
      }, 3000);
    };

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      // Only attempt to reconnect if we're still recording
      if (isRecording) {
        reconnect();
      }
    };

    websocketRef.current = ws;
  };

  const startRecording = async (type: 'webcam' | 'screen') => {
    try {
      // Clear any existing preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      // Setup WebSocket connection
      setupWebSocket();

      let stream;
      if (type === 'webcam') {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true 
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute to prevent feedback
        videoRef.current.play(); // Ensure video plays
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: getMimeType()
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          // Stream chunk to backend
          if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            const arrayBuffer = await e.data.arrayBuffer();
            websocketRef.current.send(arrayBuffer);
          }
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.muted = false; // Unmute for preview playback
        }
        if (websocketRef.current) {
          websocketRef.current.close();
        }

        // Create preview URL
        const blob = new Blob(chunks, { type: getMimeType() });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        // Set the preview video source
        if (videoRef.current) {
          videoRef.current.src = url;
        }
      };

      // Set a smaller timeslice for more frequent ondataavailable events
      mediaRecorder.start(1000); // Send chunks every second
      setIsRecording(true);
      setRecordingType(type);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingType(null);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, {
      type: getMimeType()
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const resetRecording = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setRecordedChunks([]);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const playPreview = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Video & Screen Recorder
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                playsInline
                autoPlay={isRecording}
                controls={!!previewUrl}
                className="w-full h-full object-contain"
              />
            </div>
            {isRecording && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full font-mono">
                {formatTime(recordingDuration)}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            {!isRecording && !previewUrl && (
              <>
                <button
                  onClick={() => startRecording('webcam')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Video size={20} />
                  Record Webcam
                </button>

                <button
                  onClick={() => startRecording('screen')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Monitor size={20} />
                  Record Screen
                </button>
              </>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
              >
                <StopCircle size={20} />
                Stop Recording
              </button>
            )}

            {previewUrl && (
              <>
                <button
                  onClick={playPreview}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
                >
                  <Play size={20} />
                  Play Preview
                </button>

                <button
                  onClick={downloadRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Download size={20} />
                  Download
                </button>

                <button
                  onClick={resetRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white"
                >
                  <Undo size={20} />
                  Record New
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-gray-600">
            {isRecording ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Recording {recordingType}... ({formatTime(recordingDuration)})
              </span>
            ) : previewUrl ? (
              'Preview ready - Watch the recording or download it'
            ) : recordedChunks.length > 0 ? (
              'Recording complete! Click download to save.'
            ) : (
              'Ready to record'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;