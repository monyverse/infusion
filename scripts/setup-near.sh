#!/bin/bash

# NEAR Setup Script for UniteAI Wallet
# This script helps set up NEAR environment and account creation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists near; then
        print_error "NEAR CLI is not installed. Please install it first."
        print_status "Install with: npm install -g near-cli"
        exit 1
    fi
    
    # Check NEAR CLI version
    NEAR_VERSION=$(near --version)
    print_status "NEAR CLI version: $NEAR_VERSION"
    
    print_success "Prerequisites check passed"
}

# Function to setup NEAR environment
setup_near_environment() {
    print_status "Setting up NEAR environment..."
    
    # Set environment variables for better RPC performance
    export NEAR_ENV=testnet
    
    # Try multiple RPC endpoints in order of preference
    RPC_ENDPOINTS=(
        "https://testnet.near.fastnear.com"
        "https://rpc.testnet.near.org"
        "https://testnet.near.org"
    )
    
    for endpoint in "${RPC_ENDPOINTS[@]}"; do
        print_status "Testing RPC endpoint: $endpoint"
        if curl -s --max-time 5 "$endpoint" >/dev/null 2>&1; then
            export NEAR_RPC_URL="$endpoint"
            print_success "Using RPC endpoint: $endpoint"
            break
        else
            print_warning "RPC endpoint $endpoint is not responding"
        fi
    done
    
    if [ -z "$NEAR_RPC_URL" ]; then
        print_error "No working RPC endpoint found. Using fallback."
        export NEAR_RPC_URL="https://testnet.near.fastnear.com"
    fi
    
    print_status "NEAR environment variables set:"
    print_status "  NEAR_ENV=$NEAR_ENV"
    print_status "  NEAR_RPC_URL=$NEAR_RPC_URL"
    
    print_success "NEAR environment setup completed"
}

# Function to create NEAR configuration file
create_near_config() {
    print_status "Creating NEAR configuration..."
    
    # Create .near directory if it doesn't exist
    mkdir -p ~/.near
    
    # Create config.json with better settings
    cat > ~/.near/config.json << EOF
{
  "networkId": "testnet",
  "nodeUrl": "$NEAR_RPC_URL",
  "walletUrl": "https://testnet.mynearwallet.com",
  "helperUrl": "https://testnet.mynearwallet.com",
  "explorerUrl": "https://explorer.testnet.near.org",
  "contractName": "test.testnet"
}
EOF
    
    print_success "NEAR configuration created at ~/.near/config.json"
}

# Function to login to NEAR
login_to_near() {
    print_status "Logging in to NEAR..."
    
    # Check if already logged in
    if near list-keys 2>/dev/null | grep -q "ed25519:"; then
        print_success "Already logged in to NEAR"
        return 0
    fi
    
    print_status "Please follow the browser instructions to login..."
    print_status "If browser doesn't open automatically, visit the URL shown below"
    print_status "Note: You may need to wait a few seconds between attempts due to rate limits"
    
    # Try login with retry mechanism
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if near login; then
            print_success "Successfully logged in to NEAR"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                print_warning "Login attempt $retry_count failed. Waiting 10 seconds before retry..."
                sleep 10
            else
                print_error "Failed to login to NEAR after $max_retries attempts"
                print_status "Please try manually:"
                print_status "  near login"
                print_status "Or create an account manually at: https://testnet.mynearwallet.com/"
                exit 1
            fi
        fi
    done
}

