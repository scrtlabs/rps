use cosmwasm_std::{Env};

pub fn get_random_game_id(env: Env) -> String {
    let rand: &Vec<u8> = &env.block.random.unwrap().0;

    let sub_slice = rand.split_at(5);
    // we use base32 with crockford alphabet to produce a more human-readable string
    base32::encode(base32::Alphabet::Crockford, sub_slice.0)
}
