use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, StorageKey};
use near_sdk::json_types::{U128, U64};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, ext_contract, near_bindgen, AccountId, Gas, PanicOnDefault, Promise, PromiseOrValue,
    NearToken,
};
use near_contract_standards::fungible_token::Balance;
use near_contract_standards::fungible_token::core::ext_ft_core;
use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;

// Gas constants
const GAS_FOR_SOLVE: Gas = Gas::from_tgas(50);
const GAS_FOR_QUOTE: Gas = Gas::from_tgas(20);
const GAS_FOR_VERIFY: Gas = Gas::from_tgas(10);

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Solver {
    pub account_id: AccountId,
    pub name: String,
    pub description: String,
    pub version: String,
    pub code_hash: String,
    pub is_active: bool,
    pub total_solves: u64,
    pub success_rate: f64,
    pub total_volume: U128,
    pub total_fees: U128,
    pub registered_at: U64,
    pub last_active: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct SolverPool {
    pub id: String,
    pub solver: AccountId,
    pub liquidity_providers: Vec<AccountId>,
    pub total_liquidity: U128,
    pub available_liquidity: U128,
    pub fee_rate: u32, // Basis points
    pub min_order_size: U128,
    pub max_order_size: U128,
    pub is_active: bool,
    pub created_at: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct FusionOrder {
    pub id: String,
    pub user: AccountId,
    pub from_token: AccountId,
    pub to_token: AccountId,
    pub from_amount: U128,
    pub to_amount: U128,
    pub min_to_amount: U128,
    pub deadline: U64,
    pub solver: Option<AccountId>,
    pub status: OrderStatus,
    pub created_at: U64,
    pub filled_at: Option<U64>,
    pub tx_hash: Option<String>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(crate = "near_sdk::serde")]
pub enum OrderStatus {
    Pending,
    Filled,
    Cancelled,
    Expired,
    Failed,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ChainSignature {
    pub signature: String,
    pub public_key: String,
    pub message: String,
    pub timestamp: U64,
    pub solver: AccountId,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct QuoteRequest {
    pub from_token: AccountId,
    pub to_token: AccountId,
    pub amount: U128,
    pub user: AccountId,
    pub deadline: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct QuoteResponse {
    pub quote_id: String,
    pub from_token: AccountId,
    pub to_token: AccountId,
    pub from_amount: U128,
    pub to_amount: U128,
    pub price: String,
    pub gas_estimate: U128,
    pub solver: AccountId,
    pub pool_id: String,
    pub fee: U128,
    pub valid_until: U64,
}

// External contract interface for escrow contract
#[ext_contract(ext_escrow)]
pub trait ExtEscrow {
    fn create_order(
        &mut self,
        taker: AccountId,
        from_token: AccountId,
        to_token: AccountId,
        from_amount: U128,
        to_amount: U128,
        hashlock: String,
        timelock: U64,
    ) -> String;
    
    fn fund_order(&mut self, order_id: String) -> Promise;
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct FusionSolver {
    pub owner: AccountId,
    pub escrow_contract: AccountId,
    
    // Solvers registry
    pub solvers: UnorderedMap<AccountId, Solver>,
    pub active_solvers: UnorderedMap<AccountId, AccountId>,
    
    // Pools
    pub pools: UnorderedMap<String, SolverPool>,
    pub solver_pools: LookupMap<AccountId, Vec<String>>,
    
    // Orders
    pub orders: UnorderedMap<String, FusionOrder>,
    pub user_orders: LookupMap<AccountId, Vec<String>>,
    pub pending_orders: UnorderedMap<String, QuoteRequest>,
    
    // Chain signatures
    pub signatures: UnorderedMap<String, ChainSignature>,
    
    // Statistics
    pub total_orders: u64,
    pub total_volume: U128,
    pub total_fees: U128,
    
    // Configuration
    pub min_solver_stake: U128,
    pub max_solver_fee: u32, // Basis points
    pub quote_timeout: U64,
}

#[near_bindgen]
impl FusionSolver {
    #[init]
    pub fn new(owner: AccountId, escrow_contract: AccountId) -> Self {
        Self {
            owner,
            escrow_contract,
            solvers: UnorderedMap::new(b"s"),
            active_solvers: UnorderedMap::new(b"a"),
            pools: UnorderedMap::new(b"p"),
            solver_pools: LookupMap::new(StorageKey::new(b"sp")),
            orders: UnorderedMap::new(b"o"),
            user_orders: LookupMap::new(b"u"),
            pending_orders: UnorderedMap::new(StorageKey::new(b"po")),
            signatures: UnorderedMap::new(StorageKey::new(b"sig")),
            total_orders: 0,
            total_volume: U128(0),
            total_fees: U128(0),
            min_solver_stake: U128(100_000_000_000_000_000_000_000), // 100 NEAR
            max_solver_fee: 500, // 5%
            quote_timeout: U64(300_000_000_000), // 5 minutes in nanoseconds
        }
    }

    // Register a new solver
    pub fn register_solver(
        &mut self,
        name: String,
        description: String,
        version: String,
        code_hash: String,
    ) -> bool {
        let solver_id = env::predecessor_account_id();
        
        // Check if solver already exists
        if self.solvers.get(&solver_id).is_some() {
            return false;
        }

        let solver = Solver {
            account_id: solver_id.clone(),
            name,
            description,
            version,
            code_hash,
            is_active: true,
            total_solves: 0,
            success_rate: 0.0,
            total_volume: U128(0),
            total_fees: U128(0),
            registered_at: U64(env::block_timestamp()),
            last_active: U64(env::block_timestamp()),
        };

        self.solvers.insert(&solver_id, &solver);
        self.active_solvers.insert(&solver_id, &solver_id);
        
        true
    }

    // Create a solver pool
    pub fn create_pool(
        &mut self,
        pool_id: String,
        fee_rate: u32,
        min_order_size: U128,
        max_order_size: U128,
    ) -> bool {
        let solver_id = env::predecessor_account_id();
        
        // Verify solver is registered and active
        let solver = self.solvers.get(&solver_id).expect("Solver not found");
        assert!(solver.is_active, "Solver is not active");
        assert!(fee_rate <= self.max_solver_fee, "Fee rate too high");

        let pool = SolverPool {
            id: pool_id.clone(),
            solver: solver_id.clone(),
            liquidity_providers: vec![],
            total_liquidity: U128(0),
            available_liquidity: U128(0),
            fee_rate,
            min_order_size,
            max_order_size,
            is_active: true,
            created_at: U64(env::block_timestamp()),
        };

        self.pools.insert(&pool_id, &pool);
        
        // Add to solver's pools
        let mut solver_pools = self.solver_pools.get(&solver_id).unwrap_or_default();
        solver_pools.push(pool_id);
        self.solver_pools.insert(&solver_id, &solver_pools);
        
        true
    }

    // Add liquidity to a pool
    pub fn add_liquidity(&mut self, pool_id: String) -> Promise {
        let provider = env::predecessor_account_id();
        let attached_deposit = env::attached_deposit();
        
        assert!(attached_deposit >= NearToken::from_yoctonear(self.min_solver_stake.0), "Insufficient stake");
        
        let mut pool = self.pools.get(&pool_id).expect("Pool not found");
        assert!(pool.is_active, "Pool is not active");
        
        // Add provider to liquidity providers if not already present
        if !pool.liquidity_providers.contains(&provider) {
            pool.liquidity_providers.push(provider.clone());
        }
        
        pool.total_liquidity = U128(pool.total_liquidity.0 + attached_deposit.as_yoctonear());
        pool.available_liquidity = U128(pool.available_liquidity.0 + attached_deposit.as_yoctonear());
        
        self.pools.insert(&pool_id, &pool);
        
        // Return success promise
        Promise::new(env::current_account_id()).transfer(NearToken::from_yoctonear(0))
    }

    // Request a quote
    pub fn request_quote(
        &mut self,
        from_token: AccountId,
        to_token: AccountId,
        amount: U128,
        deadline: U64,
    ) -> String {
        let user = env::predecessor_account_id();
        let quote_id = format!("quote_{}_{}", user, env::block_timestamp());
        
        let request = QuoteRequest {
            from_token,
            to_token,
            amount,
            user,
            deadline,
        };
        
        self.pending_orders.insert(&quote_id, &request);
        quote_id
    }

    // Provide a quote (called by solvers)
    pub fn provide_quote(
        &mut self,
        quote_id: String,
        to_amount: U128,
        price: String,
        gas_estimate: U128,
        pool_id: String,
        fee: U128,
        valid_until: U64,
    ) -> String {
        let solver_id = env::predecessor_account_id();
        
        // Verify solver is active
        let solver = self.solvers.get(&solver_id).expect("Solver not found");
        assert!(solver.is_active, "Solver is not active");
        
        // Verify pool exists and belongs to solver
        let pool = self.pools.get(&pool_id).expect("Pool not found");
        assert_eq!(pool.solver, solver_id, "Pool does not belong to solver");
        assert!(pool.is_active, "Pool is not active");
        
        // Verify quote request exists
        let request = self.pending_orders.get(&quote_id).expect("Quote request not found");
        assert!(env::block_timestamp() <= request.deadline.0, "Quote request expired");
        
        let response = QuoteResponse {
            quote_id: quote_id.clone(),
            from_token: request.from_token.clone(),
            to_token: request.to_token.clone(),
            from_amount: request.amount,
            to_amount,
            price,
            gas_estimate,
            solver: solver_id,
            pool_id,
            fee,
            valid_until,
        };
        
        // Remove pending order
        self.pending_orders.remove(&quote_id);
        
        serde_json::to_string(&response).unwrap_or_default()
    }

    // Create and execute a Fusion order
    pub fn create_order(
        &mut self,
        quote_id: String,
        from_token: AccountId,
        to_token: AccountId,
        from_amount: U128,
        to_amount: U128,
        min_to_amount: U128,
        deadline: U64,
        solver: AccountId,
    ) -> String {
        let user = env::predecessor_account_id();
        let order_id = format!("order_{}_{}", user, env::block_timestamp());
        
        let order = FusionOrder {
            id: order_id.clone(),
            user: user.clone(),
            from_token,
            to_token,
            from_amount,
            to_amount,
            min_to_amount,
            deadline,
            solver: Some(solver),
            status: OrderStatus::Pending,
            created_at: U64(env::block_timestamp()),
            filled_at: None,
            tx_hash: None,
        };
        
        self.orders.insert(&order_id, &order);
        
        // Add to user's orders
        let mut user_orders = self.user_orders.get(&user).unwrap_or_default();
        user_orders.push(order_id.clone());
        self.user_orders.insert(&user, &user_orders);
        
        self.total_orders += 1;
        
        order_id
    }

    // Execute order (called by solver)
    pub fn execute_order(&mut self, order_id: String, tx_hash: String) -> bool {
        let solver_id = env::predecessor_account_id();
        
        let mut order = self.orders.get(&order_id).expect("Order not found");
        assert_eq!(order.status, OrderStatus::Pending, "Order not pending");
        assert_eq!(order.solver, Some(solver_id.clone()), "Order not assigned to solver");
        assert!(env::block_timestamp() <= order.deadline.0, "Order expired");
        
        // Update order status
        order.status = OrderStatus::Filled;
        order.filled_at = Some(U64(env::block_timestamp()));
        order.tx_hash = Some(tx_hash);
        
        self.orders.insert(&order_id, &order);
        
        // Update solver statistics
        let mut solver = self.solvers.get(&solver_id).expect("Solver not found");
        solver.total_solves += 1;
        solver.total_volume = U128(solver.total_volume.0 + order.from_amount.0);
        solver.last_active = U64(env::block_timestamp());
        
        // Calculate success rate (simplified)
        if solver.total_solves > 0 {
            solver.success_rate = 0.95; // Mock success rate
        }
        
        self.solvers.insert(&solver_id, &solver);
        
        // Update global statistics
        self.total_volume = U128(self.total_volume.0 + order.from_amount.0);
        
        true
    }

    // Verify chain signature
    pub fn verify_signature(
        &mut self,
        signature: String,
        public_key: String,
        message: String,
        solver: AccountId,
    ) -> bool {
        // In a real implementation, this would verify the chain signature
        // using NEAR's Chain Signatures infrastructure
        
        let sig_id = format!("sig_{}_{}", solver, env::block_timestamp());
        let chain_sig = ChainSignature {
            signature,
            public_key,
            message,
            timestamp: U64(env::block_timestamp()),
            solver,
        };
        
        self.signatures.insert(&sig_id, &chain_sig);
        
        // For now, return true (mock verification)
        true
    }

    // View methods
    pub fn get_solver(&self, solver_id: AccountId) -> String {
        serde_json::to_string(&self.solvers.get(&solver_id)).unwrap_or_default()
    }

    pub fn get_pool(&self, pool_id: String) -> String {
        serde_json::to_string(&self.pools.get(&pool_id)).unwrap_or_default()
    }

    pub fn get_order(&self, order_id: String) -> String {
        serde_json::to_string(&self.orders.get(&order_id)).unwrap_or_default()
    }

    pub fn get_user_orders(&self, user: AccountId) -> Vec<String> {
        self.user_orders.get(&user).unwrap_or_default()
    }

    pub fn get_solver_pools(&self, solver_id: AccountId) -> Vec<String> {
        self.solver_pools.get(&solver_id).unwrap_or_default()
    }

    pub fn get_statistics(&self) -> (u64, U128, U128) {
        (self.total_orders, self.total_volume, self.total_fees)
    }

    pub fn get_active_solvers(&self) -> Vec<AccountId> {
        self.active_solvers.values_as_vector().to_vec()
    }

    // Admin methods
    pub fn set_min_solver_stake(&mut self, min_stake: U128) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can set min stake");
        self.min_solver_stake = min_stake;
    }

    pub fn set_max_solver_fee(&mut self, max_fee: u32) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can set max fee");
        assert!(max_fee <= 1000, "Max fee cannot exceed 10%");
        self.max_solver_fee = max_fee;
    }

    pub fn set_quote_timeout(&mut self, timeout: U64) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can set timeout");
        self.quote_timeout = timeout;
    }

    pub fn deactivate_solver(&mut self, solver_id: AccountId) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can deactivate solver");
        
        if let Some(mut solver) = self.solvers.get(&solver_id) {
            solver.is_active = false;
            self.solvers.insert(&solver_id, &solver);
            self.active_solvers.remove(&solver_id);
        }
    }

    pub fn activate_solver(&mut self, solver_id: AccountId) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can activate solver");
        
        if let Some(mut solver) = self.solvers.get(&solver_id) {
            solver.is_active = true;
            self.solvers.insert(&solver_id, &solver);
            self.active_solvers.insert(&solver_id, &solver_id);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::{testing_env, AccountId};

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    #[test]
    fn test_register_solver() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let mut contract = FusionSolver::new(accounts(0), accounts(2));
        
        let success = contract.register_solver(
            "Test Solver".to_string(),
            "A test solver".to_string(),
            "1.0.0".to_string(),
            "abc123".to_string(),
        );
        
        assert!(success);
        
        let solver = contract.get_solver(accounts(1));
        assert!(solver.is_some());
        assert_eq!(solver.unwrap().name, "Test Solver");
    }

    #[test]
    fn test_create_pool() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let mut contract = FusionSolver::new(accounts(0), accounts(2));
        
        // Register solver first
        contract.register_solver(
            "Test Solver".to_string(),
            "A test solver".to_string(),
            "1.0.0".to_string(),
            "abc123".to_string(),
        );
        
        let success = contract.create_pool(
            "pool1".to_string(),
            100, // 1% fee
            U128(1000),
            U128(1000000),
        );
        
        assert!(success);
        
        let pool = contract.get_pool("pool1".to_string());
        assert!(pool.is_some());
        assert_eq!(pool.unwrap().solver, accounts(1));
    }

    #[test]
    fn test_request_quote() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let contract = FusionSolver::new(accounts(0), accounts(2));
        
        let quote_id = contract.request_quote(
            accounts(3),
            accounts(4),
            U128(1000),
            U64(env::block_timestamp() + 300_000_000_000), // 5 minutes
        );
        
        assert!(!quote_id.is_empty());
    }
} 