# Function to create test account
create_test_account() {
    print_status "Creating test account..."
    
    local account_name=${1:-"uniteai-wallet"}
    local full_account_name="$account_name.testnet"
    
    print_status "Attempting to create account: $full_account_name"
    
    # Try to create account with retry mechanism
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if near create-account "$full_account_name" --masterAccount testnet --initialBalance 50; then
            print_success "Test account created: $full_account_name"
            print_status "You can now use this account for deployment:"
            print_status "  export OWNER_ACCOUNT=$full_account_name"
            print_status "  npm run near:deploy"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                print_warning "Account creation attempt $retry_count failed. Waiting 15 seconds before retry..."
                sleep 15
            else
                print_warning "Failed to create account automatically after $max_retries attempts."
                break
            fi
        fi
    done
    
    print_status ""
    print_status "=== MANUAL ACCOUNT CREATION REQUIRED ==="
    print_status ""
    print_status "Please create an account manually:"
    print_status "1. Visit: https://testnet.mynearwallet.com/"
    print_status "2. Create a new account (e.g., $full_account_name)"
    print_status "3. Set environment variable:"
    print_status "   export OWNER_ACCOUNT=$full_account_name"
    print_status "4. Run deployment:"
    print_status "   npm run near:deploy"
    print_status ""
    print_status "Or use an existing account:"
    print_status "   export OWNER_ACCOUNT=your-existing-account.testnet"
    print_status "   npm run near:deploy"
}

# Function to check account balance
check_account_balance() {
    local account_name=${1:-"$OWNER_ACCOUNT"}
    
    if [ -z "$account_name" ]; then
        print_error "No account specified. Please set OWNER_ACCOUNT environment variable."
        return 1
    fi
    
    print_status "Checking balance for account: $account_name"
    
    if near state "$account_name"; then
        print_success "Account balance checked successfully"
    else
        print_error "Failed to check account balance"
        return 1
    fi
}

# Function to deploy contracts
deploy_contracts() {
    print_status "Deploying NEAR contracts..."
    
    if [ -z "$OWNER_ACCOUNT" ]; then
        print_error "OWNER_ACCOUNT environment variable not set"
        print_status "Please set it first:"
        print_status "  export OWNER_ACCOUNT=your-account.testnet"
        exit 1
    fi
    
    print_status "Deploying contracts to account: $OWNER_ACCOUNT"
    
    # Change to near-contracts directory and run deployment
    cd near-contracts && ./deploy.sh
}

# Function to display help
show_help() {
    echo "NEAR Setup Script for UniteAI Wallet"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup          Setup NEAR environment and login"
    echo "  create-account [NAME]  Create a test account (default: uniteai-wallet)"
    echo "  check-balance [ACCOUNT]  Check account balance"
    echo "  deploy         Deploy contracts (requires account setup)"
    echo "  full-setup     Complete setup: environment + login + account + deploy"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup                    # Setup NEAR environment and login"
    echo "  $0 create-account mywallet  # Create account 'mywallet.testnet'"
    echo "  $0 check-balance            # Check balance of OWNER_ACCOUNT"
    echo "  $0 deploy                   # Deploy contracts"
    echo "  $0 full-setup               # Complete setup process"
    echo ""
    echo "Environment Variables:"
    echo "  OWNER_ACCOUNT  NEAR account to use for deployment"
    echo "  NEAR_ENV       NEAR environment (default: testnet)"
    echo "  NEAR_RPC_URL   NEAR RPC URL (auto-detected)"
    echo ""
    echo "Troubleshooting:"
    echo "  If you encounter rate limit errors:"
    echo "  1. Wait 1-2 minutes between attempts"
    echo "  2. Try creating account manually at https://testnet.mynearwallet.com/"
    echo "  3. Use existing account with: export OWNER_ACCOUNT=your-account.testnet"
}

# Main function
main() {
    case "${1:-help}" in
        setup)
            check_prerequisites
            setup_near_environment
            create_near_config
            login_to_near
            print_success "NEAR setup completed successfully!"
            ;;
        create-account)
            check_prerequisites
            setup_near_environment
            create_near_config
            login_to_near
            create_test_account "$2"
            ;;
        check-balance)
            check_prerequisites
            setup_near_environment
            check_account_balance "$2"
            ;;
        deploy)
            check_prerequisites
            setup_near_environment
            deploy_contracts
            ;;
        full-setup)
            check_prerequisites
            setup_near_environment
            create_near_config
            login_to_near
            create_test_account "uniteai-wallet"
            if [ -n "$OWNER_ACCOUNT" ]; then
                deploy_contracts
            fi
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 