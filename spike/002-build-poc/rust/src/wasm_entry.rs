#![deny(warnings)]
use calc::add as calc_add;
use wasm_bindgen::prelude::*;

/// Exported WASM function: delegates to the pure calc library.
#[wasm_bindgen]
pub fn add(a: u32, b: u32) -> u32 {
    calc_add(a, b)
}

fn main() {}
