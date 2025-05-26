import React, { useState } from 'react';
import axios from 'axios';

const ChildProgressDebug = () => {
  const [studentId, setStudentId] = useState('21'); // Default to the failing ID
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  
  const testEndpoint = async (name, url) => {
    try {
      console.log(`[Debug] Testing ${name}: ${url}`);
      const response = await axios.get(url);
      setResults(prev => ({
        ...prev,
        [name]: { success: true, data: response.data, status: response.status }
      }));
      console.log(`[Debug] ${name} SUCCESS:`, response.data);
    } catch (error) {
      console.error(`[Debug] ${name} ERROR:`, error);
      setResults(prev => ({
        ...prev,
        [name]: { 
          success: false, 
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      }));
    }
  };
  
  const testAllEndpoints = async () => {
    setLoading(true);
    setResults({});
    
    const endpoints = [
      ['Student Profile', `/api/students/${studentId}`],
      ['Knowledge States', `/api/students/${studentId}/knowledge-states`],
      ['Learning Path', `/api/students/${studentId}/learning-path`],
      ['Weekly Report', `/api/parents/students/${studentId}/weekly-report`],
      ['Detailed Performance', `/api/students/${studentId}/detailed-performance`]
    ];
    
    // Test each endpoint one by one to see which fails
    for (const [name, url] of endpoints) {
      await testEndpoint(name, url);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setLoading(false);
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Child Progress API Debug Tool</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Student ID: 
          <input 
            type="number" 
            value={studentId} 
            onChange={(e) => setStudentId(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
        <button 
          onClick={testAllEndpoints} 
          disabled={loading}
          style={{ marginLeft: '10px', padding: '5px 15px' }}
        >
          {loading ? 'Testing...' : 'Test All Endpoints'}
        </button>
      </div>
      
      <div>
        {Object.entries(results).map(([name, result]) => (
          <div key={name} style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            border: `2px solid ${result.success ? 'green' : 'red'}`,
            borderRadius: '5px'
          }}>
            <h3 style={{ color: result.success ? 'green' : 'red' }}>
              {name} - {result.success ? 'SUCCESS' : 'FAILED'}
              {result.status && ` (${result.status})`}
            </h3>
            
            {result.success ? (
              <div>
                <p><strong>Data type:</strong> {Array.isArray(result.data) ? 'Array' : typeof result.data}</p>
                {Array.isArray(result.data) && (
                  <p><strong>Array length:</strong> {result.data.length}</p>
                )}
                <details>
                  <summary>View Data</summary>
                  <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div>
                <p><strong>Error:</strong> {result.error}</p>
                {result.data && (
                  <details>
                    <summary>View Error Details</summary>
                    <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto' }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildProgressDebug;