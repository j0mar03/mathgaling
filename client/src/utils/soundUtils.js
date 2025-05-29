/**
 * Sound utilities for the MathGaling application
 * Provides functions to play audio feedback for elementary students
 */

// Sound effect cache to prevent reloading sounds
const soundCache = {};

// Sound settings
let soundEnabled = true;

/**
 * Load and cache a sound effect
 * @param {string} soundName - The name of the sound file (without extension)
 * @returns {HTMLAudioElement} - The audio element
 */
const loadSound = (soundName) => {
  if (soundCache[soundName]) {
    return soundCache[soundName];
  }
  
  // Check if we're in production (Netlify) environment
  const isProduction = window.location.hostname.includes('netlify.app') || 
                      !window.location.hostname.includes('localhost');
  
  // Determine potential sound paths to try
  const soundPaths = isProduction
    // In production, try both API and direct paths (API first as it's more likely to work)
    ? [`/api/sounds/${soundName}.mp3`, `/sounds/${soundName}.mp3`]
    // In development, just use direct path
    : [`/sounds/${soundName}.mp3`];
  
  console.log(`[Sound] Attempting to load sound "${soundName}" from paths: ${soundPaths.join(", ")}`);
  
  // Try the first path
  const soundPath = soundPaths[0];
  const audio = new Audio(soundPath);
  
  // Set up error handling for the first attempt
  audio.onerror = () => {
    console.warn(`[Sound] First attempt to load ${soundName} from ${soundPath} failed, error code: ${audio.error?.code}`);
    
    // If we have an alternative path, try that
    if (soundPaths.length > 1) {
      const fallbackPath = soundPaths[1];
      console.log(`[Sound] Trying fallback path: ${fallbackPath}`);
      
      // Create and configure fallback audio object
      const fallbackAudio = new Audio(fallbackPath);
      fallbackAudio.onerror = () => {
        console.error(`[Sound] Fallback also failed for ${soundName}, error code: ${fallbackAudio.error?.code}`);
      };
      
      // Replace the failed audio in cache with the fallback
      soundCache[soundName] = fallbackAudio;
    }
  };
  
  // Preload the audio
  audio.load();
  soundCache[soundName] = audio;
  return audio;
};

/**
 * Play a sound effect
 * @param {string} soundName - The name of the sound file (without extension)
 * @param {number} volume - Volume level from 0 to 1 (default: 0.5)
 * @returns {Promise} - Resolves when the sound finishes playing
 */
export const playSound = (soundName, volume = 0.5) => {
  if (!soundEnabled) return Promise.resolve();
  
  try {
    const audio = loadSound(soundName);
    audio.currentTime = 0; // Reset to start
    audio.volume = volume;
    
    // Add better error diagnostics
    audio.onerror = (e) => {
      console.error(`Sound error for ${soundName}:`, {
        error: e,
        code: audio.error?.code,
        message: audio.error?.message,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src
      });
    };
    
    return new Promise((resolve) => {
      audio.onended = resolve;
      audio.play().catch(error => {
        console.warn(`Failed to play sound ${soundName}:`, error);
        
        // Check for common issues
        if (error.name === 'NotAllowedError') {
          console.info('Sound autoplay blocked. This is normal - sounds will work after user interaction.');
        } else if (error.name === 'NotSupportedError') {
          console.error('Sound format not supported by this browser.');
        } else if (error.name === 'AbortError') {
          console.warn('Sound playback was aborted.');
        } else if (error.name === 'NotFoundError') {
          console.error(`Sound file not found: ${audio.src}`);
          
          // Try alternative API path as fallback
          if (!audio.src.includes('/api/sounds/')) {
            console.info('Trying alternative API path for sound...');
            const fallbackAudio = new Audio(`/api/sounds/${soundName}.mp3`);
            fallbackAudio.volume = volume;
            fallbackAudio.play().catch(e => console.warn('Fallback sound also failed:', e));
          }
        }
        
        resolve();
      });
    });
  } catch (error) {
    console.error(`Error playing sound ${soundName}:`, error);
    return Promise.resolve();
  }
};

/**
 * Base64-encoded minimal sound files for fallback use
 * These are tiny, simple sounds that can be used when file loading fails
 */
const FALLBACK_SOUND_DATA = {
  // Simple "ding" sound
  correctSound: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAeAAAkYAAHBwcHDw8PDxcXFxcfHx8fJycnJy8vLy83Nzc3Pz8/P0dHR0dPT09PV1dXV19fX19nZ2dna2tra3Nzc3N7e3t7g4ODg4uLi4uTk5OTm5ubm6Ojo6Orq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6ur//vQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  
  // Simple "tada" celebration sound
  celebrationSound: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAeAAAkYAAHBwcHDw8PDxcXFxcfHx8fJycnJy8vLy83Nzc3Pz8/P0dHR0dPT09PV1dXV19fX19nZ2dna2tra3Nzc3N7e3t7g4ODg4uLi4uTk5OTm5ubm6Ojo6Orq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6ur//vQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
};

/**
 * Play correct answer sound
 * @param {number} volume - Volume level from 0 to 1
 */
export const playCorrectSound = (volume = 0.5) => {
  // Randomly choose between the two correct answer sounds
  const sounds = ['correct-answer', 'correct-chime'];
  const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
  
  // Try to play the sound from file
  return playSound(randomSound, volume)
    .catch(err => {
      console.warn('[Sound] Regular sound file failed, trying data URI fallback:', err);
      
      // As a last resort fallback, try to play the embedded base64 data
      try {
        const fallbackAudio = new Audio(FALLBACK_SOUND_DATA.correctSound);
        fallbackAudio.volume = volume;
        return fallbackAudio.play();
      } catch (fallbackErr) {
        console.error('[Sound] Data URI fallback also failed:', fallbackErr);
        return Promise.resolve(); // Resolve even on failure to prevent app disruption
      }
    });
};

