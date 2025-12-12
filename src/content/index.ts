// Content script - Bridge between inpage provider and background script

const CHANNEL_NAME = 'sol-wallet-provider';

// Inject inpage script
function injectScript(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inpage.js');
  script.type = 'module';
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

// Establish connection to background script
let port: chrome.runtime.Port | null = null;

function connectToBackground(): chrome.runtime.Port {
  port = chrome.runtime.connect({ name: CHANNEL_NAME });

  port.onDisconnect.addListener(() => {
    port = null;
    // Reconnect after a short delay
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        port = connectToBackground();
      }
    }, 100);
  });

  // Handle responses from background
  port.onMessage.addListener((message) => {
    window.postMessage({
      type: 'SOL_WALLET_RESPONSE',
      data: message,
    }, '*');
  });

  return port;
}

// Listen for messages from inpage script
window.addEventListener('message', (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;
  if (event.data?.type !== 'SOL_WALLET_REQUEST') return;

  const message = event.data.data;

  // Ensure connection exists
  if (!port) {
    port = connectToBackground();
  }

  // Forward message to background
  try {
    port.postMessage(message);
  } catch (error) {
    // Reconnect and retry
    port = connectToBackground();
    port.postMessage(message);
  }
});

// Listen for broadcast messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'REQUEST_RESPONSE' || message.type === 'WALLET_LOCKED') {
    window.postMessage({
      type: 'SOL_WALLET_EVENT',
      data: message,
    }, '*');
  }
});

// Initialize
injectScript();
port = connectToBackground();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !port) {
    port = connectToBackground();
  }
});
