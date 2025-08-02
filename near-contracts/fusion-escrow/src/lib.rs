use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap};
use near_sdk::json_types::{U128, U64};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, ext_contract, near_bindgen, AccountId, Gas, PanicOnDefault, Promise, PromiseOrValue,
    Timestamp, NearToken,
};
use near_contract_standards::fungible_token::Balance;
use near_contract_standards::fungible_token::core::ext_ft_core;
use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;

// Gas constants
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(10);
const GAS_FOR_RESOLVE_TRANSFER: Gas = Gas::from_tgas(20);
const GAS_FOR_CLAIM: Gas = Gas::from_tgas(30);

// Storage constants
const STORAGE_COST_PER_BYTE: Balance = 1_000_000_000_000_000_000; // 1 NEAR
const MIN_STORAGE_BALANCE: Balance = STORAGE_COST_PER_BYTE * 1000; // 1KB

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct EscrowOrder {
    pub id: String,
    pub maker: AccountId,
    pub taker: AccountId,
    pub from_token: AccountId,
    pub to_token: AccountId,
    pub from_amount: U128,
    pub to_amount: U128,
    pub hashlock: String,
    pub secret: Option<String>,
    pub timelock: U64,
    pub status: OrderStatus,
    pub created_at: U64,
    pub expires_at: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq, Debug, schemars::JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub enum OrderStatus {
    Pending,
    Funded,
    Claimed,
    Refunded,
    Expired,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct CrossChainSwap {
    pub evm_order_hash: String,
    pub near_order_id: String,
    pub evm_address: String,
    pub near_account: AccountId,
    pub from_chain: String,
    pub to_chain: String,
    pub from_token: String,
    pub to_token: String,
    pub from_amount: U128,
    pub to_amount: U128,
    pub hashlock: String,
    pub secret: Option<String>,
    pub timelock: U64,
    pub status: SwapStatus,
    pub created_at: U64,
    pub expires_at: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq, Debug, schemars::JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub enum SwapStatus {
    Initiated,
    EVMOrderFilled,
    NEAROrderFunded,
    Completed,
    Failed,
    Expired,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct FusionQuote {
    pub from_token: AccountId,
    pub to_token: AccountId,
    pub from_amount: U128,
    pub to_amount: U128,
    pub price: String,
    pub gas_estimate: U128,
    pub protocols: Vec<String>,
    pub route: Vec<SwapRoute>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SwapRoute {
    pub protocol: String,
    pub from_token: AccountId,
    pub to_token: AccountId,
    pub amount: U128,
    pub fee: String,
    pub pool_id: Option<String>,
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
pub struct FusionEscrow {
    pub owner: AccountId,
    pub fee_rate: u32, // Fee rate in basis points (e.g., 30 = 0.3%)
    pub min_timelock: U64,
    pub max_timelock: U64,
    
    // Storage
    pub orders: UnorderedMap<String, EscrowOrder>,
    pub cross_chain_swaps: UnorderedMap<String, CrossChainSwap>,
    pub user_orders: LookupMap<AccountId, Vec<String>>,
    pub supported_tokens: LookupMap<AccountId, bool>,
    
    // Statistics
    pub total_swaps: u64,
    pub total_volume: U128,
    pub total_fees: U128,
}

#[near_bindgen]
impl FusionEscrow {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            owner,
            fee_rate: 30, // 0.3% default fee
            min_timelock: U64(3600), // 1 hour minimum
            max_timelock: U64(86400), // 24 hours maximum
            orders: UnorderedMap::new(b"o"),
            cross_chain_swaps: UnorderedMap::new(b"c"),
            user_orders: LookupMap::new(b"u"),
            supported_tokens: LookupMap::new(b"t"),
            total_swaps: 0,
            total_volume: U128(0),
            total_fees: U128(0),
        }
    }

    // Create a new escrow order
    pub fn create_order(
        &mut self,
        taker: AccountId,
        from_token: AccountId,
        to_token: AccountId,
        from_amount: U128,
        to_amount: U128,
        hashlock: String,
        timelock: U64,
    ) -> String {
        // Validate timelock
        assert!(
            timelock.0 >= self.min_timelock.0 && timelock.0 <= self.max_timelock.0,
            "Timelock must be between {} and {} seconds",
            self.min_timelock.0,
            self.max_timelock.0
        );

        // Validate tokens are supported
        assert!(
            self.supported_tokens.get(&from_token).unwrap_or(false),
            "From token not supported"
        );
        assert!(
            self.supported_tokens.get(&to_token).unwrap_or(false),
            "To token not supported"
        );

        let maker = env::predecessor_account_id();
        let order_id = format!("order_{}_{}", maker, env::block_timestamp());
        
        let order = EscrowOrder {
            id: order_id.clone(),
            maker: maker.clone(),
            taker,
            from_token,
            to_token,
            from_amount,
            to_amount,
            hashlock,
            secret: None,
            timelock,
            status: OrderStatus::Pending,
            created_at: U64(env::block_timestamp()),
            expires_at: U64(env::block_timestamp() + timelock.0 * 1_000_000_000), // Convert to nanoseconds
        };

        self.orders.insert(&order_id, &order);
        
        // Add to user's orders
        let mut user_orders = self.user_orders.get(&maker).unwrap_or_default();
        user_orders.push(order_id.clone());
        self.user_orders.insert(&maker, &user_orders);

        order_id
    }

    // Fund an escrow order (deposit tokens)
    pub fn fund_order(&mut self, order_id: String) -> Promise {
        let mut order = self.orders.get(&order_id).expect("Order not found");
        assert_eq!(order.status, OrderStatus::Pending, "Order must be pending");
        assert_eq!(
            env::predecessor_account_id(),
            order.maker,
            "Only maker can fund order"
        );

        order.status = OrderStatus::Funded;
        self.orders.insert(&order_id, &order);

        // Transfer tokens from maker to contract
        ext_ft::ext(order.from_token.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(env::current_account_id(), order.from_amount, Some(format!("Fund order {}", order_id)))
    }

    // Claim tokens using secret
    pub fn claim_order(&mut self, order_id: String, secret: String) -> Promise {
        let mut order = self.orders.get(&order_id).expect("Order not found");
        assert_eq!(order.status, OrderStatus::Funded, "Order must be funded");
        assert_eq!(
            env::predecessor_account_id(),
            order.taker,
            "Only taker can claim order"
        );

        // Verify hashlock matches secret
        let computed_hashlock = env::sha256(secret.as_bytes());
        assert_eq!(
            hex::encode(computed_hashlock),
            order.hashlock,
            "Invalid secret"
        );

        order.status = OrderStatus::Claimed;
        order.secret = Some(secret);
        self.orders.insert(&order_id, &order);

        // Calculate fee
        let fee_amount = (order.from_amount.0 * self.fee_rate as u128) / 10000;
        let transfer_amount = order.from_amount.0 - fee_amount;

        // Update statistics
        self.total_swaps += 1;
        self.total_volume = U128(self.total_volume.0 + order.from_amount.0);
        self.total_fees = U128(self.total_fees.0 + fee_amount);

        // Transfer tokens to taker
        ext_ft::ext(order.from_token.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(order.taker.clone(), U128(transfer_amount), Some(format!("Claim order {}", order_id)))
    }

    // Refund tokens if timelock expired
    pub fn refund_order(&mut self, order_id: String) -> Promise {
        let mut order = self.orders.get(&order_id).expect("Order not found");
        assert_eq!(order.status, OrderStatus::Funded, "Order must be funded");
        assert_eq!(
            env::predecessor_account_id(),
            order.maker,
            "Only maker can refund order"
        );
        assert!(
            env::block_timestamp() >= order.expires_at.0,
            "Timelock not expired"
        );

        order.status = OrderStatus::Refunded;
        self.orders.insert(&order_id, &order);

        // Return tokens to maker
        ext_ft::ext(order.from_token.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(order.maker.clone(), order.from_amount, Some(format!("Refund order {}", order_id)))
    }

    // Create cross-chain swap
    pub fn create_cross_chain_swap(
        &mut self,
        evm_order_hash: String,
        evm_address: String,
        from_chain: String,
        to_chain: String,
        from_token: String,
        to_token: String,
        from_amount: U128,
        to_amount: U128,
        hashlock: String,
        timelock: U64,
    ) -> String {
        let near_account = env::predecessor_account_id();
        let swap_id = format!("swap_{}_{}", near_account, env::block_timestamp());
        
        let swap = CrossChainSwap {
            evm_order_hash,
            near_order_id: String::new(), // Will be set when NEAR order is created
            evm_address,
            near_account,
            from_chain,
            to_chain,
            from_token,
            to_token,
            from_amount,
            to_amount,
            hashlock,
            secret: None,
            timelock,
            status: SwapStatus::Initiated,
            created_at: U64(env::block_timestamp()),
            expires_at: U64(env::block_timestamp() + timelock.0 * 1_000_000_000),
        };

        self.cross_chain_swaps.insert(&swap_id, &swap);
        swap_id
    }

    // Update cross-chain swap status
    pub fn update_swap_status(&mut self, swap_id: String, status: SwapStatus) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only owner can update swap status"
        );

        let mut swap = self.cross_chain_swaps.get(&swap_id).expect("Swap not found");
        swap.status = status;
        self.cross_chain_swaps.insert(&swap_id, &swap);
    }

    // Get quote for swap
    pub fn get_quote(
        &self,
        from_token: AccountId,
        to_token: AccountId,
        from_amount: U128,
    ) -> String {
        // Mock quote - in production this would query DEX APIs
        let to_amount = U128((from_amount.0 * 98) / 100); // 2% slippage
        let price = "1.0".to_string();
        let gas_estimate = U128(30_000_000_000_000); // 30 TGas
        
        serde_json::to_string(&FusionQuote {
            from_token: from_token.clone(),
            to_token: to_token.clone(),
            from_amount,
            to_amount,
            price,
            gas_estimate,
            protocols: vec!["ref-finance".to_string()],
            route: vec![SwapRoute {
                protocol: "ref-finance".to_string(),
                from_token,
                to_token,
                amount: from_amount,
                fee: "0.003".to_string(), // 0.3% fee
                pool_id: Some("1".to_string()),
            }],
        }).unwrap_or_default()
    }

    // View methods
    pub fn get_order(&self, order_id: String) -> String {
        serde_json::to_string(&self.orders.get(&order_id)).unwrap_or_default()
    }

    pub fn get_swap(&self, swap_id: String) -> String {
        serde_json::to_string(&self.cross_chain_swaps.get(&swap_id)).unwrap_or_default()
    }

    pub fn get_user_orders(&self, account_id: AccountId) -> Vec<String> {
        self.user_orders.get(&account_id).unwrap_or_default()
    }

    pub fn get_statistics(&self) -> (u64, U128, U128) {
        (self.total_swaps, self.total_volume, self.total_fees)
    }

    // Admin methods
    pub fn add_supported_token(&mut self, token: AccountId) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only owner can add supported tokens"
        );
        self.supported_tokens.insert(&token, &true);
    }

    pub fn remove_supported_token(&mut self, token: AccountId) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only owner can remove supported tokens"
        );
        self.supported_tokens.remove(&token);
    }

    pub fn set_fee_rate(&mut self, fee_rate: u32) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only owner can set fee rate"
        );
        assert!(fee_rate <= 1000, "Fee rate cannot exceed 10%");
        self.fee_rate = fee_rate;
    }

    pub fn set_timelock_limits(&mut self, min_timelock: U64, max_timelock: U64) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only owner can set timelock limits"
        );
        assert!(min_timelock.0 < max_timelock.0, "Min timelock must be less than max");
        self.min_timelock = min_timelock;
        self.max_timelock = max_timelock;
    }
}

// Implement FungibleTokenReceiver for handling token transfers
#[near_bindgen]
impl FungibleTokenReceiver for FusionEscrow {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        // Handle incoming token transfers
        // This would be used for funding orders or other token operations
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
    fn test_create_order() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let mut contract = FusionEscrow::new(accounts(0));
        contract.add_supported_token(accounts(2));
        contract.add_supported_token(accounts(3));
        
        let order_id = contract.create_order(
            accounts(4),
            accounts(2),
            accounts(3),
            U128(1000),
            U128(950),
            "hashlock123".to_string(),
            U64(3600),
        );
        
        assert!(!order_id.is_empty());
    }

    #[test]
    fn test_get_quote() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let contract = FusionEscrow::new(accounts(0));
        
        let quote = contract.get_quote(
            accounts(2),
            accounts(3),
            U128(1000),
        );
        
        assert_eq!(quote.from_amount, U128(1000));
        assert_eq!(quote.to_amount, U128(980));
    }
} 