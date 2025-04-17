'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [recipientName, setRecipientName] = useState('');
  const [tracks, setTracks] = useState([{ id: 1, url: '' }]);
  const [error, setError] = useState('');
  const router = useRouter();

  const addTrack = () => {
    if (tracks.length < 5) {
      setTracks([...tracks, { id: Date.now(), url: '' }]);
    }
  };

  const removeTrack = (id) => {
    setTracks(tracks.filter(track => track.id !== id));
  };

  const updateTrack = (id, url) => {
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, url } : track
    ));
  };

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleCreateMixtape = () => {
    // Reset error state
    setError('');

    // Filter out empty tracks and extract video IDs
    const validTracks = tracks
      .filter(track => track.url.trim() !== '')
      .map(track => getYoutubeId(track.url))
      .filter(id => id !== null);

    if (validTracks.length === 0) {
      setError('Please add at least one valid YouTube URL');
      return;
    }

    // Encode the recipient name and create the URL
    const encodedName = encodeURIComponent(recipientName || "MY-MIX");
    const videoIds = validTracks.join(',');
    
    // Navigate to the player page with encoded parameters
    router.push(`/player?v=${videoIds}&to=${encodedName}`);
  };

  return (
    <main className="min-h-screen bg-sand-light p-8">
      <div className="max-w-xl mx-auto space-y-8">
        <h1 className="text-4xl font-fascinate text-primary-dark text-center mb-8">
          Make a Mixtape
        </h1>

        {/* Cassette Tape */}
        <div className="w-64 h-36 bg-black rounded-md relative border border-gray-800 shadow-lg mx-auto mb-8">
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white"></div>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-white"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-white"></div>
          
          <div className="absolute top-4 left-4 right-4 h-14 bg-white border border-gray-300 rounded-sm flex flex-col items-center justify-center">
            <div className="w-full h-px bg-gray-300 absolute top-1/3"></div>
            <div className="w-full h-px bg-gray-300 absolute top-2/3"></div>
            <div className="text-xl text-text font-poppins italic uppercase font-bold">
              {recipientName ? `${recipientName}'S MIX` : "MY MIX"}
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

        {/* Form */}
        <div className="bg-sand p-6 rounded-lg shadow-lg">
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-poppins font-semibold text-primary-dark">
                RECIPIENT NAME (OPTIONAL):
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full p-2 rounded bg-[#F5E6D3] border-none font-menlo text-primary placeholder-[#8B4513]/60"
                placeholder="Enter recipient name"
              />
              <p className="text-sm mt-1 font-poppins text-primary-dark uppercase">
                Mixtape will be labeled "{recipientName ? `${recipientName}'S` : 'MY'} MIX"
              </p>
            </div>

            <div>
              <label className="block mb-2 font-poppins font-semibold text-primary-dark">
                ADD YOUTUBE LINKS (MAX 5):
              </label>
              <div className="space-y-3">
                {tracks.map((track, index) => (
                  <div key={track.id} className="flex gap-2">
                    <div className="flex-grow flex items-center">
                      <span className="text-primary-dark mr-2 font-poppins font-semibold">{index + 1}:</span>
                      <input
                        type="text"
                        value={track.url}
                        onChange={(e) => updateTrack(track.id, e.target.value)}
                        className="flex-grow p-2 rounded bg-[#F5E6D3] border-none font-menlo text-primary placeholder-[#8B4513]/60"
                        placeholder="Paste YouTube URL here"
                      />
                    </div>
                    {tracks.length > 1 && (
                      <button
                        onClick={() => removeTrack(track.id)}
                        className="p-2 text-primary-dark hover:text-primary-dark/90"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {tracks.length < 5 && (
              <button
                onClick={addTrack}
                className="w-full p-2 bg-[#E6D5C3] text-primary hover:bg-[#D4C4B2] rounded transition-colors font-poppins font-semibold border border-primary"
              >
                ADD ANOTHER TRACK ({tracks.length}/5)
              </button>
            )}

            <button
              onClick={handleCreateMixtape}
              className="w-full p-3 bg-primary-dark text-white hover:bg-primary-dark/90 rounded transition-colors font-poppins font-bold"
            >
              CREATE MIXTAPE
            </button>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        </div>

        <footer className="text-center text-text text-base font-poppins flex items-center justify-center gap-2">
          <a 
            href="https://github.com/vanshgulati16/mixtape-ui" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center hover:text-primary-dark transition-colors"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            view the code
          </a>
        </footer>
      </div>
    </main>
  );
} 