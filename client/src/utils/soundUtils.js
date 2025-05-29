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
  
  const audio = new Audio(`/sounds/${soundName}.mp3`);
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
    
    return new Promise((resolve) => {
      audio.onended = resolve;
      audio.play().catch(error => {
        console.warn(`Failed to play sound ${soundName}:`, error);
        resolve();
      });
    });
  } catch (error) {
    console.error(`Error playing sound ${soundName}:`, error);
    return Promise.resolve();
  }
};

/**
 * Play correct answer sound
 * @param {number} volume - Volume level from 0 to 1
 */
export const playCorrectSound = (volume = 0.5) => {
  // Randomly choose between the two correct answer sounds
  const sounds = ['correct-answer', 'correct-chime'];
  const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
  return playSound(randomSound, volume);
};

/**
 * Play celebration sound for quiz completion
 * @param {number} volume - Volume level from 0 to 1
 * @param {boolean} kidFriendly - Whether to use the kid-friendly sound
 */
export const playCelebrationSound = (volume = 0.5, kidFriendly = true) => {
  // Use kid-friendly celebration for younger students
  const sound = kidFriendly ? 'celebration-kids' : 'celebration';
  return playSound(sound, volume);
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
  } catch (e) {
    console.warn('Could not load sound preference from localStorage');
  }
};

// Initialize sound settings on module load
initSoundSettings();