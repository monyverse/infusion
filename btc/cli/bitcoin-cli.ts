#!/usr/bin/env node

import { Command } from 'commander';
import { BitcoinHTLCScripts } from '../scripts/htlc-scripts';
import { BitcoinTransactionBuilder } from '../utils/transaction-builder';
import { BitcoinKeyManager } from '../utils/key-manager';
import { BitcoinConfig } from '../config/network-config';

const program = new Command();

program
  .name('bitcoin-cli')
  .description('Bitcoin CLI for HTLC operations and atomic swaps')
  .version('1.0.0');

// HTLC Script Commands
program
  .command('generate-htlc')
  .description('Generate HTLC script and address')
  .option('-n, --network <network>', 'Network (mainnet/testnet)', 'testnet')
  .option('-r, --recipient <pubkey>', 'Recipient public key')
  .option('-s, --sender <pubkey>', 'Sender public key')
  .option('-l, --locktime <seconds>', 'Locktime in seconds', '3600')
  .option('--secret <hex>', 'Pre-generated secret (optional)')
  .action(async (options) => {
    try {
      const htlcScripts = new BitcoinHTLCScripts(options.network);
      
      let secret: Buffer;
      if (options.secret) {
        secret = Buffer.from(options.secret, 'hex');
      } else {
        const generated = htlcScripts.generateSecretAndHashlock();
        secret = generated.secret;
      }
      
      const hashlock = htlcScripts.generateHashlock(secret);
      const recipientPubKey = Buffer.from(options.recipient, 'hex');
      const senderPubKey = Buffer.from(options.sender, 'hex');
      const locktime = parseInt(options.locktime);
      
      const script = htlcScripts.generateHTLCScript(
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime
      );
      
      const address = htlcScripts.generateHTLCAddress(
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime
      );
      
      console.log('HTLC Generated:');
      console.log(`Secret: ${secret.toString('hex')}`);
      console.log(`Hashlock: ${hashlock.toString('hex')}`);
      console.log(`Script: ${script}`);
      console.log(`Address: ${address}`);
      console.log(`Locktime: ${locktime} seconds`);
      
    } catch (error) {
      console.error('Error generating HTLC:', error);
      process.exit(1);
    }
  });

// Transaction Commands
program
  .command('create-withdrawal')
  .description('Create withdrawal transaction')
  .option('-n, --network <network>', 'Network (mainnet/testnet)', 'testnet')
  .option('-u, --utxo <txid:vout>', 'UTXO to spend (txid:vout)')
  .option('-v, --value <satoshis>', 'UTXO value in satoshis')
  .option('-r, --recipient <address>', 'Recipient address')
  .option('-a, --amount <satoshis>', 'Amount to send')
  .option('--secret <hex>', 'Secret for HTLC')
  .option('--hashlock <hex>', 'Hashlock')
  .option('--recipient-pubkey <hex>', 'Recipient public key')
  .option('--sender-pubkey <hex>', 'Sender public key')
  .option('--locktime <seconds>', 'Locktime')
  .option('-f, --fee <satoshis>', 'Fee in satoshis', '1000')
  .action(async (options) => {
    try {
      const [txid, vout] = options.utxo.split(':');
      const utxo = {
        txid,
        vout: parseInt(vout),
        value: parseInt(options.value)
      };
      
      const secret = Buffer.from(options.secret, 'hex');
      const hashlock = Buffer.from(options.hashlock, 'hex');
      const recipientPubKey = Buffer.from(options.recipientPubkey, 'hex');
      const senderPubKey = Buffer.from(options.senderPubkey, 'hex');
      const locktime = parseInt(options.locktime);
      
      const htlcScripts = new BitcoinHTLCScripts(options.network);
      const txData = htlcScripts.createWithdrawalTransactionData(
        utxo,
        options.recipient,
        parseInt(options.amount),
        secret,
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime,
        parseInt(options.fee)
      );
      
      console.log('Withdrawal Transaction Data:');
      console.log(JSON.stringify(txData, null, 2));
      
    } catch (error) {
      console.error('Error creating withdrawal transaction:', error);
      process.exit(1);
    }
  });

