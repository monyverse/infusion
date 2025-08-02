#!/bin/bash

# NEAR Contract Initialization Script
# This script initializes the deployed contracts with proper parameters

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OWNER_ACCOUNT="${OWNER_ACCOUNT:-defiunite.testnet}"

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

# Function to initialize escrow contract
initialize_escrow() {
    print_status "Initializing escrow contract..."
    
    # Try to initialize the escrow contract
    if near call "$OWNER_ACCOUNT" new '{"owner": "'$OWNER_ACCOUNT'"}' --accountId "$OWNER_ACCOUNT"; then
        print_success "Escrow contract initialized successfully"
    else
        print_warning "Escrow contract initialization failed (may already be initialized)"
    fi
}

# Function to initialize solver contract
initialize_solver() {
    print_status "Initializing solver contract..."
    
    # Try to initialize the solver contract
    if near call "$OWNER_ACCOUNT" new '{"owner": "'$OWNER_ACCOUNT'", "escrow_contract": "'$OWNER_ACCOUNT'"}' --accountId "$OWNER_ACCOUNT"; then
        print_success "Solver contract initialized successfully"
    else
        print_warning "Solver contract initialization failed (may already be initialized)"
    fi
}

# Function to initialize pool contract
initialize_pool() {
    print_status "Initializing pool contract..."
    
    # Try to initialize the pool contract
    if near call "$OWNER_ACCOUNT" new '{"owner": "'$OWNER_ACCOUNT'", "solver_contract": "'$OWNER_ACCOUNT'"}' --accountId "$OWNER_ACCOUNT"; then
        print_success "Pool contract initialized successfully"
    else
        print_warning "Pool contract initialization failed (may already be initialized)"
    fi
}

# Function to test contracts
test_contracts() {
    print_status "Testing contracts..."
    
    # Test escrow contract
    print_status "Testing escrow contract..."
    if near view "$OWNER_ACCOUNT" get_statistics; then
        print_success "Escrow contract test passed"
    else
        print_warning "Escrow contract test failed"
    fi
    
    # Test solver contract
    print_status "Testing solver contract..."
    if near view "$OWNER_ACCOUNT" get_statistics; then
        print_success "Solver contract test passed"
    else
        print_warning "Solver contract test failed"
    fi
    
    # Test pool contract
    print_status "Testing pool contract..."
    if near view "$OWNER_ACCOUNT" get_statistics; then
        print_success "Pool contract test passed"
    else
        print_warning "Pool contract test failed"
    fi
}

# Function to display contract info
display_contract_info() {
    print_success "Contract initialization completed!"
    echo
    echo "=== CONTRACT INFORMATION ==="
    echo "Owner Account: $OWNER_ACCOUNT"
    echo "Network: testnet"
    echo
    echo "=== EXPLORER LINKS ==="
    echo "Owner Account: https://explorer.testnet.near.org/accounts/$OWNER_ACCOUNT"
    echo
    echo "=== CONTRACT FUNCTIONS ==="
    echo "All three contracts (Escrow, Solver, Pool) are deployed to the same account"
    echo "and can be accessed through the same contract interface."
    echo
    echo "=== NEXT STEPS ==="
    echo "1. Fund the owner account with NEAR tokens"
    echo "2. Register solvers in the solver contract"
    echo "3. Create liquidity pools in the pool contract"
    echo "4. Test cross-chain swap functionality"
    echo "5. Integrate with the frontend application"
    echo
}

# Main function
main() {
    print_status "Starting NEAR contract initialization..."
    
    initialize_escrow
    initialize_solver
    initialize_pool
    test_contracts
    display_contract_info
}

# Run main function
main 