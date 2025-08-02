use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap};
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
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(10);
const GAS_FOR_RESOLVE_TRANSFER: Gas = Gas::from_tgas(20);
const GAS_FOR_POOL_OPERATION: Gas = Gas::from_tgas(30);

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct LiquidityPool {
    pub id: String,
    pub name: String,
    pub description: String,
    pub solver: AccountId,
    pub token: AccountId,
    pub total_liquidity: U128,
    pub available_liquidity: U128,
    pub total_shares: U128,
    pub fee_rate: u32, // Basis points
    pub min_deposit: U128,
    pub max_deposit: U128,
    pub is_active: bool,
    pub created_at: U64,
    pub last_updated: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct LiquidityProvider {
    pub account_id: AccountId,
    pub pool_id: String,
    pub shares: U128,
    pub deposited_amount: U128,
    pub claimed_rewards: U128,
    pub joined_at: U64,
    pub last_claim: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct PoolReward {
    pub pool_id: String,
    pub total_rewards: U128,
    pub distributed_rewards: U128,
    pub reward_rate: u32, // Basis points per day
    pub last_distribution: U64,
    pub next_distribution: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct PoolTransaction {
    pub id: String,
    pub pool_id: String,
    pub user: AccountId,
    pub action: PoolAction,
    pub amount: U128,
    pub shares: U128,
    pub timestamp: U64,
    pub tx_hash: Option<String>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum PoolAction {
    Deposit,
    Withdraw,
    ClaimRewards,
    FeeCollection,
}

// External contract interface for fungible tokens
#[ext_contract(ext_ft)]
pub trait ExtFungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) -> Promise;
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> Promise;
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct FusionPool {
    pub owner: AccountId,
    pub solver_contract: AccountId,
    
    // Pools
    pub pools: UnorderedMap<String, LiquidityPool>,
    pub solver_pools: LookupMap<AccountId, Vec<String>>,
    
    // Providers
    pub providers: UnorderedMap<String, LiquidityProvider>,
    pub user_pools: LookupMap<AccountId, Vec<String>>,
    
    // Rewards
    pub rewards: UnorderedMap<String, PoolReward>,
    
    // Transactions
    pub transactions: UnorderedMap<String, PoolTransaction>,
    
    // Statistics
    pub total_pools: u64,
    pub total_providers: u64,
    pub total_liquidity: U128,
    pub total_rewards_distributed: U128,
    
    // Configuration
    pub min_pool_fee: u32,
    pub max_pool_fee: u32,
    pub reward_distribution_interval: U64,
    pub min_deposit_amount: U128,
}

#[near_bindgen]
impl FusionPool {
    #[init]
    pub fn new(owner: AccountId, solver_contract: AccountId) -> Self {
        Self {
            owner,
            solver_contract,
            pools: UnorderedMap::new(b"p"),
            solver_pools: LookupMap::new(b"sp"),
            providers: UnorderedMap::new(b"pr"),
            user_pools: LookupMap::new(b"up"),
            rewards: UnorderedMap::new(b"r"),
            transactions: UnorderedMap::new(b"t"),
            total_pools: 0,
            total_providers: 0,
            total_liquidity: U128(0),
            total_rewards_distributed: U128(0),
            min_pool_fee: 10, // 0.1%
            max_pool_fee: 1000, // 10%
            reward_distribution_interval: U64(86400_000_000_000), // 1 day in nanoseconds
            min_deposit_amount: U128(1_000_000_000_000_000_000_000), // 1 NEAR
        }
    }

    // Create a new liquidity pool
    pub fn create_pool(
        &mut self,
        pool_id: String,
        name: String,
        description: String,
        token: AccountId,
        fee_rate: u32,
        min_deposit: U128,
        max_deposit: U128,
    ) -> bool {
        let solver = env::predecessor_account_id();
        
        // Validate fee rate
        assert!(
            fee_rate >= self.min_pool_fee && fee_rate <= self.max_pool_fee,
            "Fee rate must be between {} and {} basis points",
            self.min_pool_fee,
            self.max_pool_fee
        );

        // Validate deposit limits
        assert!(min_deposit.0 <= max_deposit.0, "Min deposit must be less than max deposit");
        assert!(min_deposit.0 >= self.min_deposit_amount.0, "Min deposit too low");

        let pool = LiquidityPool {
            id: pool_id.clone(),
            name,
            description,
            solver: solver.clone(),
            token,
            total_liquidity: U128(0),
            available_liquidity: U128(0),
            total_shares: U128(0),
            fee_rate,
            min_deposit,
            max_deposit,
            is_active: true,
            created_at: U64(env::block_timestamp()),
            last_updated: U64(env::block_timestamp()),
        };

        self.pools.insert(&pool_id, &pool);
        
        // Add to solver's pools
        let mut solver_pools = self.solver_pools.get(&solver).unwrap_or_default();
        solver_pools.push(pool_id.clone());
        self.solver_pools.insert(&solver, &solver_pools);
        
        // Initialize rewards
        let reward = PoolReward {
            pool_id: pool_id.clone(),
            total_rewards: U128(0),
            distributed_rewards: U128(0),
            reward_rate: 100, // 1% per day default
            last_distribution: U64(env::block_timestamp()),
            next_distribution: U64(env::block_timestamp() + self.reward_distribution_interval.0),
        };
        self.rewards.insert(&pool_id, &reward);
        
        self.total_pools += 1;
        
        true
    }

    // Deposit liquidity into a pool
    pub fn deposit_liquidity(&mut self, pool_id: String) -> Promise {
        let provider = env::predecessor_account_id();
        let attached_deposit = env::attached_deposit();
        
        let mut pool = self.pools.get(&pool_id).expect("Pool not found");
        assert!(pool.is_active, "Pool is not active");
        assert!(attached_deposit >= NearToken::from_yoctonear(pool.min_deposit.0), "Deposit too small");
        assert!(attached_deposit <= NearToken::from_yoctonear(pool.max_deposit.0), "Deposit too large");
        
        // Calculate shares to mint
        let shares_to_mint = if pool.total_shares.0 == 0 {
            attached_deposit.as_yoctonear()
        } else {
            (attached_deposit.as_yoctonear() * pool.total_shares.0) / pool.total_liquidity.0
        };
        
        // Update pool
        pool.total_liquidity = U128(pool.total_liquidity.0 + attached_deposit.as_yoctonear());
        pool.available_liquidity = U128(pool.available_liquidity.0 + attached_deposit.as_yoctonear());
        pool.total_shares = U128(pool.total_shares.0 + shares_to_mint);
        pool.last_updated = U64(env::block_timestamp());
        
        self.pools.insert(&pool_id, &pool);
        
        // Update or create provider
        let provider_key = format!("{}_{}", provider, pool_id);
        let mut liquidity_provider = self.providers.get(&provider_key).unwrap_or_else(|| {
            LiquidityProvider {
                account_id: provider.clone(),
                pool_id: pool_id.clone(),
                shares: U128(0),
                deposited_amount: U128(0),
                claimed_rewards: U128(0),
                joined_at: U64(env::block_timestamp()),
                last_claim: U64(env::block_timestamp()),
            }
        });
        
        liquidity_provider.shares = U128(liquidity_provider.shares.0 + shares_to_mint);
        liquidity_provider.deposited_amount = U128(liquidity_provider.deposited_amount.0 + attached_deposit.as_yoctonear());
        
        self.providers.insert(&provider_key, &liquidity_provider);
        
        // Add to user's pools
        let mut user_pools = self.user_pools.get(&provider).unwrap_or_default();
        if !user_pools.contains(&pool_id) {
            user_pools.push(pool_id.clone());
            self.user_pools.insert(&provider, &user_pools);
        }
        
        // Record transaction
        let tx_id = format!("tx_{}_{}", provider, env::block_timestamp());
        let transaction = PoolTransaction {
            id: tx_id.clone(),
            pool_id: pool_id.clone(),
            user: provider.clone(),
            action: PoolAction::Deposit,
            amount: U128(attached_deposit.as_yoctonear()),
            shares: U128(shares_to_mint),
            timestamp: U64(env::block_timestamp()),
            tx_hash: None,
        };
        self.transactions.insert(&tx_id, &transaction);
        
        // Update global statistics
        self.total_liquidity = U128(self.total_liquidity.0 + attached_deposit.as_yoctonear());
        self.total_providers += 1;
        
        // Transfer tokens to pool
        ext_ft::ext(pool.token.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(env::current_account_id(), U128(attached_deposit.as_yoctonear()), Some(format!("Deposit to pool {}", pool_id)))
    }

    // Withdraw liquidity from a pool
    pub fn withdraw_liquidity(&mut self, pool_id: String, shares: U128) -> Promise {
        let provider = env::predecessor_account_id();
        
        let mut pool = self.pools.get(&pool_id).expect("Pool not found");
        assert!(pool.is_active, "Pool is not active");
        
        let provider_key = format!("{}_{}", provider, pool_id);
        let mut liquidity_provider = self.providers.get(&provider_key).expect("Provider not found");
        assert!(liquidity_provider.shares.0 >= shares.0, "Insufficient shares");
        
        // Calculate withdrawal amount
        let withdrawal_amount = (shares.0 * pool.total_liquidity.0) / pool.total_shares.0;
        assert!(withdrawal_amount <= pool.available_liquidity.0, "Insufficient liquidity");
        
        // Update pool
        pool.total_liquidity = U128(pool.total_liquidity.0 - withdrawal_amount);
        pool.available_liquidity = U128(pool.available_liquidity.0 - withdrawal_amount);
        pool.total_shares = U128(pool.total_shares.0 - shares.0);
        pool.last_updated = U64(env::block_timestamp());
        
        self.pools.insert(&pool_id, &pool);
        
        // Update provider
        liquidity_provider.shares = U128(liquidity_provider.shares.0 - shares.0);
        liquidity_provider.deposited_amount = U128(liquidity_provider.deposited_amount.0 - withdrawal_amount);
        
        self.providers.insert(&provider_key, &liquidity_provider);
        
        // Record transaction
        let tx_id = format!("tx_{}_{}", provider, env::block_timestamp());
        let transaction = PoolTransaction {
            id: tx_id,
            pool_id: pool_id.clone(),
            user: provider.clone(),
            action: PoolAction::Withdraw,
            amount: U128(withdrawal_amount),
            shares,
            timestamp: U64(env::block_timestamp()),
            tx_hash: None,
        };
        self.transactions.insert(&tx_id, &transaction);
        
        // Update global statistics
        self.total_liquidity = U128(self.total_liquidity.0 - withdrawal_amount);
        
        // Transfer tokens back to provider
        ext_ft::ext(pool.token.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(provider, U128(withdrawal_amount), Some(format!("Withdraw from pool {}", pool_id)))
    }

    // Claim rewards from a pool
    pub fn claim_rewards(&mut self, pool_id: String) -> Promise {
        let provider = env::predecessor_account_id();
        
        let mut pool = self.pools.get(&pool_id).expect("Pool not found");
        let mut reward = self.rewards.get(&pool_id).expect("Reward not found");
        
        let provider_key = format!("{}_{}", provider, pool_id);
        let mut liquidity_provider = self.providers.get(&provider_key).expect("Provider not found");
        
        // Calculate rewards
        let reward_amount = self.calculate_rewards(&pool, &reward, &liquidity_provider);
        assert!(reward_amount > 0, "No rewards to claim");
        
        // Update reward
        reward.distributed_rewards = U128(reward.distributed_rewards.0 + reward_amount);
        reward.last_distribution = U64(env::block_timestamp());
        self.rewards.insert(&pool_id, &reward);
        
        // Update provider
        liquidity_provider.claimed_rewards = U128(liquidity_provider.claimed_rewards.0 + reward_amount);
        liquidity_provider.last_claim = U64(env::block_timestamp());
        self.providers.insert(&provider_key, &liquidity_provider);
        
        // Record transaction
        let tx_id = format!("tx_{}_{}", provider, env::block_timestamp());
        let transaction = PoolTransaction {
            id: tx_id,
            pool_id: pool_id.clone(),
            user: provider.clone(),
            action: PoolAction::ClaimRewards,
            amount: U128(reward_amount),
            shares: U128(0),
            timestamp: U64(env::block_timestamp()),
            tx_hash: None,
        };
        self.transactions.insert(&tx_id, &transaction);
        
        // Update global statistics
        self.total_rewards_distributed = U128(self.total_rewards_distributed.0 + reward_amount);
        
        // Transfer rewards to provider
        ext_ft::ext(pool.token.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(provider, U128(reward_amount), Some(format!("Claim rewards from pool {}", pool_id)))
    }

    // Calculate rewards for a provider
    fn calculate_rewards(
        &self,
        pool: &LiquidityPool,
        reward: &PoolReward,
        provider: &LiquidityProvider,
    ) -> u128 {
        if pool.total_shares.0 == 0 || provider.shares.0 == 0 {
            return 0;
        }
        
        let provider_share = provider.shares.0 as f64 / pool.total_shares.0 as f64;
        let total_rewards = reward.total_rewards.0 - reward.distributed_rewards.0;
        
        (total_rewards as f64 * provider_share) as u128
    }

    // Add rewards to a pool (called by solver)
    pub fn add_rewards(&mut self, pool_id: String, amount: U128) -> bool {
        let solver = env::predecessor_account_id();
        
        let pool = self.pools.get(&pool_id).expect("Pool not found");
        assert_eq!(pool.solver, solver, "Only pool solver can add rewards");
        
        let mut reward = self.rewards.get(&pool_id).expect("Reward not found");
        reward.total_rewards = U128(reward.total_rewards.0 + amount.0);
        self.rewards.insert(&pool_id, &reward);
        
        // Record transaction
        let tx_id = format!("tx_{}_{}", solver, env::block_timestamp());
        let transaction = PoolTransaction {
            id: tx_id.clone(),
            pool_id: pool_id.clone(),
            user: solver,
            action: PoolAction::FeeCollection,
            amount,
            shares: U128(0),
            timestamp: U64(env::block_timestamp()),
            tx_hash: None,
        };
        self.transactions.insert(&tx_id, &transaction);
        
        true
    }

    // View methods
    pub fn get_pool(&self, pool_id: String) -> String {
        serde_json::to_string(&self.pools.get(&pool_id)).unwrap_or_default()
    }

    pub fn get_provider(&self, provider_key: String) -> String {
        serde_json::to_string(&self.providers.get(&provider_key)).unwrap_or_default()
    }

    pub fn get_reward(&self, pool_id: String) -> String {
        serde_json::to_string(&self.rewards.get(&pool_id)).unwrap_or_default()
    }

    pub fn get_user_pools(&self, user: AccountId) -> Vec<String> {
        self.user_pools.get(&user).unwrap_or_default()
    }

    pub fn get_solver_pools(&self, solver: AccountId) -> Vec<String> {
        self.solver_pools.get(&solver).unwrap_or_default()
    }

    pub fn get_pool_providers(&self, pool_id: String) -> String {
        // This would need to be implemented with a more efficient data structure
        // For now, returning empty vector as JSON
        serde_json::to_string(&Vec::<LiquidityProvider>::new()).unwrap_or_default()
    }

    pub fn get_statistics(&self) -> (u64, u64, U128, U128) {
        (self.total_pools, self.total_providers, self.total_liquidity, self.total_rewards_distributed)
    }

    // Admin methods
    pub fn set_min_pool_fee(&mut self, min_fee: u32) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can set min fee");
        self.min_pool_fee = min_fee;
    }

    pub fn set_max_pool_fee(&mut self, max_fee: u32) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can set max fee");
        self.max_pool_fee = max_fee;
    }

    pub fn set_min_deposit_amount(&mut self, min_amount: U128) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can set min deposit");
        self.min_deposit_amount = min_amount;
    }

    pub fn set_reward_distribution_interval(&mut self, interval: U64) {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can set interval");
        self.reward_distribution_interval = interval;
    }

    pub fn deactivate_pool(&mut self, pool_id: String) {
        let solver = env::predecessor_account_id();
        let mut pool = self.pools.get(&pool_id).expect("Pool not found");
        assert_eq!(pool.solver, solver, "Only pool solver can deactivate pool");
        
        pool.is_active = false;
        self.pools.insert(&pool_id, &pool);
    }

    pub fn activate_pool(&mut self, pool_id: String) {
        let solver = env::predecessor_account_id();
        let mut pool = self.pools.get(&pool_id).expect("Pool not found");
        assert_eq!(pool.solver, solver, "Only pool solver can activate pool");
        
        pool.is_active = true;
        self.pools.insert(&pool_id, &pool);
    }
}

// Implement FungibleTokenReceiver for handling token transfers
#[near_bindgen]
impl FungibleTokenReceiver for FusionPool {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        // Handle incoming token transfers for pool deposits
        // This would parse the msg to determine the pool and action
        PromiseOrValue::Value(U128(0))
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
    fn test_create_pool() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let mut contract = FusionPool::new(accounts(0), accounts(2));
        
        let success = contract.create_pool(
            "pool1".to_string(),
            "Test Pool".to_string(),
            "A test liquidity pool".to_string(),
            accounts(3),
            100, // 1% fee
            U128(1000),
            U128(1000000),
        );
        
        assert!(success);
        
        let pool = contract.get_pool("pool1".to_string());
        assert!(pool.is_some());
        assert_eq!(pool.unwrap().name, "Test Pool");
    }

    #[test]
    fn test_get_statistics() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let contract = FusionPool::new(accounts(0), accounts(2));
        
        let stats = contract.get_statistics();
        assert_eq!(stats.0, 0); // total_pools
        assert_eq!(stats.1, 0); // total_providers
    }
} 