program
  .command('create-refund')
  .description('Create refund transaction')
  .option('-n, --network <network>', 'Network (mainnet/testnet)', 'testnet')
  .option('-u, --utxo <txid:vout>', 'UTXO to spend (txid:vout)')
  .option('-v, --value <satoshis>', 'UTXO value in satoshis')
  .option('-s, --sender <address>', 'Sender address')
  .option('-a, --amount <satoshis>', 'Amount to send')
  .option('--hashlock <hex>', 'Hashlock')
  .option('--recipient-pubkey <hex>', 'Recipient public key')
  .option('--sender-pubkey <hex>', 'Sender public key')
  .option('--locktime <seconds>', 'Locktime')
  .option('-f, --fee <satoshis>', 'Fee in satoshis', '1000')
  .action(async (options) => {
    try {
      const [txid, vout] = options.utxo.split(':');
      const utxo = {
        txid,
        vout: parseInt(vout),
        value: parseInt(options.value)
      };
      
      const hashlock = Buffer.from(options.hashlock, 'hex');
      const recipientPubKey = Buffer.from(options.recipientPubkey, 'hex');
      const senderPubKey = Buffer.from(options.senderPubkey, 'hex');
      const locktime = parseInt(options.locktime);
      
      const htlcScripts = new BitcoinHTLCScripts(options.network);
      const txData = htlcScripts.createRefundTransactionData(
        utxo,
        options.sender,
        parseInt(options.amount),
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime,
        parseInt(options.fee)
      );
      
      console.log('Refund Transaction Data:');
      console.log(JSON.stringify(txData, null, 2));
      
    } catch (error) {
      console.error('Error creating refund transaction:', error);
      process.exit(1);
    }
  });

// Key Management Commands
program
  .command('generate-keys')
  .description('Generate Bitcoin key pair')
  .option('-n, --network <network>', 'Network (mainnet/testnet)', 'testnet')
  .option('-f, --format <format>', 'Output format (json/hex)', 'json')
  .action(async (options) => {
    try {
      const keyManager = new BitcoinKeyManager(options.network);
      const keyPair = keyManager.generateKeyPair();
      
      if (options.format === 'hex') {
        console.log(`Private Key: ${keyPair.privateKey.toString('hex')}`);
        console.log(`Public Key: ${keyPair.publicKey.toString('hex')}`);
        console.log(`Address: ${keyPair.address}`);
      } else {
        console.log(JSON.stringify({
          privateKey: keyPair.privateKey.toString('hex'),
          publicKey: keyPair.publicKey.toString('hex'),
          address: keyPair.address,
          network: options.network
        }, null, 2));
      }
      
    } catch (error) {
      console.error('Error generating keys:', error);
      process.exit(1);
    }
  });

// Network Commands
program
  .command('get-balance')
  .description('Get Bitcoin address balance')
  .option('-n, --network <network>', 'Network (mainnet/testnet)', 'testnet')
  .option('-a, --address <address>', 'Bitcoin address')
  .action(async (options) => {
    try {
      const config = new BitcoinConfig(options.network);
      const balance = await config.getAddressBalance(options.address);
      
      console.log(`Balance for ${options.address}:`);
      console.log(`Confirmed: ${balance.confirmed} BTC`);
      console.log(`Unconfirmed: ${balance.unconfirmed} BTC`);
      console.log(`Total: ${balance.total} BTC`);
      
    } catch (error) {
      console.error('Error getting balance:', error);
      process.exit(1);
    }
  });

program
  .command('get-utxos')
  .description('Get UTXOs for Bitcoin address')
  .option('-n, --network <network>', 'Network (mainnet/testnet)', 'testnet')
  .option('-a, --address <address>', 'Bitcoin address')
  .action(async (options) => {
    try {
      const config = new BitcoinConfig(options.network);
      const utxos = await config.getAddressUTXOs(options.address);
      
      console.log(`UTXOs for ${options.address}:`);
      utxos.forEach((utxo, index) => {
        console.log(`${index + 1}. ${utxo.txid}:${utxo.vout} - ${utxo.value} satoshis`);
      });
      
    } catch (error) {
      console.error('Error getting UTXOs:', error);
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    program.help();
  });

program.parse(); 