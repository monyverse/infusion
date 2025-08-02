#!/bin/bash

# Final NEAR Contract Deployment Script
# This script properly deploys contracts to separate subaccounts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK="testnet"
OWNER_ACCOUNT="${OWNER_ACCOUNT:-defiunite.testnet}"
ESCROW_CONTRACT="escrow.${OWNER_ACCOUNT#*.}"
SOLVER_CONTRACT="solver.${OWNER_ACCOUNT#*.}"
POOL_CONTRACT="pool.${OWNER_ACCOUNT#*.}"

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
    
    if ! command_exists cargo; then
        print_error "Cargo is not installed. Please install Rust first."
        exit 1
    fi
    
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

# Function to build contracts
build_contracts() {
    print_status "Building contracts..."
    
    cd "$(dirname "$0")"
    
    # Build all contracts using cargo near
    print_status "Building fusion-escrow contract..."
    cd fusion-escrow && cargo near build non-reproducible-wasm && cd ..
    
    print_status "Building fusion-pool contract..."
    cd fusion-pool && cargo near build non-reproducible-wasm && cd ..
    
    print_status "Building fusion-solver contract..."
    cd fusion-solver && cargo near build non-reproducible-wasm && cd ..
    
    print_success "Contracts built successfully"
}

# Function to create subaccounts
create_subaccounts() {
    print_status "Creating subaccounts for contracts..."
    
    # Create escrow subaccount
    print_status "Creating escrow subaccount: $ESCROW_CONTRACT"
    if near create-account "$ESCROW_CONTRACT" --masterAccount "$OWNER_ACCOUNT" --initialBalance 10; then
        print_success "Created escrow subaccount: $ESCROW_CONTRACT"
    else
        print_warning "Escrow subaccount already exists or creation failed"
    fi
    
    # Create solver subaccount
    print_status "Creating solver subaccount: $SOLVER_CONTRACT"
    if near create-account "$SOLVER_CONTRACT" --masterAccount "$OWNER_ACCOUNT" --initialBalance 10; then
        print_success "Created solver subaccount: $SOLVER_CONTRACT"
    else
        print_warning "Solver subaccount already exists or creation failed"
    fi
    
    # Create pool subaccount
    print_status "Creating pool subaccount: $POOL_CONTRACT"
    if near create-account "$POOL_CONTRACT" --masterAccount "$OWNER_ACCOUNT" --initialBalance 10; then
        print_success "Created pool subaccount: $POOL_CONTRACT"
    else
        print_warning "Pool subaccount already exists or creation failed"
    fi
}

# Function to deploy escrow contract
deploy_escrow() {
    print_status "Deploying Fusion Escrow contract to $ESCROW_CONTRACT..."
    
    if [ -f "target/near/fusion_escrow/fusion_escrow.wasm" ]; then
        near deploy "$ESCROW_CONTRACT" target/near/fusion_escrow/fusion_escrow.wasm \
            --initFunction new \
            --initArgs "{\"owner\": \"$OWNER_ACCOUNT\"}" \
            --networkId testnet
        
        print_success "Escrow contract deployed to: $ESCROW_CONTRACT"
    else
        print_error "Contract WASM file not found. Please build contracts first."
        exit 1
    fi
}

# Function to deploy solver contract
deploy_solver() {
    print_status "Deploying Fusion Solver contract to $SOLVER_CONTRACT..."
    
    if [ -f "target/near/fusion_solver/fusion_solver.wasm" ]; then
        near deploy "$SOLVER_CONTRACT" target/near/fusion_solver/fusion_solver.wasm \
            --initFunction new \
            --initArgs "{\"owner\": \"$OWNER_ACCOUNT\", \"escrow_contract\": \"$ESCROW_CONTRACT\"}" \
            --networkId testnet
        
        print_success "Solver contract deployed to: $SOLVER_CONTRACT"
    else
        print_error "Contract WASM file not found. Please build contracts first."
        exit 1
    fi
}

# Function to deploy pool contract
deploy_pool() {
    print_status "Deploying Fusion Pool contract to $POOL_CONTRACT..."
    
    if [ -f "target/near/fusion_pool/fusion_pool.wasm" ]; then
        near deploy "$POOL_CONTRACT" target/near/fusion_pool/fusion_pool.wasm \
            --initFunction new \
            --initArgs "{\"owner\": \"$OWNER_ACCOUNT\", \"solver_contract\": \"$SOLVER_CONTRACT\"}" \
            --networkId testnet
        
        print_success "Pool contract deployed to: $POOL_CONTRACT"
    else
        print_error "Contract WASM file not found. Please build contracts first."
        exit 1
    fi
}

# Function to test contracts
test_contracts() {
    print_status "Testing contracts..."
    
    # Test escrow contract
    print_status "Testing escrow contract..."
    if near view "$ESCROW_CONTRACT" get_statistics; then
        print_success "Escrow contract test passed"
    else
        print_warning "Escrow contract test failed"
    fi
    
    # Test solver contract
    print_status "Testing solver contract..."
    if near view "$SOLVER_CONTRACT" get_statistics; then
        print_success "Solver contract test passed"
    else
        print_warning "Solver contract test failed"
    fi
    
    # Test pool contract
    print_status "Testing pool contract..."
    if near view "$POOL_CONTRACT" get_statistics; then
        print_success "Pool contract test passed"
    else
        print_warning "Pool contract test failed"
    fi
    
    print_success "Contract tests completed"
}

# Function to save deployment info
save_deployment_info() {
    print_status "Saving deployment information..."
    
    cat > deployment-info.json << EOF
{
    "network": "$NETWORK",
    "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "contracts": {
        "owner_account": "$OWNER_ACCOUNT",
        "escrow_contract": "$ESCROW_CONTRACT",
        "solver_contract": "$SOLVER_CONTRACT",
        "pool_contract": "$POOL_CONTRACT"
    },
    "explorer_urls": {
        "owner_account": "https://explorer.testnet.near.org/accounts/$OWNER_ACCOUNT",
        "escrow_contract": "https://explorer.testnet.near.org/accounts/$ESCROW_CONTRACT",
        "solver_contract": "https://explorer.testnet.near.org/accounts/$SOLVER_CONTRACT",
        "pool_contract": "https://explorer.testnet.near.org/accounts/$POOL_CONTRACT"
    }
}
EOF
    
    print_success "Deployment information saved to deployment-info.json"
}

# Function to display deployment summary
display_summary() {
    print_success "Deployment completed successfully!"
    echo
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Network: $NETWORK"
    echo "Owner Account: $OWNER_ACCOUNT"
    echo "Escrow Contract: $ESCROW_CONTRACT"
    echo "Solver Contract: $SOLVER_CONTRACT"
    echo "Pool Contract: $POOL_CONTRACT"
    echo
    echo "=== EXPLORER LINKS ==="
    echo "Owner Account: https://explorer.testnet.near.org/accounts/$OWNER_ACCOUNT"
    echo "Escrow Contract: https://explorer.testnet.near.org/accounts/$ESCROW_CONTRACT"
    echo "Solver Contract: https://explorer.testnet.near.org/accounts/$SOLVER_CONTRACT"
    echo "Pool Contract: https://explorer.testnet.near.org/accounts/$POOL_CONTRACT"
    echo
    echo "=== NEXT STEPS ==="
    echo "1. Fund the owner account with NEAR tokens"
    echo "2. Register solvers in the solver contract"
    echo "3. Create liquidity pools in the pool contract"
    echo "4. Test cross-chain swap functionality"
    echo
}

# Main deployment function
main() {
    print_status "Starting final NEAR Fusion+ contract deployment..."
    
    check_prerequisites
    build_contracts
    create_subaccounts
    deploy_escrow
    deploy_solver
    deploy_pool
    test_contracts
    save_deployment_info
    display_summary
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --build-only   Only build contracts, don't deploy"
        echo "  --test-only    Only run tests"
        echo
        echo "Environment Variables:"
        echo "  OWNER_ACCOUNT  Account to use as owner (default: defiunite.testnet)"
        echo
        exit 0
        ;;
    --build-only)
        print_status "Building contracts only..."
        check_prerequisites
        build_contracts
        print_success "Build completed"
        exit 0
        ;;
    --test-only)
        print_status "Running tests only..."
        check_prerequisites
        test_contracts
        print_success "Tests completed"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 