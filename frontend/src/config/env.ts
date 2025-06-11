declare global {
  interface Window {
    ENV: {
      REACT_APP_API_URL: string;
      REACT_APP_WS_URL: string;
    };
  }
}

export const config = {
  apiUrl: window.ENV?.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001',
  wsUrl: window.ENV?.REACT_APP_WS_URL || process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
};
