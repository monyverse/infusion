address 0x1 {
module AtomicSwap {
    use std::signer;
    use std::vector;
    use std::hash;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::timestamp;

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

    /// Swap resource storing details for atomic swap
    struct Swap has key, store {
        sender: address,
        receiver: address,
        hashlock: vector<u8>,
        amount: u64,
        timelock: u64,
        withdrawn: bool,
        refunded: bool,
        preimage: vector<u8>,
    }

    /// Store all swaps by the sender in a Table
    struct SwapStore has key {
        swaps: vector<Swap>,
        swap_events: EventHandle<SwapEvent>,
        redeem_events: EventHandle<RedeemEvent>,
        refund_events: EventHandle<RefundEvent>,
    }

    /// Events
    struct SwapEvent has copy, drop, store {
        hashlock: vector<u8>,
        sender: address,
        receiver: address,
        amount: u64,
        timelock: u64,
    }
    struct RedeemEvent has copy, drop, store {
        hashlock: vector<u8>,
        preimage: vector<u8>,
        receiver: address,
    }
    struct RefundEvent has copy, drop, store {
        hashlock: vector<u8>,
        sender: address,
    }

    public entry fun initialize(account: &signer) {
        move_to(account, SwapStore {
            swaps: vector::empty(),
            swap_events: event::new_event_handle<SwapEvent>(account),
            redeem_events: event::new_event_handle<RedeemEvent>(account),
            refund_events: event::new_event_handle<RefundEvent>(account),
        });
    }

    /// Lock coins into atomic swap
    public entry fun lock(
        sender: &signer,
        receiver: address,
        hashlock: vector<u8>,
        amount: u64,
        timelock: u64,
        coin: Coin<coin::AptosCoin>
    ) acquires SwapStore {
        let swap_store = borrow_global_mut<SwapStore>(signer::address_of(sender));

        // Ensure swap with same hashlock doesn't exist
        assert!(!swap_exists(&swap_store.swaps, &hashlock), ESWAP_ALREADY_EXISTS);

        // Timelock must be in future
        let current_time = timestamp::now_seconds();
        assert!(timelock > current_time, ESWAP_INVALID_TIMELOCK);

        // Create and store swap
        let swap = Swap {
            sender: signer::address_of(sender),
            receiver,
            hashlock: vector::copy(&hashlock),
            amount,
            timelock,
            withdrawn: false,
            refunded: false,
            preimage: vector::empty(),
        };

        vector::push_back(&mut swap_store.swaps, swap);

        // Emit event
        event::emit_event(&mut swap_store.swap_events, SwapEvent {
            hashlock,
            sender: signer::address_of(sender),
            receiver,
            amount,
            timelock,
        });
    }

    /// Redeem swap by providing preimage
    public entry fun redeem(
        receiver: &signer,
        preimage: vector<u8>
    ) acquires SwapStore {
        let swap_store = borrow_global_mut<SwapStore>(signer::address_of(receiver));

        let hashlock = hash::sha2_256(&preimage);

        let index = find_swap_index(&swap_store.swaps, &hashlock);
        assert!(index != u64::MAX, ESWAP_NOT_FOUND);

        let mut swap = &mut vector::borrow_mut(&mut swap_store.swaps, index);

        assert!(!swap.withdrawn, ESWAP_ALREADY_WITHDRAWN);
        assert!(!swap.refunded, ESWAP_ALREADY_REFUNDED);
        assert!(swap.receiver == signer::address_of(receiver), ESWAP_INVALID_RECEIVER);
        assert!(swap.hashlock == hashlock, ESWAP_INVALID_PREIMAGE);

        // Mark withdrawn and save preimage
        swap.withdrawn = true;
        swap.preimage = vector::copy(&preimage);

        // Transfer coin to receiver
        coin::deposit(&swap.receiver, swap.amount);

        // Emit redeem event
        event::emit_event(&mut swap_store.redeem_events, RedeemEvent {
            hashlock,
            preimage,
            receiver: signer::address_of(receiver),
        });
    }

    /// Refund swap after timelock expired
    public entry fun refund(
        sender: &signer,
        hashlock: vector<u8>
    ) acquires SwapStore {
        let swap_store = borrow_global_mut<SwapStore>(signer::address_of(sender));

        let index = find_swap_index(&swap_store.swaps, &hashlock);
        assert!(index != u64::MAX, ESWAP_NOT_FOUND);

        let mut swap = &mut vector::borrow_mut(&mut swap_store.swaps, index);

        assert!(!swap.withdrawn, ESWAP_ALREADY_WITHDRAWN);
        assert!(!swap.refunded, ESWAP_ALREADY_REFUNDED);
        assert!(swap.sender == signer::address_of(sender), ESWAP_INVALID_SENDER);

        let current_time = timestamp::now_seconds();
        assert!(current_time >= swap.timelock, ESWAP_TIMELOCK_NOT_EXPIRED);

        swap.refunded = true;

        // Refund coin to sender
        coin::deposit(&swap.sender, swap.amount);

        // Emit refund event
        event::emit_event(&mut swap_store.refund_events, RefundEvent {
            hashlock,
            sender: signer::address_of(sender),
        });
    }

    /// Helper: find swap by hashlock
    fun find_swap_index(swaps: &vector<Swap>, hashlock: &vector<u8>): u64 {
        let len = vector::length(swaps);
        let mut i = 0;
        while (i < len) {
            let s = vector::borrow(swaps, i);
            if (s.hashlock == *hashlock) {
                return i;
            };
            i = i + 1;
        };
        u64::MAX
    }

    /// Helper: check if swap exists
    fun swap_exists(swaps: &vector<Swap>, hashlock: &vector<u8>): bool {
        find_swap_index(swaps, hashlock) != u64::MAX
    }

    /// Get swap details
    public fun get_swap(swaps: &vector<Swap>, hashlock: vector<u8>): Option<Swap> {
        let index = find_swap_index(swaps, &hashlock);
        if (index != u64::MAX) {
            option::some(*vector::borrow(swaps, index))
        } else {
            option::none()
        }
    }
} 