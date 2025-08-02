# Manual NEAR Account Creation Guide

If you're experiencing rate limit errors with the NEAR CLI, follow this manual process to create a NEAR testnet account.

## Step 1: Create Account via Web Wallet

1. **Visit NEAR Testnet Wallet**: Go to https://testnet.mynearwallet.com/

2. **Create New Account**:
   - Click "Create Account"
   - Choose a unique account name (e.g., `uniteai-wallet`)
   - Follow the setup process
   - **Save your seed phrase securely**

3. **Fund Your Account**:
   - Visit the NEAR testnet faucet: https://testnet.mynearwallet.com/
   - Request test NEAR tokens (you'll get ~200 NEAR)

## Step 2: Export Account Credentials

1. **Access Your Account**:
   - Go to https://testnet.mynearwallet.com/
   - Sign in with your account

2. **Export Private Key**:
   - Go to Settings → Security
   - Click "Export Private Key"
   - Enter your password
   - Copy the private key (starts with `ed25519:`)

## Step 3: Configure NEAR CLI

1. **Create NEAR Configuration**:
   ```bash
   mkdir -p ~/.near
   ```

2. **Create config.json**:
   ```bash
   cat > ~/.near/config.json << EOF
   {
     "networkId": "testnet",
     "nodeUrl": "https://testnet.near.fastnear.com",
     "walletUrl": "https://testnet.mynearwallet.com",
     "helperUrl": "https://testnet.mynearwallet.com",
     "explorerUrl": "https://explorer.testnet.near.org"
   }
   EOF
   ```

3. **Add Account Credentials**:
   ```bash
   near add-credentials your-account.testnet
   ```
   - When prompted, paste your private key

## Step 4: Deploy Contracts

1. **Set Environment Variable**:
   ```bash
   export OWNER_ACCOUNT=your-account.testnet
   ```

2. **Deploy Contracts**:
   ```bash
   npm run near:deploy
   ```

## Alternative: Use Existing Account

If you already have a NEAR account:

1. **Set Environment Variable**:
   ```bash
   export OWNER_ACCOUNT=your-existing-account.testnet
   export SKIP_ACCOUNT_CREATION=true
   ```

2. **Deploy Contracts**:
   ```bash
   npm run near:deploy
   ```

## Troubleshooting

### Rate Limit Issues
- Wait 2-3 minutes between attempts
- Use different RPC endpoints
- Try during off-peak hours

### Account Creation Fails
- Use the web wallet method above
- Ensure account name is unique
- Check if account already exists

### Deployment Fails
- Ensure account has sufficient NEAR (at least 50 NEAR)
- Check account permissions
- Verify contract compilation

## Quick Commands

```bash
# Setup environment only
npm run near:setup

# Create account manually, then deploy
export OWNER_ACCOUNT=your-account.testnet
npm run near:deploy

# Use existing account
export OWNER_ACCOUNT=your-account.testnet
export SKIP_ACCOUNT_CREATION=true
npm run near:deploy
``` 