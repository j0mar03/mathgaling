import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import reportWebVitals from './reportWebVitals';

// Create a test function to verify sound file access
const testSoundAccess = () => {
  console.log('Testing sound file access...');
  
  // Array of sound files to test
  const soundFiles = [
    'celebration.mp3',
    'correct-answer.mp3',
    'celebration-kids.mp3',
    'correct-chime.mp3'
  ];
  
  // Create a div to display test results
  const testDiv = document.createElement('div');
  testDiv.id = 'sound-test-results';
  testDiv.style.position = 'fixed';
  testDiv.style.bottom = '10px';
  testDiv.style.right = '10px';
  testDiv.style.padding = '10px';
  testDiv.style.background = '#f0f0f0';
  testDiv.style.border = '1px solid #ccc';
  testDiv.style.borderRadius = '5px';
  testDiv.style.zIndex = '9999';
  testDiv.style.maxWidth = '400px';
  testDiv.style.maxHeight = '300px';
  testDiv.style.overflow = 'auto';
  
  // Add title to test div
  const title = document.createElement('h3');
  title.textContent = 'Sound File Access Test';
  title.style.margin = '0 0 10px 0';
  testDiv.appendChild(title);
  
  // Test direct file access (from public folder)
  const publicTest = document.createElement('div');
  publicTest.innerHTML = '<strong>Public URL Test:</strong>';
  testDiv.appendChild(publicTest);
  
  soundFiles.forEach(file => {
    const result = document.createElement('div');
    result.textContent = `Testing ${file}...`;
    
    const publicUrl = `${process.env.PUBLIC_URL}/sounds/${file}`;
    
    // Create an audio element to test loading
    const audio = new Audio(publicUrl);
    audio.preload = 'metadata';
    
    audio.onloadedmetadata = () => {
      result.textContent = `✅ ${file} (Public): Loaded - ${Math.round(audio.duration)}s`;
      result.style.color = 'green';
    };
    
    audio.onerror = () => {
      result.textContent = `❌ ${file} (Public): Failed to load`;
      result.style.color = 'red';
    };
    
    publicTest.appendChild(result);
  });
  
  // Test API access
  const apiTest = document.createElement('div');
  apiTest.innerHTML = '<strong>API Access Test:</strong>';
  apiTest.style.marginTop = '10px';
  testDiv.appendChild(apiTest);
  
  soundFiles.forEach(file => {
    const result = document.createElement('div');
    result.textContent = `Testing API for ${file}...`;
    
    fetch(`/api/sounds/${file}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = 'metadata';
        
        audio.onloadedmetadata = () => {
          result.textContent = `✅ ${file} (API): Loaded - ${Math.round(audio.duration)}s - Size: ${(blob.size / 1024).toFixed(2)}KB`;
          result.style.color = 'green';
          
          // Add play button
          const playButton = document.createElement('button');
          playButton.textContent = 'Play';
          playButton.style.marginLeft = '5px';
          playButton.onclick = () => audio.play();
          result.appendChild(playButton);
        };
        
        audio.onerror = () => {
          result.textContent = `❌ ${file} (API): Audio format error`;
          result.style.color = 'red';
        };
      })
      .catch(error => {
        result.textContent = `❌ ${file} (API): ${error.message}`;
        result.style.color = 'red';
      });
    
    apiTest.appendChild(result);
  });
  
  // Add a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = '10px';
  closeButton.onclick = () => document.body.removeChild(testDiv);
  testDiv.appendChild(closeButton);
  
  // Add the test div to the body
  document.body.appendChild(testDiv);
};

// Run the test on window load
window.addEventListener('load', () => {
  // Wait a bit for app to initialize
  setTimeout(testSoundAccess, 2000);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap with AuthProvider */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
