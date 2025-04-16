'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Add keyframes for both INSERT button flash and tape insertion
const animations = `
  @keyframes flashInsert {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  @keyframes insertTape {
    0% { top: -100%; }
    100% { top: 4px; }
  }
  
  @keyframes ejectTape {
    0% { top: 4px; }
    100% { top: -100%; }
  }

  body {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
`;

export default function tapePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTapeInserted, setIsTapeInserted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [tracks, setTracks] = useState([]);
  const [recipientName, setRecipientName] = useState('');
  const [player, setPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const searchParams = useSearchParams();

  // Add these near the top with other state declarations
  const playSound =  new Audio('/sounds/pause-click.mp3');
  const pauseSound =  new Audio('/sounds/pause-click.mp3');

  useEffect(() => {
    let mounted = true;
    let initializationAttempts = 0;
    const MAX_ATTEMPTS = 3;

    const initializePlayer = async () => {
      try {
        // Get tracks from URL parameters first
        const videoIds = searchParams.get('v')?.split(',') || [];
        const recipientName = searchParams.get('to') || '';

        if (mounted) {
          setTracks(videoIds.map(id => ({
            id,
            url: `https://www.youtube.com/watch?v=${id}`
          })));
          setRecipientName(decodeURIComponent(recipientName));
        }

        if (videoIds.length === 0) return;

        // Create container if it doesn't exist
        let playerContainer = document.getElementById('youtube-player');
        if (!playerContainer) {
          playerContainer = document.createElement('div');
          playerContainer.id = 'youtube-player';
          document.body.appendChild(playerContainer);
        }

        // Load YouTube API if not already loaded
        if (!window.YT || !window.YT.Player) {
          await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('YouTube API load timeout'));
            }, 10000); // 10 second timeout

            window.onYouTubeIframeAPIReady = () => {
              clearTimeout(timeoutId);
              resolve();
            };

            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.async = true;
            document.head.appendChild(tag);
          });
        }

        // Wait for YT to be fully initialized
        while (!window.YT?.Player && initializationAttempts < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 500));
          initializationAttempts++;
        }

        if (!window.YT?.Player) {
          throw new Error('YouTube Player failed to initialize');
        }

        // Create new player with explicit dimensions and host
        const newPlayer = new window.YT.Player('youtube-player', {
          videoId: videoIds[0],
          width: '640',
          height: '360',
          host: 'https://www.youtube-nocookie.com', // Privacy-enhanced mode
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
            enablejsapi: 1
          },
          events: {
            onReady: (event) => {
              if (mounted) {
                console.log('Player ready with video:', videoIds[0]);
                setPlayer(event.target);
                setError(null);
                setIsLoading(false);
              }
            },
            onStateChange: (event) => {
              if (!mounted) return;
              onPlayerStateChange(event);
            },
            onError: (event) => {
              console.error('YouTube player error:', event);
              if (mounted) {
                setError('Video playback error. Please try again.');
                setIsPlaying(false);
              }
            }
          }
        });

        // Store player reference
        if (mounted) {
          setPlayer(newPlayer);
        }

      } catch (error) {
        console.error('Player initialization error:', error);
        if (mounted) {
          setError(`Failed to initialize player: ${error.message}`);
          // Retry initialization after a delay
          if (initializationAttempts < MAX_ATTEMPTS) {
            setTimeout(initializePlayer, 2000);
            initializationAttempts++;
          }
        }
      }
    };

    initializePlayer();

    return () => {
      mounted = false;
      const playerElement = document.getElementById('youtube-player');
      if (playerElement) {
        playerElement.remove();
      }
    };
  }, [searchParams]);

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const onPlayerStateChange = (event) => {
    switch (event.data) {
      case window.YT.PlayerState.ENDED: // 0
        handleNext();
        setIsLoading(false);
        break;
      case window.YT.PlayerState.PLAYING: // 1
        setIsPlaying(true);
        setIsLoading(false);
        setError(null);
        break;
      case window.YT.PlayerState.PAUSED: // 2
        setIsPlaying(false);
        setIsLoading(false);
        break;
      case window.YT.PlayerState.BUFFERING: // 3
        setIsLoading(true);
        break;
      case window.YT.PlayerState.CUED: // 5
        setIsLoading(false);
        break;
      case window.YT.PlayerState.UNSTARTED: // -1
        setIsLoading(false);
        break;
    }
  };

  const handlePlay = () => {
    if (!isTapeInserted) {
      console.log('Please insert tape first');
      return;
    }

    if (!player) {
      console.log('Player not ready yet');
      setError('Player not ready. Please try again.');
      return;
    }

    try {
      if (isPlaying) {
        pauseSound.play().catch(error => {
          console.log('Error playing pause sound:', error);
        });
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        playSound.play().catch(error => {
          console.log('Error playing play sound:', error);
        });
        const videoId = tracks[currentTrack].id;
        if (!videoId) {
          setError('Invalid video ID');
          return;
        }

        // If video hasn't started yet, load it first
        const state = player.getPlayerState();
        if (state === -1 || state === 5) {
          player.loadVideoById(videoId);
        }
        
        player.playVideo();
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing video:', error);
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (!isTapeInserted || currentTrack >= tracks.length - 1 || !player) return;
    
    const nextTrack = currentTrack + 1;
    setCurrentTrack(nextTrack);
    player.loadVideoById(tracks[nextTrack].id);
  };

  const handlePrev = () => {
    if (!isTapeInserted || currentTrack <= 0 || !player) return;
    
    const prevTrack = currentTrack - 1;
    setCurrentTrack(prevTrack);
    player.loadVideoById(tracks[prevTrack].id);
  };

  const handleInsertTape = () => {
    playInsertSound();
    setIsTapeInserted(true);
    setIsLoading(false);
    
    if (!player || !tracks.length) {
      console.log('Player not ready or no tracks available');
      return;
    }

    const videoId = tracks[0].id;
    if (videoId) {
      console.log('Loading initial track');
      try {
        player.loadVideoById(videoId);
        player.pauseVideo();
        setCurrentTrack(0);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading video:', error);
        // setError('Failed to load track');
        setIsLoading(false);
      }
    }
  };

  const handleEjectTape = () => {
    playInsertSound();
    setIsTapeInserted(false);
    setIsPlaying(false);
    if (player) {
      player.stopVideo();
    }
  };

  // Sound effect handling
  const playInsertSound = () => {
    const insertSound = new Audio('/sounds/tape-insert.mp3');
    insertSound.play().catch(error => {
      console.log('Error playing sound:', error);
    });
  };

  return (
    <main className="min-h-screen bg-sand-light p-8 flex flex-col items-center overflow-hidden">
      <style>{animations}</style>
      
      {/* YouTube Player Container - Hidden from view */}
      <div 
        id="youtube-player" 
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none overflow-hidden"
        style={{ visibility: 'hidden', position: 'absolute', left: '-9999px' }}
      ></div>

      <div className="relative w-full max-w-md z-[3] mt-12">
        {/* Top Handle */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-10 w-full h-14 z-10">
          <div className="absolute left-0 top-8 w-10 h-6 bg-[#d5c4a7] border-2 border-[#c4b396] rounded-b-lg shadow-md"></div>
          <div className="absolute right-0 top-8 w-10 h-6 bg-[#d5c4a7] border-2 border-[#c4b396] rounded-b-lg shadow-md"></div>
          <div className="absolute left-4 top-0 w-5 h-10 bg-[#e6d5b8] border-2 border-[#d5c4a7] rounded-t-lg shadow-inner"></div>
          <div className="absolute right-4 top-0 w-5 h-10 bg-[#e6d5b8] border-2 border-[#d5c4a7] rounded-t-lg shadow-inner"></div>
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-[calc(100%-40px)] h-5 bg-[#8b4513] border border-[#5d4037] rounded-full flex items-center justify-center shadow-md">
            <div className="w-[95%] h-2 bg-[#a1887f] rounded-full opacity-70"></div>
          </div>
          {/* Frequency markers */}
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-[calc(100%-50px)] h-5 flex justify-between items-center px-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-0.5 h-3 bg-[#5d4037] rounded-full opacity-30"></div>
            ))}
          </div>
          <div className="absolute left-1/2 top-1 transform -translate-x-1/2 w-[calc(100%-60px)] h-1 bg-[#5d4037] opacity-20 blur-sm rounded-full"></div>
        </div>

        {/* Main Player Body */}
        <div className="bg-[#f5e7c9] rounded-lg p-5 border border-[#e6d5b8] shadow-xl">
          {/* Radio Frequency Display */}
          <div className="w-full h-10 bg-[#f0e0c0] rounded-md border border-[#e6d5b8] my-4 relative overflow-hidden">
            <div className="w-full h-1 bg-gray-400 absolute top-1/2 transform -translate-y-1/2"></div>
            <div className="flex justify-between w-full px-4 text-[8px] text-gray-600 absolute top-1">
              <span>88</span>
              <span>92</span>
              <span>96</span>
              <span>100</span>
              <span>104</span>
              <span>108</span>
              <span>MHz</span>
            </div>
            <div className="absolute h-8 w-1 bg-red-500 left-[40px] top-1 transform -translate-y-1/2"></div>
            <div className="absolute h-4 w-4 bg-[#d5c4a7] border border-[#c4b396] rounded-full left-[42px] top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          {/* Cassette Display Window */}
          <div className="w-full h-[200px] bg-[#e6d5b8] rounded-md border border-[#d5c4a7] mb-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#d5c4a7]"></div>
            
            {/* Cassette Tape with Animation */}
            <div 
              className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-1000 ease-in-out ${
                isTapeInserted ? 'top-4' : '-top-40'
              }`}
            >
              {/* Cassette design */}
              <div className="w-64 h-36 bg-black rounded-md relative border border-gray-800 shadow-lg">
                <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white"></div>
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white"></div>
                <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-white"></div>
                <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-white"></div>
                
                <div className="absolute top-4 left-4 right-4 h-14 bg-white border border-gray-300 rounded-sm flex flex-col items-center justify-center">
                  <div className="w-full h-px bg-gray-300 absolute top-1/3"></div>
                  <div className="w-full h-px bg-gray-300 absolute top-2/3"></div>
                  <div className="text-xl text-gray-800 font-poppins italic font-bold uppercase">
                    {recipientName ? `${recipientName}'s MIX` : "MY MIX"}
                  </div>
                </div>
                
                <div className="absolute top-20 left-0 right-0 h-8 flex">
                  <div className="h-full flex-1 bg-red-500"></div>
                  <div className="h-full flex-1 bg-pink-500"></div>
                  <div className="h-full flex-1 bg-yellow-500"></div>
                  <div className="h-full flex-1 bg-green-500"></div>
                  <div className="h-full flex-1 bg-blue-500"></div>
                  <div className="h-full flex-1 bg-indigo-500"></div>
                </div>
                
                <div className="absolute bottom-6 left-0 right-0 h-10 flex justify-between items-center px-8">
                  <div className="w-10 h-10 rounded-full bg-gray-200 border-4 border-black flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-800 border border-gray-700 rounded-sm flex items-center justify-center">
                    <div className="w-12 h-4 bg-white rounded-sm"></div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-200 border-4 border-black flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  </div>
                </div>
                
                <div className="absolute bottom-2 left-6 bg-black text-white text-xs font-poppins font-bold px-1 border border-white">
                  A
                </div>
              </div>
            </div>

            {/* Insert/Eject Button */}
            <button 
              onClick={isTapeInserted ? handleEjectTape : handleInsertTape}
              className="absolute bottom-2 right-2 bg-[#d5c4a7] text-xs text-gray-700 px-2 py-1 rounded border border-[#c4b396] hover:bg-[#e6d5b8] transition"
              style={!isTapeInserted ? { animation: "flashInsert 3s ease-in-out infinite" } : {}}
            >
              {isTapeInserted ? 'EJECT' : 'INSERT'}
            </button>
          </div>

          {/* Speaker Grille */}
          <div className="w-full h-16 bg-[#e6d5b8] rounded-md border border-[#d5c4a7] mb-4 relative overflow-hidden grid grid-cols-10 gap-1 p-2">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="w-full h-full rounded-full bg-[#d5c4a7]"></div>
            ))}
          </div>

          {/* Status Display - Updated to show track info when tape is inserted */}
          <div className="w-full bg-[#e6d5b8] border border-[#d5c4a7] p-2 mb-4 rounded flex justify-between items-center">
            <div className="text-gray-700 text-sm font-mono">
              {!isTapeInserted 
                ? 'NO TAPE'
                : isLoading 
                  ? <span className="inline-block animate-[flashInsert_1s_ease-in-out_infinite]">LOADING...</span>
                  : tracks.length > 0 
                    ? `TRACK ${currentTrack + 1}/${tracks.length}`
                    : 'NO TRACKS'
              }
            </div>
            <div className={`w-3 h-3 rounded-full ${
              isLoading ? 'bg-yellow-500' : isPlaying ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          </div>

          {/* Controls - Updated to be enabled when tape is inserted */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <button 
                disabled={!isTapeInserted || currentTrack === 0}
                onClick={handlePrev}
                className="bg-[#d5c4a7] text-gray-700 h-8 w-8 rounded-full border border-[#c4b396] flex items-center justify-center disabled:opacity-50 hover:bg-[#e6d5b8] transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button 
                disabled={!isTapeInserted}
                onClick={handlePlay}
                className="bg-[#d5c4a7] text-gray-700 h-8 w-8 rounded-full border border-[#c4b396] flex items-center justify-center disabled:opacity-50 hover:bg-[#e6d5b8] transition"
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              <button 
                disabled={!isTapeInserted || currentTrack === tracks.length - 1}
                onClick={handleNext}
                className="bg-[#d5c4a7] text-gray-700 h-8 w-8 rounded-full border border-[#c4b396] flex items-center justify-center disabled:opacity-50 hover:bg-[#e6d5b8] transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#d5c4a7] border border-[#c4b396] relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#c4b396]"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-2 bg-gray-700 -translate-y-1"></div>
              </div>
              <div className="text-[8px] text-gray-700 font-bold">VOL</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-500 mb-2">
            Note: On mobile devices, you may need to press pause and play when skipping tracks.
          </p>
          <Link href="/" className="text-gray-700 text-sm hover:text-gray-600 transition underline">
            Create a new mixtape
          </Link>
        </div>
      </div>

      {/* Update the loading indicator */}
      {isLoading && isTapeInserted && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white px-4 py-2 rounded">
          Loading...
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded">
          {error}
        </div>
      )}
    </main>
  );
} 