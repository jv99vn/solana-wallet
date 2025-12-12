import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  SendOptions,
  Commitment,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { NetworkConfig, TokenBalance } from '@/types';

export const NETWORKS: NetworkConfig[] = [
  {
    name: 'Mainnet Beta',
    endpoint: 'https://api.mainnet-beta.solana.com',
    cluster: 'mainnet-beta',
  },
  {
    name: 'Devnet',
    endpoint: 'https://api.devnet.solana.com',
    cluster: 'devnet',
  },
  {
    name: 'Testnet',
    endpoint: 'https://api.testnet.solana.com',
    cluster: 'testnet',
  },
];

const NETWORK_STORAGE_KEY = 'sol_wallet_network';

class SolanaConnection {
  private connection: Connection;
  private network: NetworkConfig;

  constructor() {
    this.network = NETWORKS[0];
    this.connection = new Connection(this.network.endpoint, 'confirmed');
  }

  async initialize(): Promise<void> {
    const result = await chrome.storage.local.get(NETWORK_STORAGE_KEY);
    if (result[NETWORK_STORAGE_KEY]) {
      this.network = result[NETWORK_STORAGE_KEY];
      this.connection = new Connection(this.network.endpoint, 'confirmed');
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  getNetwork(): NetworkConfig {
    return this.network;
  }

  async setNetwork(network: NetworkConfig): Promise<void> {
    this.network = network;
    this.connection = new Connection(network.endpoint, 'confirmed');
    await chrome.storage.local.set({ [NETWORK_STORAGE_KEY]: network });
  }

  async getBalance(publicKey: string): Promise<number> {
    const pubkey = new PublicKey(publicKey);
    const balance = await this.connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  }

  async getTokenAccounts(publicKey: string): Promise<TokenBalance[]> {
    const pubkey = new PublicKey(publicKey);
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID,
    });

    const tokens: TokenBalance[] = [];

    for (const account of tokenAccounts.value) {
      const parsedInfo = account.account.data.parsed.info;
      const tokenAmount = parsedInfo.tokenAmount;

      if (tokenAmount.uiAmount > 0) {
        tokens.push({
          mint: parsedInfo.mint,
          symbol: 'Unknown',
          name: 'Unknown Token',
          balance: tokenAmount.amount,
          decimals: tokenAmount.decimals,
          uiBalance: tokenAmount.uiAmountString,
        });
      }
    }

    return tokens;
  }

  async getTokenMetadata(mintAddress: string): Promise<{ name: string; symbol: string; logoUri?: string } | null> {
    try {
      // Try to fetch from Jupiter token list
      const response = await fetch('https://token.jup.ag/strict');
      const tokens = await response.json();
      const token = tokens.find((t: { address: string }) => t.address === mintAddress);

      if (token) {
        return {
          name: token.name,
          symbol: token.symbol,
          logoUri: token.logoURI,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    options?: SendOptions
  ): Promise<string> {
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      options
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  async createTransferTransaction(
    from: PublicKey,
    to: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const transaction = new Transaction();
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports,
      })
    );

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = from;

    return transaction;
  }

  async createTokenTransferTransaction(
    from: PublicKey,
    to: PublicKey,
    mint: PublicKey,
    amount: number,
    decimals: number
  ): Promise<Transaction> {
    const transaction = new Transaction();

    const fromAta = await getAssociatedTokenAddress(mint, from);
    const toAta = await getAssociatedTokenAddress(mint, to);

    // Check if the destination ATA exists
    const toAtaInfo = await this.connection.getAccountInfo(toAta);

    if (!toAtaInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          from,
          toAta,
          to,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    const tokenAmount = Math.floor(amount * Math.pow(10, decimals));

    transaction.add(
      createTransferInstruction(
        fromAta,
        toAta,
        from,
        tokenAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = from;

    return transaction;
  }

  async estimateFee(transaction: Transaction): Promise<number> {
    const fee = await this.connection.getFeeForMessage(
      transaction.compileMessage(),
      'confirmed'
    );
    return (fee.value || 5000) / LAMPORTS_PER_SOL;
  }

  async getRecentTransactions(publicKey: string, limit: number = 20): Promise<any[]> {
    const pubkey = new PublicKey(publicKey);
    const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        return {
          signature: sig.signature,
          timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
          status: sig.err ? 'failed' : 'confirmed',
          tx,
        };
      })
    );

    return transactions;
  }

  async requestAirdrop(publicKey: string, amount: number = 1): Promise<string> {
    if (this.network.cluster === 'mainnet-beta') {
      throw new Error('Airdrop not available on mainnet');
    }

    const pubkey = new PublicKey(publicKey);
    const signature = await this.connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }
}

export const solanaConnection = new SolanaConnection();
