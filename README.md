# Sol Wallet - Solana Browser Extension Wallet

A beautiful, secure, and feature-rich Solana wallet browser extension built with TypeScript, React, Vite, and Tailwind CSS.

![Sol Wallet](https://img.shields.io/badge/Solana-Wallet-9945FF?style=for-the-badge&logo=solana&logoColor=white)

## Features

- 🔐 **Secure**: BIP39 mnemonic generation, encrypted storage with PBKDF2
- 🎨 **Beautiful UI**: Dark mode, smooth animations with Framer Motion
- 💰 **Full Functionality**: Create/import wallets, send/receive SOL & SPL tokens
- 🔗 **dApp Integration**: Wallet Standard compatible, provider injection
- 🌐 **Multi-network**: Support for Mainnet, Devnet, and Testnet
- 📱 **Account Management**: Multiple accounts, easy switching
- 🔄 **Transaction History**: View recent transactions with explorer links

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Blockchain**: @solana/web3.js, @solana/spl-token
- **Cryptography**: bip39, tweetnacl, crypto-js

## Project Structure

```
solana-wallet/
├── public/
│   ├── manifest.json      # Chrome Extension Manifest V3
│   └── icons/             # Extension icons
├── src/
│   ├── background/        # Service worker (background script)
│   ├── content/           # Content script & injected provider
│   ├── popup/             # Popup UI (React app)
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main popup app
│   │   └── main.tsx       # Entry point
│   ├── options/           # Options page (React app)
│   ├── components/        # Shared React components
│   │   ├── ui/            # Base UI components
│   │   └── wallet/        # Wallet-specific components
│   ├── core/              # Core wallet logic
│   │   ├── crypto.ts      # Cryptographic utilities
│   │   ├── wallet.ts      # Wallet manager
│   │   ├── connection.ts  # Solana connection handler
│   │   └── storage.ts     # Chrome storage utilities
│   ├── hooks/             # React hooks
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
├── popup.html             # Popup HTML
├── options.html           # Options page HTML
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies
```

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd solana-wallet
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the extension**
```bash
npm run build
```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

### Development mode
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Build and prepare extension
```bash
npm run build:extension
```

## Usage

### Creating a New Wallet

1. Click the extension icon to open the popup
2. Click "Create New Wallet"
3. Set a strong password
4. **Important**: Write down your 12-word recovery phrase
5. Verify your recovery phrase
6. Done! Your wallet is ready

### Importing an Existing Wallet

1. Click "Import Existing Wallet"
2. Enter your 12 or 24 word recovery phrase
3. Set a password
4. Your wallet will be imported

### Sending SOL

1. Click "Send" on the main screen
2. Enter the recipient's address
3. Enter the amount
4. Confirm the transaction

### Receiving SOL

1. Click "Receive" on the main screen
2. Copy your address or scan the QR code
3. Share with the sender

### Connecting to dApps

When you visit a Solana dApp:
1. The dApp will request to connect
2. A popup will appear asking for approval
3. Click "Connect" to authorize
4. The dApp can now interact with your wallet

## Security

- **Private keys are never exposed**: All signing happens locally
- **Encrypted storage**: Your mnemonic is encrypted with your password using AES-256
- **Auto-lock**: Wallet automatically locks after inactivity
- **No tracking**: No analytics or data collection

## dApp Integration

Sol Wallet exposes a provider at `window.solana` compatible with the Wallet Standard:

```javascript
// Check if Sol Wallet is installed
if (window.solana?.isSolWallet) {
  // Connect
  const { publicKey } = await window.solana.connect();

  // Sign message
  const message = new TextEncoder().encode('Hello, Solana!');
  const { signature } = await window.solana.signMessage(message);

  // Sign and send transaction
  const { signature } = await window.solana.signAndSendTransaction(transaction);
}
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.

## Disclaimer

This is a development project. Always verify transactions carefully and never share your recovery phrase. Use at your own risk.
