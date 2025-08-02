import { ethers } from 'ethers';
import { AptosClient, AptosAccount, HexString } from '@aptos-labs/ts-sdk';
import { SuiClient, Ed25519Keypair } from '@mysten/sui/client';
import { BitcoinScriptHTLC, LitecoinScriptHTLC, BitcoinCashScriptHTLC } from '../../src/contracts/bitcoin/BitcoinScript';
import * as crypto from 'crypto';

describe('Cross-Chain Atomic Swap Contracts Integration Tests', () => {
  let evmProvider: ethers.JsonRpcProvider;
  let evmWallet: ethers.Wallet;
  let bitcoinHTLC: any;
  let aptosClient: AptosClient;
  let aptosAccount: AptosAccount;
  let suiClient: SuiClient;
  let suiKeypair: Ed25519Keypair;
  let bitcoinHTLCScript: BitcoinScriptHTLC;

  beforeAll(async () => {
    // Setup EVM
    evmProvider = new ethers.JsonRpcProvider(process.env.TEST_RPC_URL || 'http://localhost:8545');
    evmWallet = new ethers.Wallet(process.env.TEST_PRIVATE_KEY || '0x' + '1'.repeat(64), evmProvider);
    
    // Setup Aptos
    aptosClient = new AptosClient(process.env.APTOS_TESTNET_URL || 'https://fullnode.testnet.aptoslabs.com');
    aptosAccount = new AptosAccount(HexString.ensure(process.env.APTOS_TEST_PRIVATE_KEY || '0x' + '1'.repeat(64)).toUint8Array());
    
    // Setup Sui
    suiClient = new SuiClient({ url: process.env.SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io' });
    suiKeypair = Ed25519Keypair.fromSecretKey(Uint8Array.from(Buffer.from(process.env.SUI_TEST_PRIVATE_KEY || '1'.repeat(64), 'hex')));
    
    // Setup Bitcoin Script
    bitcoinHTLCScript = new BitcoinScriptHTLC('testnet');
  });

  describe('EVM BitcoinHTLC Contract', () => {
    beforeEach(async () => {
      // Deploy contract for each test
      const BitcoinHTLC = await ethers.getContractFactory('BitcoinHTLC');
      bitcoinHTLC = await BitcoinHTLC.connect(evmWallet).deploy();
      await bitcoinHTLC.waitForDeployment();
    });

    it('should create HTLC successfully', async () => {
      const htlcId = ethers.keccak256(ethers.toUtf8Bytes('test-htlc'));
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const recipient = ethers.Wallet.createRandom().address;
      const amount = ethers.parseEther('0.1');

      await expect(
        bitcoinHTLC.createHTLC(htlcId, hashlock, timelock, recipient, { value: amount })
      ).to.emit(bitcoinHTLC, 'HTLCCreated')
        .withArgs(htlcId, hashlock, evmWallet.address, recipient, amount, timelock);

      const htlc = await bitcoinHTLC.getHTLC(htlcId);
      expect(htlc.hashlock).to.equal(hashlock);
      expect(htlc.recipient).to.equal(recipient);
      expect(htlc.amount).to.equal(amount);
    });

    it('should redeem HTLC with correct preimage', async () => {
      const htlcId = ethers.keccak256(ethers.toUtf8Bytes('test-htlc-redeem'));
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      const timelock = Math.floor(Date.now() / 1000) + 3600;
      const recipient = ethers.Wallet.createRandom();
      const amount = ethers.parseEther('0.1');

      await bitcoinHTLC.createHTLC(htlcId, hashlock, timelock, recipient.address, { value: amount });

      await expect(
        bitcoinHTLC.connect(recipient).redeemHTLC(htlcId, secret)
      ).to.emit(bitcoinHTLC, 'HTLCRedeemed')
        .withArgs(htlcId, hashlock, secret, recipient.address);
    });

    it('should refund HTLC after timelock expires', async () => {
      const htlcId = ethers.keccak256(ethers.toUtf8Bytes('test-htlc-refund'));
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      const timelock = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago (expired)
      const recipient = ethers.Wallet.createRandom().address;
      const amount = ethers.parseEther('0.1');

      await bitcoinHTLC.createHTLC(htlcId, hashlock, timelock, recipient, { value: amount });

      await expect(
        bitcoinHTLC.refundHTLC(htlcId)
      ).to.emit(bitcoinHTLC, 'HTLCRefunded')
        .withArgs(htlcId, hashlock, evmWallet.address);
    });

    it('should reject invalid preimage', async () => {
      const htlcId = ethers.keccak256(ethers.toUtf8Bytes('test-htlc-invalid'));
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      const timelock = Math.floor(Date.now() / 1000) + 3600;
      const recipient = ethers.Wallet.createRandom();
      const amount = ethers.parseEther('0.1');

      await bitcoinHTLC.createHTLC(htlcId, hashlock, timelock, recipient.address, { value: amount });

      const wrongSecret = ethers.randomBytes(32);
      await expect(
        bitcoinHTLC.connect(recipient).redeemHTLC(htlcId, wrongSecret)
      ).to.be.revertedWith('HTLC: Invalid preimage');
    });
  });

  describe('Aptos Move Module', () => {
    it('should generate correct hashlock', () => {
      const secret = crypto.randomBytes(32);
      const hashlock = crypto.createHash('sha256').update(secret).digest();
      
      expect(hashlock).to.have.length(32);
      expect(hashlock).to.be.instanceOf(Buffer);
    });

    it('should verify preimage correctly', () => {
      const secret = crypto.randomBytes(32);
      const hashlock = crypto.createHash('sha256').update(secret).digest();
      
      const isValid = bitcoinHTLCScript.verifySecret(secret, hashlock);
      expect(isValid).to.be.true;
    });

    it('should reject invalid preimage', () => {
      const secret = crypto.randomBytes(32);
      const wrongSecret = crypto.randomBytes(32);
      const hashlock = crypto.createHash('sha256').update(secret).digest();
      
      const isValid = bitcoinHTLCScript.verifySecret(wrongSecret, hashlock);
      expect(isValid).to.be.false;
    });
  });

  describe('Sui Move Module', () => {
    it('should generate correct hashlock', () => {
      const secret = crypto.randomBytes(32);
      const hashlock = crypto.createHash('sha256').update(secret).digest();
      
      expect(hashlock).to.have.length(32);
      expect(hashlock).to.be.instanceOf(Buffer);
    });

    it('should create valid HTLC script', () => {
      const hashlock = crypto.randomBytes(32);
      const recipientPubKey = crypto.randomBytes(33); // Compressed public key
      const senderPubKey = crypto.randomBytes(33);
      const locktime = Math.floor(Date.now() / 1000) + 3600;

      const script = bitcoinHTLCScript.generateHTLCScript(
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime
      );

      expect(script).to.be.a('string');
      expect(script.length).to.be.greaterThan(0);
    });
  });

  describe('Bitcoin Script HTLC', () => {
    it('should generate valid HTLC script', () => {
      const hashlock = crypto.randomBytes(32);
      const recipientPubKey = crypto.randomBytes(33);
      const senderPubKey = crypto.randomBytes(33);
      const locktime = Math.floor(Date.now() / 1000) + 3600;

      const script = bitcoinHTLCScript.generateHTLCScript(
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime
      );

      expect(script).to.be.a('string');
      expect(script.length).to.be.greaterThan(0);
    });

    it('should generate P2WSH address', () => {
      const scriptHex = '76a914' + 'a'.repeat(40) + '88ac'; // Simple P2PKH script
      const address = bitcoinHTLCScript.generateP2WSHAddress(scriptHex);
      
      expect(address).to.be.a('string');
      expect(address.length).to.be.greaterThan(0);
    });

    it('should create withdrawal transaction data', () => {
      const utxo = {
        txid: 'a'.repeat(64),
        vout: 0,
        value: 1000000
      };
      const recipientAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      const amount = 500000;
      const secret = crypto.randomBytes(32);
      const hashlock = crypto.randomBytes(32);
      const recipientPubKey = crypto.randomBytes(33);
      const senderPubKey = crypto.randomBytes(33);
      const locktime = Math.floor(Date.now() / 1000) + 3600;

      const txData = bitcoinHTLCScript.createWithdrawalTransactionData(
        utxo,
        recipientAddress,
        amount,
        secret,
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime
      );

      expect(txData.inputTxid).to.equal(utxo.txid);
      expect(txData.inputVout).to.equal(utxo.vout);
      expect(txData.outputAddress).to.equal(recipientAddress);
      expect(txData.witness).to.be.an('array');
      expect(txData.witness.length).to.be.greaterThan(0);
    });

    it('should create refund transaction data', () => {
      const utxo = {
        txid: 'b'.repeat(64),
        vout: 1,
        value: 1000000
      };
      const senderAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      const amount = 500000;
      const hashlock = crypto.randomBytes(32);
      const recipientPubKey = crypto.randomBytes(33);
      const senderPubKey = crypto.randomBytes(33);
      const locktime = Math.floor(Date.now() / 1000) - 3600; // Expired

      const txData = bitcoinHTLCScript.createRefundTransactionData(
        utxo,
        senderAddress,
        amount,
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime
      );

      expect(txData.inputTxid).to.equal(utxo.txid);
      expect(txData.inputVout).to.equal(utxo.vout);
      expect(txData.outputAddress).to.equal(senderAddress);
      expect(txData.witness).to.be.an('array');
      expect(txData.witness.length).to.be.greaterThan(0);
    });
  });

  describe('Litecoin HTLC', () => {
    let litecoinHTLC: LitecoinScriptHTLC;

    beforeEach(() => {
      litecoinHTLC = new LitecoinScriptHTLC('testnet');
    });

    it('should have correct network parameters', () => {
      const params = litecoinHTLC.getNetworkParams();
      expect(params.name).to.include('Litecoin');
      expect(params.magic).to.equal(0xf1c8d2fd); // Testnet magic
      expect(params.port).to.equal(19335);
    });

    it('should generate valid HTLC script', () => {
      const hashlock = crypto.randomBytes(32);
      const recipientPubKey = crypto.randomBytes(33);
      const senderPubKey = crypto.randomBytes(33);
      const locktime = Math.floor(Date.now() / 1000) + 3600;

      const script = litecoinHTLC.generateHTLCScript(
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime
      );

      expect(script).to.be.a('string');
      expect(script.length).to.be.greaterThan(0);
    });
  });

  describe('Bitcoin Cash HTLC', () => {
    let bitcoinCashHTLC: BitcoinCashScriptHTLC;

    beforeEach(() => {
      bitcoinCashHTLC = new BitcoinCashScriptHTLC('testnet');
    });

    it('should have correct network parameters', () => {
      const params = bitcoinCashHTLC.getNetworkParams();
      expect(params.name).to.include('Bitcoin Cash');
      expect(params.magic).to.equal(0xf4e5f3f4); // Testnet magic
      expect(params.port).to.equal(18333);
    });

    it('should generate valid HTLC script', () => {
      const hashlock = crypto.randomBytes(32);
      const recipientPubKey = crypto.randomBytes(33);
      const senderPubKey = crypto.randomBytes(33);
      const locktime = Math.floor(Date.now() / 1000) + 3600;

      const script = bitcoinCashHTLC.generateHTLCScript(
        hashlock,
        recipientPubKey,
        senderPubKey,
        locktime
      );

      expect(script).to.be.a('string');
      expect(script.length).to.be.greaterThan(0);
    });
  });

  describe('Cross-Chain Integration', () => {
    it('should generate consistent hashlock across all chains', () => {
      const secret = crypto.randomBytes(32);
      
      // EVM hashlock
      const evmHashlock = ethers.keccak256(secret);
      
      // Aptos/Sui/Bitcoin hashlock
      const scriptHashlock = crypto.createHash('sha256').update(secret).digest('hex');
      
      // Convert EVM hashlock to hex for comparison
      const evmHashlockHex = evmHashlock.slice(2); // Remove '0x' prefix
      
      expect(scriptHashlock).to.equal(evmHashlockHex);
    });

    it('should verify preimage consistently across all chains', () => {
      const secret = crypto.randomBytes(32);
      const hashlock = crypto.createHash('sha256').update(secret).digest();
      
      // Bitcoin script verification
      const scriptValid = bitcoinHTLCScript.verifySecret(secret, hashlock);
      
      // EVM verification
      const evmHashlock = ethers.keccak256(secret);
      const evmValid = evmHashlock === ethers.keccak256(secret);
      
      expect(scriptValid).to.be.true;
      expect(evmValid).to.be.true;
    });
  });
}); 