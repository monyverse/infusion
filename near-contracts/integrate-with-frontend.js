const { connect, keyStores, KeyPair } = require('near-api-js');
const fs = require('fs');
const path = require('path');

class NEARContractIntegration {
    constructor(config) {
        this.config = config;
        this.near = null;
        this.account = null;
        this.contracts = {};
    }

    async initialize() {
        console.log('🔗 Initializing NEAR connection...');
        
        // Load deployment info
        const deploymentInfo = this.loadDeploymentInfo();
        if (!deploymentInfo) {
            throw new Error('Deployment info not found. Please run deploy.sh first.');
        }

        // Setup NEAR connection
        const keyStore = new keyStores.InMemoryKeyStore();
        
        // Add key if provided
        if (this.config.privateKey) {
            const keyPair = KeyPair.fromString(this.config.privateKey);
            await keyStore.setKey(this.config.networkId, this.config.accountId, keyPair);
        }

        const nearConfig = {
            networkId: this.config.networkId,
            nodeUrl: this.config.nodeUrl,
            keyStore,
            headers: {},
            walletUrl: this.config.walletUrl,
            helperUrl: this.config.helperUrl,
            explorerUrl: this.config.explorerUrl,
        };

        this.near = await connect(nearConfig);
        this.account = await this.near.account(this.config.accountId);
        
        // Initialize contract instances
        this.contracts = {
            escrow: deploymentInfo.contracts.escrow_contract,
            solver: deploymentInfo.contracts.solver_contract,
            pool: deploymentInfo.contracts.pool_contract
        };

        console.log('✅ NEAR connection initialized');
        console.log(`📋 Account: ${this.config.accountId}`);
        console.log(`🔗 Network: ${this.config.networkId}`);
    }

    loadDeploymentInfo() {
        try {
            const deploymentPath = path.join(__dirname, 'deployment-info.json');
            if (!fs.existsSync(deploymentPath)) {
                return null;
            }
            return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        } catch (error) {
            console.error('Error loading deployment info:', error);
            return null;
        }
    }