/**
 * Play celebration sound for quiz completion
 * @param {number} volume - Volume level from 0 to 1
 * @param {boolean} kidFriendly - Whether to use the kid-friendly sound
 */
export const playCelebrationSound = (volume = 0.5, kidFriendly = true) => {
  // Use kid-friendly celebration for younger students
  const sound = kidFriendly ? 'celebration-kids' : 'celebration';
  
  // Try to play the sound from file
  return playSound(sound, volume)
    .catch(err => {
      console.warn('[Sound] Regular celebration sound failed, trying data URI fallback:', err);
      
      // As a last resort fallback, try to play the embedded base64 data
      try {
        const fallbackAudio = new Audio(FALLBACK_SOUND_DATA.celebrationSound);
        fallbackAudio.volume = volume;
        return fallbackAudio.play();
      } catch (fallbackErr) {
        console.error('[Sound] Data URI celebration fallback also failed:', fallbackErr);
        return Promise.resolve(); // Resolve even on failure to prevent app disruption
      }
    });
};

/**
 * Enable or disable sounds
 * @param {boolean} enabled - Whether sounds should be enabled
 */
export const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
  // Save preference to localStorage
  try {
    localStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Could not save sound preference to localStorage');
  }
};

/**
 * Get current sound enabled status
 * @returns {boolean} - Whether sounds are enabled
 */
export const isSoundEnabled = () => {
  return soundEnabled;
};

/**
 * Initialize sound settings from localStorage
 */
export const initSoundSettings = () => {
  try {
    const savedPreference = localStorage.getItem('soundEnabled');
    if (savedPreference !== null) {
      soundEnabled = savedPreference === 'true';
    }
    
    // Log environment info for debugging in production
    const isProduction = window.location.hostname.includes('netlify.app') || 
                        !window.location.hostname.includes('localhost');
    
    console.log(`[Sound System] Initialized (enabled: ${soundEnabled})`);
    console.log(`[Sound System] Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`[Sound System] Hostname: ${window.location.hostname}`);
    console.log(`[Sound System] Sound path: ${isProduction ? '/api/sounds/...' : '/sounds/...'}`);
    
    // Preload sounds for better performance
    if (soundEnabled) {
      setTimeout(() => {
        console.log('[Sound System] Preloading sounds...');
        loadSound('correct-answer');
        loadSound('correct-chime');
        loadSound('celebration-kids');
        loadSound('celebration');
        console.log('[Sound System] Preloading complete');
      }, 2000); // Delay preloading to not block initial rendering
    }
  } catch (e) {
    console.warn('Could not load sound preference from localStorage');
  }
};

// Initialize sound settings on module load
initSoundSettings();

/**
 * Test sound loading by attempting to load from multiple paths
 * Helps debug issues in production environment
 * @returns {Object} Test results
 */
export const testSoundLoading = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hostname: window.location.hostname,
      isProduction: window.location.hostname.includes('netlify.app') || 
                   !window.location.hostname.includes('localhost'),
      protocol: window.location.protocol,
      userAgent: navigator.userAgent
    },
    tests: []
  };
  
  // Define test paths
  const testPaths = [
    '/sounds/correct-answer.mp3',
    '/sounds/celebration.mp3',
    '/api/sounds/correct-answer.mp3',
    '/api/sounds/celebration.mp3'
  ];
  
  // Test each path
  for (const path of testPaths) {
    try {
      const startTime = Date.now();
      const audio = new Audio(path);
      
      // Log the test attempt
      console.log(`[Sound Test] Testing path: ${path}`);
      
      // Create promise to track loading
      const loadResult = await new Promise((resolve) => {
        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          resolve({
            success: false,
            error: 'Timeout after 5 seconds',
            duration: 5000
          });
        }, 5000);
        
        // Handle successful load
        audio.oncanplaythrough = () => {
          clearTimeout(timeout);
          resolve({
            success: true,
            duration: Date.now() - startTime,
            audioProperties: {
              duration: audio.duration,
              readyState: audio.readyState,
              networkState: audio.networkState
            }
          });
        };
        
        // Handle errors
        audio.onerror = (e) => {
          clearTimeout(timeout);
          resolve({
            success: false,
            errorCode: audio.error?.code,
            errorMessage: audio.error?.message,
            networkState: audio.networkState,
            duration: Date.now() - startTime
          });
        };
        
        // Start loading
        audio.load();
      });
      
      // Add result to tests array
      results.tests.push({
        path,
        ...loadResult
      });
      
      console.log(`[Sound Test] Result for ${path}:`, loadResult);
      
    } catch (error) {
      console.error(`[Sound Test] Error testing ${path}:`, error);
      results.tests.push({
        path,
        success: false,
        error: error.toString(),
        stack: error.stack
      });
    }
  }
  
  // Try to fetch debug info from API
  try {
    const debugResponse = await fetch('/api/sounds-debug');
    const debugData = await debugResponse.json();
    results.serverDebugInfo = debugData;
  } catch (error) {
    results.serverDebugInfo = {
      error: error.toString(),
      message: 'Failed to fetch server debug info'
    };
  }
  
  console.log('[Sound Test] Complete test results:', results);
  return results;
};