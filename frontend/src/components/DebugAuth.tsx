import React, { useState, useEffect } from 'react';

const DebugAuth: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  const checkAuthState = () => {
    const possibleKeys = ['auth_token', 'token', 'authToken', 'accessToken'];
    const tokens: any = {};
    
    possibleKeys.forEach(key => {
      const value = localStorage.getItem(key);
      tokens[key] = value ? `${value.substring(0, 20)}...` : null;
    });

    const allKeys = Object.keys(localStorage);
    
    setDebugInfo({
      tokens,
      allLocalStorageKeys: allKeys,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  useEffect(() => {
    checkAuthState();
    // Atualizar a cada 2 segundos
    const interval = setInterval(checkAuthState, 2000);
    return () => clearInterval(interval);
  }, []);

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@flowbuilder.com',
          password: 'admin123'
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        localStorage.setItem('auth_token', result.data.token);
        alert('Login realizado com sucesso!');
        checkAuthState();
      } else {
        alert(`Erro no login: ${result.message}`);
      }
    } catch (error) {
      alert(`Erro no login: ${error}`);
    }
  };

  const clearStorage = () => {
    localStorage.clear();
    checkAuthState();
    alert('localStorage limpo!');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '15px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔍 Debug Auth</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Tokens no localStorage:</strong>
        <pre style={{ fontSize: '10px', background: '#f5f5f5', padding: '5px', margin: '5px 0' }}>
          {JSON.stringify(debugInfo.tokens, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Todas as chaves:</strong>
        <div style={{ fontSize: '10px', background: '#f5f5f5', padding: '5px', margin: '5px 0' }}>
          {debugInfo.allLocalStorageKeys?.join(', ') || 'Nenhuma'}
        </div>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <small>Última atualização: {debugInfo.timestamp}</small>
      </div>
      
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button 
          onClick={testLogin}
          style={{ fontSize: '10px', padding: '5px 8px' }}
        >
          Login
        </button>
        <button 
          onClick={clearStorage}
          style={{ fontSize: '10px', padding: '5px 8px' }}
        >
          Limpar
        </button>
        <button 
          onClick={checkAuthState}
          style={{ fontSize: '10px', padding: '5px 8px' }}
        >
          Atualizar
        </button>
      </div>
    </div>
  );
};

export default DebugAuth; 