module fusionplusescrow::escrow {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext, sponsor};
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use sui::hash;
    use std::vector;
    use std::option::{is_some, extract};
    use sui::sui::SUI;


    const E_UNAUTHORIZED: u64 = 0;
    const E_TOO_EARLY: u64 = 1;
    const E_TOO_LATE: u64 = 2;
    const E_INVALID_SECRET: u64 = 3;

struct Escrow<phantom T> has key, store {
    id: UID,
    secret_hash: vector<u8>,
    token: Coin<T>,          // Main escrowed token
    safety_deposit: Coin<SUI>, // Separate SUI coin for deposit
    depositor: address,
    recipient: address,
    expiry_timestamp: u64,
    fill_index: u8,
    merkle_root: vector<u8>,
    resolver: address
}

struct Intent has copy, drop, store {
    salt: u256,                      // u256 = 32 bytes
    maker: address,                 // 32 bytes Sui address
    receiver: address,              // 32 bytes Sui address
    maker_asset: address,           // 32 bytes token type or asset address
    taker_asset: address,           // 32 bytes token type or asset address
    making_amount: u256,            // match EVM (same scale, 18 decimals typical)
    taking_amount: u256,            // match EVM
    maker_traits: u256,             // 256-bit packed flags, as in EVM
}



    public entry fun deposit_src<T>(
        secret_hash: vector<u8>,
        safety_deposit: Coin<SUI>,
        merkle_root: vector<u8>,
        coin: Coin<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {

        // DEVELOPMENT NOTE:
        // sender is Maker (depositor == txcontext.sender)
        // resolver is the Taker (recipient == sponsor)
        // maker initiates this deposit without knowing who the resolver is, therefore we need the sponsor to be the recipient/resolver values
        
    // Step 1: Basic validation -------------------------------------------------------

    // Ensure amount and safety deposit are non-zero
    assert!(coin::value(&coin) > 0, 0);


    // Step 2: Enforce timelock has not already expired ------------------------------

    // Get current timestamp in milliseconds
    let now = clock::timestamp_ms(clock);
    let expiry_timestamp = now + 1000*60*20;
    assert!(now < expiry_timestamp, 3);

    // Step 3: Construct the escrow object -------------------------------------------
    // This step gives ownership of the coin (being swapped) and the Sui safety deposit

    let resolver_address: address = @0x851c7ec79de8d4eb77c6f55768d86849a0a7419e806d503682664cd8de678922;
    // let resolver_address = tx_context::sponsor(ctx); NOT WORKING, BUT NECESSARY FOR PROD

    let escrow = Escrow {
        id: object::new(ctx),
        secret_hash,
        token: coin,
        depositor: tx_context::sender(ctx), // The maker signs the transaction, but does not submit for execution (resolver does). Therefore depositor is the tx sender
        recipient: resolver_address,
        resolver: resolver_address,
        safety_deposit,
        expiry_timestamp,
        fill_index: 0,
        merkle_root,
    };

    // Step 4: Store the escrow object in chain state to shared ownership ---------------------------------
        transfer::share_object(escrow);
    }

    public entry fun deposit_dst<T>(
        secret_hash: vector<u8>,
        safety_deposit: Coin<SUI>,
        recipient: address,
        merkle_root: vector<u8>,
        coin: Coin<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {

        
    // Step 1: Basic validation -------------------------------------------------------

    // Ensure amount and safety deposit are non-zero
    assert!(coin::value(&coin) > 0, 0);
    assert!(coin::value(&safety_deposit) > 0, 1);  // New version for Coin<SUI>

    // Ensure recipient is not zero
    assert!(recipient != @0x0, 2);

    // Step 2: Enforce timelock has not already expired ------------------------------

    // Get current timestamp in milliseconds
    let now = clock::timestamp_ms(clock);
    let expiry_timestamp = now + 1000*60*18;
    assert!(now < expiry_timestamp, 3);

    // Step 3: Construct the escrow object -------------------------------------------
    // This step gives ownership of the coin (being swapped) and the Sui safety deposit

    let escrow = Escrow {
        id: object::new(ctx),
        secret_hash,
        token: coin,
        depositor: tx_context::sender(ctx),
        recipient,
        resolver: tx_context::sender(ctx),
        safety_deposit,
        expiry_timestamp,
        fill_index: 0,
        merkle_root,
    };

    // Step 4: Store the escrow object in chain state to shared ownership ---------------------------------
    transfer::share_object(escrow);
    }


public entry fun withdraw<T>(
    escrow: Escrow<T>,  // Takes ownership of the escrow object
    secret: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
) {

    // Check time is within allowed window
    if (escrow.resolver != tx_context::sender(ctx) ) {
        let now = clock::timestamp_ms(clock);
        assert!(now > escrow.expiry_timestamp, E_TOO_EARLY);
    };

    // Verify secret hash
    let computed_hash = hash::keccak256(&secret); // Using available hash function
    assert!(computed_hash == escrow.secret_hash, E_INVALID_SECRET);

    let Escrow {
        id,
        token,
        safety_deposit,
        recipient,
        resolver,
        ..
    } = escrow;

    // Transfer main tokens to recipient
    transfer::public_transfer(token, recipient);

    // Transfer safety deposit to resolver (caller)
    transfer::public_transfer(safety_deposit, resolver);

    // Escrow object is automatically deleted when function ends
    // because we took ownership and didn't transfer it elsewhere
    object::delete(id);

}


public entry fun cancel<T>(
    escrow: Escrow<T>,  // Takes ownership of the escrow object
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify escrows existence
    //Verify timestamp
    //Verify that escrow timelock has expired
    let now = clock::timestamp_ms(clock);

    assert(now >= escrow.expiry_timestamp, E_TOO_EARLY);
    
    assert(escrow.depositor == tx_context::sender(ctx), E_TOO_EARLY);

    let Escrow {
        id,
        token,
        safety_deposit,
        depositor,
        resolver,
        ..
    } = escrow;

    // Return main tokens to depositor
    transfer::public_transfer(token, depositor);

    // Transfer safety deposit to resolver (caller)
    transfer::public_transfer(safety_deposit, resolver);

    // Escrow object is automatically deleted when function ends
    // because we took ownership and didn't transfer it elsewhere
    object::delete(id);

}


fun verify_merkle_proof(
    leaf: &vector<u8>,
    proof: &vector<vector<u8>>,
    root: &vector<u8>
): bool {
    return true
}

}