    // Escrow Contract Methods
    async createEscrowOrder(params) {
        console.log('📝 Creating escrow order...');
        
        const result = await this.account.functionCall({
            contractId: this.contracts.escrow,
            methodName: 'create_order',
            args: {
                taker: params.taker,
                from_token: params.fromToken,
                to_token: params.toToken,
                from_amount: params.fromAmount,
                to_amount: params.toAmount,
                hashlock: params.hashlock,
                timelock: params.timelock
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Escrow order created');
        return result;
    }

    async fundEscrowOrder(orderId) {
        console.log(`💰 Funding escrow order: ${orderId}`);
        
        const result = await this.account.functionCall({
            contractId: this.contracts.escrow,
            methodName: 'fund_order',
            args: { order_id: orderId },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Escrow order funded');
        return result;
    }

    async claimEscrowOrder(orderId, secret) {
        console.log(`🔓 Claiming escrow order: ${orderId}`);
        
        const result = await this.account.functionCall({
            contractId: this.contracts.escrow,
            methodName: 'claim_order',
            args: { 
                order_id: orderId,
                secret: secret
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Escrow order claimed');
        return result;
    }

    async getEscrowOrder(orderId) {
        const result = await this.account.viewFunction({
            contractId: this.contracts.escrow,
            methodName: 'get_order',
            args: { order_id: orderId }
        });
        return result;
    }

    // Solver Contract Methods
    async registerSolver(params) {
        console.log('🤖 Registering solver...');
        
        const result = await this.account.functionCall({
            contractId: this.contracts.solver,
            methodName: 'register_solver',
            args: {
                name: params.name,
                description: params.description,
                version: params.version,
                code_hash: params.codeHash
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Solver registered');
        return result;
    }

    async createSolverPool(params) {
        console.log('🏊 Creating solver pool...');
        
        const result = await this.account.functionCall({
            contractId: this.contracts.solver,
            methodName: 'create_pool',
            args: {
                pool_id: params.poolId,
                fee_rate: params.feeRate,
                min_order_size: params.minOrderSize,
                max_order_size: params.maxOrderSize
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Solver pool created');
        return result;
    }

    async requestQuote(params) {
        console.log('💬 Requesting quote...');
        
        const result = await this.account.functionCall({
            contractId: this.contracts.solver,
            methodName: 'request_quote',
            args: {
                from_token: params.fromToken,
                to_token: params.toToken,
                amount: params.amount,
                deadline: params.deadline
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Quote requested');
        return result;
    }

    async createFusionOrder(params) {
        console.log('🔥 Creating Fusion order...');
        
        const result = await this.account.functionCall({
            contractId: this.contracts.solver,
            methodName: 'create_order',
            args: {
                quote_id: params.quoteId,
                from_token: params.fromToken,
                to_token: params.toToken,
                from_amount: params.fromAmount,
                to_amount: params.toAmount,
                min_to_amount: params.minToAmount,
                deadline: params.deadline,
                solver: params.solver
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Fusion order created');
        return result;
    }

    // Pool Contract Methods
    async createLiquidityPool(params) {
        console.log('🏊 Creating liquidity pool...');
        
        const result = await this.account.functionCall({
            contractId: this.contracts.pool,
            methodName: 'create_pool',
            args: {
                pool_id: params.poolId,
                name: params.name,
                description: params.description,
                token: params.token,
                fee_rate: params.feeRate,
                min_deposit: params.minDeposit,
                max_deposit: params.maxDeposit
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Liquidity pool created');
        return result;
    }

    async depositLiquidity(poolId, amount) {
        console.log(`💰 Depositing liquidity to pool: ${poolId}`);
        
        const result = await this.account.functionCall({
            contractId: this.contracts.pool,
            methodName: 'deposit_liquidity',
            args: { pool_id: poolId },
            gas: '300000000000000',
            attachedDeposit: amount
        });

        console.log('✅ Liquidity deposited');
        return result;
    }

    async withdrawLiquidity(poolId, shares) {
        console.log(`💸 Withdrawing liquidity from pool: ${poolId}`);
        
        const result = await this.account.functionCall({
            contractId: this.contracts.pool,
            methodName: 'withdraw_liquidity',
            args: { 
                pool_id: poolId,
                shares: shares
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Liquidity withdrawn');
        return result;
    }

    async claimRewards(poolId) {
        console.log(`🏆 Claiming rewards from pool: ${poolId}`);
        
        const result = await this.account.functionCall({
            contractId: this.contracts.pool,
            methodName: 'claim_rewards',
            args: { pool_id: poolId },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Rewards claimed');
        return result;
    }

    // View Methods
    async getPoolInfo(poolId) {
        const result = await this.account.viewFunction({
            contractId: this.contracts.pool,
            methodName: 'get_pool',
            args: { pool_id: poolId }
        });
        return result;
    }

    async getSolverInfo(solverId) {
        const result = await this.account.viewFunction({
            contractId: this.contracts.solver,
            methodName: 'get_solver',
            args: { solver_id: solverId }
        });
        return result;
    }

    async getAccountBalance() {
        const balance = await this.account.getAccountBalance();
        return balance;
    }

    // Cross-chain swap methods
    async createCrossChainSwap(params) {
        console.log('🌐 Creating cross-chain swap...');
        
        const result = await this.account.functionCall({
            contractId: this.contracts.escrow,
            methodName: 'create_cross_chain_swap',
            args: {
                evm_order_hash: params.evmOrderHash,
                evm_address: params.evmAddress,
                from_chain: params.fromChain,
                to_chain: params.toChain,
                from_token: params.fromToken,
                to_token: params.toToken,
                from_amount: params.fromAmount,
                to_amount: params.toAmount,
                hashlock: params.hashlock,
                timelock: params.timelock
            },
            gas: '300000000000000',
            attachedDeposit: '1'
        });

        console.log('✅ Cross-chain swap created');
        return result;
    }

    async getCrossChainSwap(swapId) {
        const result = await this.account.viewFunction({
            contractId: this.contracts.escrow,
            methodName: 'get_swap',
            args: { swap_id: swapId }
        });
        return result;
    }

    // Utility methods
    async generateSecretAndHashlock() {
        const crypto = require('crypto');
        const secret = crypto.randomBytes(32).toString('hex');
        const hashlock = crypto.createHash('sha256').update(secret).digest('hex');
        
        return { secret, hashlock };
    }

    async getQuote(fromToken, toToken, amount) {
        console.log('💬 Getting quote...');
        
        const result = await this.account.viewFunction({
            contractId: this.contracts.escrow,
            methodName: 'get_quote',
            args: {
                from_token: fromToken,
                to_token: toToken,
                from_amount: amount
            }
        });
        
        console.log('✅ Quote received');
        return result;
    }

    // Test methods
    async runIntegrationTests() {
        console.log('🧪 Running integration tests...');
        
        try {
            // Test 1: Get account balance
            const balance = await this.getAccountBalance();
            console.log(`💰 Account balance: ${balance.total} yoctoNEAR`);

            // Test 2: Get quote
            const quote = await this.getQuote(
                'testnet',
                'usdc.fakes.testnet',
                '1000000000000000000000000' // 1 NEAR
            );
            console.log('📊 Quote received:', quote);

            // Test 3: Generate secret and hashlock
            const { secret, hashlock } = await this.generateSecretAndHashlock();
            console.log('🔐 Generated secret and hashlock');

            // Test 4: Create escrow order
            const orderResult = await this.createEscrowOrder({
                taker: this.config.accountId,
                fromToken: 'testnet',
                toToken: 'usdc.fakes.testnet',
                fromAmount: '1000000000000000000000000',
                toAmount: '980000000000000000000000',
                hashlock: hashlock,
                timelock: 3600
            });
            console.log('📝 Escrow order created');

            console.log('✅ All integration tests passed!');
            return true;
        } catch (error) {
            console.error('❌ Integration test failed:', error);
            return false;
        }
    }
}

// Export for use in other modules
module.exports = NEARContractIntegration;

// Example usage
if (require.main === module) {
    (async () => {
        const config = {
            networkId: 'testnet',
            nodeUrl: 'https://rpc.testnet.near.org',
            walletUrl: 'https://wallet.testnet.near.org',
            helperUrl: 'https://helper.testnet.near.org',
            explorerUrl: 'https://explorer.testnet.near.org',
            accountId: process.env.NEAR_ACCOUNT_ID,
            privateKey: process.env.NEAR_PRIVATE_KEY
        };

        const integration = new NEARContractIntegration(config);
        
        try {
            await integration.initialize();
            await integration.runIntegrationTests();
        } catch (error) {
            console.error('Integration failed:', error);
            process.exit(1);
        }
    })();
} 