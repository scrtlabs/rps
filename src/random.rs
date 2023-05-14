use cosmwasm_std::{Env, MessageInfo};
use crate::rng::Prng;

pub fn get_random_game_id(env: &Env) -> String {
    let rand = if let Some(random) = &env.block.random {
        random.0[..]
    } else {
        [0u8; 32]
    };

    let sub_slice = rand.split_at(5);
    // we use base32 with crockford alphabet to produce a more human-readable string
    base32::encode(base32::Alphabet::Crockford, sub_slice.0)
}
