#![deny(warnings)]

/// Adds two unsigned 32-bit integers.
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_basic() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_add_zero() {
        assert_eq!(add(0, 0), 0);
    }

    #[test]
    fn test_add_large() {
        assert_eq!(add(u32::MAX - 1, 1), u32::MAX);
    }
}
