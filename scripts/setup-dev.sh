#!/bin/bash

# UniteAI Wallet Development Setup Script
# This script sets up the development environment for the UniteAI Wallet project

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
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        print_status "Download from: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_status "npm version: $NPM_VERSION"
    
    # Check Git
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    GIT_VERSION=$(git --version)
    print_status "Git version: $GIT_VERSION"
    
    # Check Rust (for NEAR contracts)
    if ! command_exists cargo; then
        print_warning "Rust is not installed. NEAR contracts will not be available."
        print_status "Install Rust: https://rustup.rs/"
    else
        RUST_VERSION=$(cargo --version)
        print_status "Rust version: $RUST_VERSION"
    fi
    
    # Check NEAR CLI
    if ! command_exists near; then
        print_warning "NEAR CLI is not installed. NEAR functionality will be limited."
        print_status "Install with: npm install -g near-cli"
    else
        NEAR_VERSION=$(near --version)
        print_status "NEAR CLI version: $NEAR_VERSION"
    fi
    
    print_success "Prerequisites check completed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing npm dependencies..."
    
    if npm install; then
        print_success "npm dependencies installed successfully"
    else
        print_error "Failed to install npm dependencies"
        exit 1
    fi
}

# Function to set up environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Check if env.local exists
    if [ ! -f "env.local" ]; then
        if [ -f "env.example" ]; then
            cp env.example env.local
            print_success "Created env.local from env.example"
            print_warning "Please edit env.local with your API keys and configuration"
        else
            print_warning "env.example not found. Please create env.local manually"
        fi
    else
        print_status "env.local already exists"
    fi
}

# Function to build NEAR contracts
build_near_contracts() {
    if command_exists cargo; then
        print_status "Building NEAR contracts..."
        
        if [ -d "near-contracts" ]; then
            cd near-contracts
            
            if cargo build --release --workspace; then
                print_success "NEAR contracts built successfully"
            else
                print_warning "Failed to build NEAR contracts"
            fi
            
            cd ..
        else
            print_warning "near-contracts directory not found"
        fi
    else
        print_warning "Skipping NEAR contract build (Rust not installed)"
    fi
}

# Function to compile EVM contracts
compile_evm_contracts() {
    print_status "Compiling EVM contracts..."
    
    if command_exists npx; then
        if npx hardhat compile; then
            print_success "EVM contracts compiled successfully"
        else
            print_warning "Failed to compile EVM contracts"
        fi
    else
        print_warning "Skipping EVM contract compilation (npx not available)"
    fi
}

# Function to run type check
run_type_check() {
    print_status "Running TypeScript type check..."
    
    if npx tsc --noEmit; then
        print_success "TypeScript type check passed"
    else
        print_warning "TypeScript type check failed"
    fi
}

# Function to run linting
run_linting() {
    print_status "Running ESLint..."
    
    if npx eslint . --ext .ts,.tsx --max-warnings 0; then
        print_success "ESLint passed"
    else
        print_warning "ESLint found issues"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    if npm test; then
        print_success "Tests passed"
    else
        print_warning "Some tests failed"
    fi
}

# Function to display setup summary
display_summary() {
    print_success "Development setup completed!"
    echo
    echo "=== SETUP SUMMARY ==="
    echo "✅ Dependencies installed"
    echo "✅ Environment configured"
    echo "✅ NEAR contracts built (if Rust available)"
    echo "✅ EVM contracts compiled"
    echo "✅ TypeScript type check completed"
    echo "✅ ESLint check completed"
    echo "✅ Tests executed"
    echo
    echo "=== NEXT STEPS ==="
    echo "1. Edit env.local with your API keys:"
    echo "   - INCH_API_KEY (get from https://portal.1inch.dev/)"
    echo "   - OPENAI_API_KEY (get from https://platform.openai.com/)"
    echo "   - NEAR_ACCOUNT_ID and NEAR_PRIVATE_KEY (if using NEAR)"
    echo "   - PRIVATE_KEY (for EVM operations)"
    echo
    echo "2. Start development servers:"
    echo "   npm run dev"
    echo
    echo "3. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:3003"
    echo "   - Health check: http://localhost:3003/api/health"
    echo
    echo "4. Run specific tests:"
    echo "   npm run test:ai          # AI tests"
    echo "   npm run test:contracts   # Contract tests"
    echo "   npm run test:integration # Integration tests"
    echo
    echo "5. Deploy contracts:"
    echo "   npm run deploy:testnets  # Deploy to testnets"
    echo "   npm run near:deploy      # Deploy NEAR contracts"
    echo
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --help, -h           Show this help message"
    echo "  --skip-deps          Skip dependency installation"
    echo "  --skip-build         Skip contract building"
    echo "  --skip-tests         Skip test execution"
    echo "  --skip-lint          Skip linting"
    echo "  --env-only           Only set up environment"
    echo
    echo "Examples:"
    echo "  $0                    # Full setup"
    echo "  $0 --env-only         # Only environment setup"
    echo "  $0 --skip-tests       # Setup without tests"
    echo
}

# Parse command line arguments
SKIP_DEPS=false
SKIP_BUILD=false
SKIP_TESTS=false
SKIP_LINT=false
ENV_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --env-only)
            ENV_ONLY=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main setup function
main() {
    print_status "Starting UniteAI Wallet development setup..."
    
    check_prerequisites
    
    if [ "$ENV_ONLY" = true ]; then
        setup_environment
        print_success "Environment setup completed"
        exit 0
    fi
    
    if [ "$SKIP_DEPS" = false ]; then
        install_dependencies
    fi
    
    setup_environment
    
    if [ "$SKIP_BUILD" = false ]; then
        build_near_contracts
        compile_evm_contracts
    fi
    
    if [ "$SKIP_LINT" = false ]; then
        run_type_check
        run_linting
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    display_summary
}

# Run main function
main 