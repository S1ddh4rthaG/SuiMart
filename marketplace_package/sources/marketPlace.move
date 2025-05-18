/*
PackageId:  0x69c44588e703cc6022611b99949a39f87210b5e2299ecff90645dc0f34074166
MarketPlaceFactory:  0x08530d370cbb96f1fb1ebfab0d4650e89303600247e4144abc025ff91ac51047 
*/

module marketplace_package::marketplace;

use std::string::String;
use sui::coin::{Self, Coin};
use sui::object::ID;
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::tx_context::sender;

public struct Product has copy, drop, store {
    name: String,
    description: String,
    price: u64,
    quantity: u64,
    ipfs_link: String,
    sold: u64,
}

public struct Marketplace has key, store {
    id: UID,
    name: String,
    description: String,
    owner: address,
    products: vector<Product>,
}

public fun new_marketplace(name: String, description: String, ctx: &mut TxContext): Marketplace {
    Marketplace {
        id: object::new(ctx),
        name,
        description,
        owner: tx_context::sender(ctx),
        products: vector[],
    }
}

public fun add_product(
    mp: &mut Marketplace,
    name: String,
    description: String,
    price: u64,
    quantity: u64,
    ipfs_link: String,
) {
    let product = Product {
        name,
        description,
        price,
        quantity,
        ipfs_link,
        sold: 0,
    };
    mp.products.push_back(product);
}

public fun get_product(mp: &Marketplace, index: u64): Product {
    assert!(index < mp.products.length(), 0);
    mp.products[index]
}

public fun get_products(mp: &Marketplace): vector<Product> {
    mp.products
}

public fun edit_product(
    mp: &mut Marketplace,
    index: u64,
    name: String,
    description: String,
    price: u64,
    quantity: u64,
    ipfs_link: String,
) {
    assert!(index < mp.products.length(), 0);
    let product_ref = vector::borrow_mut(&mut mp.products, index);

    product_ref.name = name;
    product_ref.description = description;
    product_ref.price = price;
    product_ref.quantity = quantity;
    product_ref.ipfs_link = ipfs_link;
}

public fun delete_product(mp: &mut Marketplace, index: u64) {
    assert!(index < mp.products.length(), 0);
    vector::remove(&mut mp.products, index);
}

public struct IdentifiedPayment has key, store {
    id: UID,
    coin: Coin<SUI>,
}

public fun buy_product(
    mp: &mut Marketplace,
    index: u64,
    quantity: u64,
    coin: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(index < mp.products.length(), 0);
    let product_ref = vector::borrow_mut(&mut mp.products, index);

    assert!(product_ref.quantity >= quantity, 0);
    assert!(coin::value(&coin) >= product_ref.price * quantity, 0);

    let identified_payment = IdentifiedPayment {
        id: object::new(ctx),
        coin,
    };
    transfer::share_object(identified_payment);

    product_ref.quantity = product_ref.quantity - quantity;
    product_ref.sold = product_ref.sold + quantity;
}

public struct MarketplaceFactory has key, store {
    id: UID,
    retailerContract: Table<address, ID>,
}

fun init(ctx: &mut TxContext) {
    let mpFactory = MarketplaceFactory {
        id: object::new(ctx),
        retailerContract: table::new(ctx),
    };

    transfer::share_object(mpFactory);
}

public fun create_marketplace(
    mpFactory: &mut MarketplaceFactory,
    name: String,
    description: String,
    ctx: &mut TxContext,
) {
    let id = object::new(ctx);
    let mp = Marketplace {
        id,
        name,
        description,
        owner: tx_context::sender(ctx),
        products: vector[],
    };
    mpFactory.retailerContract.add(sender(ctx), sui::object::id(&mp));
    transfer::share_object(mp);
}

public fun is_retailer(mpFactory: &MarketplaceFactory, retailerAddress: address): bool {
    mpFactory.retailerContract.contains(retailerAddress)
}

public fun get_marketplace(mpFactory: &MarketplaceFactory, retailerAddress: address): ID {
    let id_ref = table::borrow(&mpFactory.retailerContract, retailerAddress);
    *id_ref
}
