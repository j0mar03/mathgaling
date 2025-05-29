import React, { useState } from 'react';
import { testSoundLoading, playSound, playCorrectSound, playCelebrationSound } from '../../utils/soundUtils';

/**
 * Debug component to test sound functionality and diagnose issues
 */
const SoundDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Run the sound loading test
  const runTest = async () => {
    setLoading(true);
    try {
      const testResults = await testSoundLoading();
      setResults(testResults);
    } catch (error) {
      console.error('Error running sound test:', error);
      setResults({
        error: true,
        message: error.toString(),
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  // Test playing a specific sound
  const testPlaySound = (soundName) => {
    console.log(`Testing sound: ${soundName}`);
    playSound(soundName);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: expanded ? '10px' : '-380px',
        right: '10px',
        width: '350px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        transition: 'bottom 0.3s ease',
        zIndex: 1000
      }}
    >
      {/* Tab at top to expand/collapse */}
      <div 
        style={{
          position: 'absolute',
          top: '-30px',
          left: '0',
          width: '100%',
          backgroundColor: '#6c757d',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          textAlign: 'center'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '▼ Sound Debugger (Hide)' : '▲ Sound Debugger (Show)'}
      </div>

      <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Sound System Debugger</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={runTest} 
          disabled={loading}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Testing...' : 'Run Diagnostics'}
        </button>
        
        <button
          onClick={() => setResults(null)}
          disabled={!results || loading}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '4px',
            cursor: (!results || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          Clear
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#495057' }}>Test Individual Sounds:</h4>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => testPlaySound('correct-answer')}
            style={{ 
              padding: '5px 10px', 
              backgroundColor: '#28a745', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✓ Correct
          </button>
          <button 
            onClick={() => testPlaySound('correct-chime')}
            style={{ 
              padding: '5px 10px', 
              backgroundColor: '#17a2b8', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔔 Chime
          </button>
          <button 
            onClick={() => playCelebrationSound()}
            style={{ 
              padding: '5px 10px', 
              backgroundColor: '#ffc107', 
              color: '#212529',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🎉 Celebrate
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#495057' }}>Direct URL Tests:</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <a 
            href="/sounds/correct-answer.mp3" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            Test Direct: /sounds/correct-answer.mp3
          </a>
          <a 
            href="/api/sounds/correct-answer.mp3" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            Test API: /api/sounds/correct-answer.mp3
          </a>
          <a 
            href="/api/sounds-debug" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            Server Debug Info
          </a>
        </div>
      </div>

      {results && (
        <div 
          style={{ 
            maxHeight: '200px', 
            overflowY: 'auto', 
            padding: '10px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          <h4 style={{ margin: '0 0 5px 0', color: '#495057' }}>Test Results:</h4>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default SoundDebugger;