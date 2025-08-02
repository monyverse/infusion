module atomic_swap::atomic_swap {
    use std::hash;
    use std::option::{Self, Option};
    use std::vector;
    use sui::coin::{Self, Coin};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    /// Error codes
    const ESWAP_NOT_FOUND: u64 = 1;
    const ESWAP_ALREADY_EXISTS: u64 = 2;
    const ESWAP_ALREADY_WITHDRAWN: u64 = 3;
    const ESWAP_ALREADY_REFUNDED: u64 = 4;
    const ESWAP_INVALID_PREIMAGE: u64 = 5;
    const ESWAP_TIMELOCK_NOT_EXPIRED: u64 = 6;
    const ESWAP_INVALID_RECEIVER: u64 = 7;
    const ESWAP_INVALID_SENDER: u64 = 8;
    const ESWAP_INVALID_TIMELOCK: u64 = 9;

    /// Swap object storing details for atomic swap
    struct Swap has key, store {
        id: UID,
        sender: address,
        receiver: address,
        hashlock: vector<u8>,
        amount: u64,
        timelock: u64,
        withdrawn: bool,
        refunded: bool,
        preimage: vector<u8>,
        locked_coin: Option<Coin<coin::SUI>>,
    }

    /// Events
    struct SwapEvent has copy, drop {
        hashlock: vector<u8>,
        sender: address,
        receiver: address,
        amount: u64,
        timelock: u64,
    }
    struct RedeemEvent has copy, drop {
        hashlock: vector<u8>,
        preimage: vector<u8>,
        receiver: address,
    }
    struct RefundEvent has copy, drop {
        hashlock: vector<u8>,
        sender: address,
    }

    /// Lock coins into atomic swap
    public entry fun lock(
        receiver: address,
        hashlock: vector<u8>,
        amount: u64,
        timelock: u64,
        coin: Coin<coin::SUI>,
        ctx: &mut TxContext
    ) {
        // Timelock must be in future
        let current_time = tx_context::epoch(ctx);
        assert!(timelock > current_time, ESWAP_INVALID_TIMELOCK);

        // Create swap object
        let swap = Swap {
            id: object::new(ctx),
            sender: tx_context::sender(ctx),
            receiver,
            hashlock: vector::copy(&hashlock),
            amount,
            timelock,
            withdrawn: false,
            refunded: false,
            preimage: vector::empty(),
            locked_coin: option::some(coin),
        };

        // Transfer swap object to sender
        transfer::share_object(swap);

        // Emit event
        event::emit(SwapEvent {
            hashlock,
            sender: tx_context::sender(ctx),
            receiver,
            amount,
            timelock,
        });
    }

    /// Redeem swap by providing preimage
    public entry fun redeem(
        swap: &mut Swap,
        preimage: vector<u8>,
        ctx: &mut TxContext
    ) {
        let hashlock = hash::sha2_256(&preimage);

        assert!(!swap.withdrawn, ESWAP_ALREADY_WITHDRAWN);
        assert!(!swap.refunded, ESWAP_ALREADY_REFUNDED);
        assert!(swap.receiver == tx_context::sender(ctx), ESWAP_INVALID_RECEIVER);
        assert!(swap.hashlock == hashlock, ESWAP_INVALID_PREIMAGE);

        // Mark withdrawn and save preimage
        swap.withdrawn = true;
        swap.preimage = vector::copy(&preimage);

        // Transfer coin to receiver
        let coin = option::extract(&mut swap.locked_coin);
        transfer::transfer(coin, swap.receiver);

        // Emit redeem event
        event::emit(RedeemEvent {
            hashlock,
            preimage,
            receiver: tx_context::sender(ctx),
        });
    }

    /// Refund swap after timelock expired
    public entry fun refund(
        swap: &mut Swap,
        ctx: &mut TxContext
    ) {
        assert!(!swap.withdrawn, ESWAP_ALREADY_WITHDRAWN);
        assert!(!swap.refunded, ESWAP_ALREADY_REFUNDED);
        assert!(swap.sender == tx_context::sender(ctx), ESWAP_INVALID_SENDER);

        let current_time = tx_context::epoch(ctx);
        assert!(current_time >= swap.timelock, ESWAP_TIMELOCK_NOT_EXPIRED);

        swap.refunded = true;

        // Refund coin to sender
        let coin = option::extract(&mut swap.locked_coin);
        transfer::transfer(coin, swap.sender);

        // Emit refund event
        event::emit(RefundEvent {
            hashlock: vector::copy(&swap.hashlock),
            sender: tx_context::sender(ctx),
        });
    }

    /// Get swap details
    public fun get_swap_details(swap: &Swap): (address, address, vector<u8>, u64, u64, bool, bool) {
        (
            swap.sender,
            swap.receiver,
            vector::copy(&swap.hashlock),
            swap.amount,
            swap.timelock,
            swap.withdrawn,
            swap.refunded
        )
    }

    /// Check if swap is active
    public fun is_swap_active(swap: &Swap): bool {
        !swap.withdrawn && !swap.refunded
    }

    /// Get swap hashlock
    public fun get_hashlock(swap: &Swap): vector<u8> {
        vector::copy(&swap.hashlock)
    }
} 