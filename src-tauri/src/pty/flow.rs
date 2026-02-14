/// Split a byte buffer at the last valid UTF-8 boundary.
///
/// Returns `(valid_chunk, remainder)` where `remainder` contains trailing
/// bytes of an incomplete UTF-8 sequence. If the entire buffer is valid
/// UTF-8, `remainder` is empty.
///
/// This is used in the PTY reader thread to avoid sending partial multi-byte
/// characters to the frontend, which would cause garbled display.
pub fn split_utf8_safe(buf: &[u8]) -> (&[u8], &[u8]) {
    match std::str::from_utf8(buf) {
        Ok(_) => (buf, &[]),
        Err(e) => {
            let valid_up_to = e.valid_up_to();
            (&buf[..valid_up_to], &buf[valid_up_to..])
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ascii_passthrough() {
        let buf = b"Hello, world!";
        let (valid, remainder) = split_utf8_safe(buf);
        assert_eq!(valid, b"Hello, world!");
        assert!(remainder.is_empty());
    }

    #[test]
    fn test_split_multibyte() {
        // U+2603 SNOWMAN is encoded as [0xE2, 0x98, 0x83] (3 bytes)
        // Send "Hi" + first 2 bytes of snowman => should split at "Hi"
        let buf = &[b'H', b'i', 0xE2, 0x98];
        let (valid, remainder) = split_utf8_safe(buf);
        assert_eq!(valid, b"Hi");
        assert_eq!(remainder, &[0xE2, 0x98]);
    }

    #[test]
    fn test_empty_buffer() {
        let buf: &[u8] = &[];
        let (valid, remainder) = split_utf8_safe(buf);
        assert!(valid.is_empty());
        assert!(remainder.is_empty());
    }

    #[test]
    fn test_complete_multibyte() {
        // Full snowman character should pass through entirely
        let buf = &[0xE2, 0x98, 0x83];
        let (valid, remainder) = split_utf8_safe(buf);
        assert_eq!(valid, &[0xE2, 0x98, 0x83]);
        assert!(remainder.is_empty());
    }

    #[test]
    fn test_mixed_ascii_and_multibyte() {
        // "AB" + full snowman + first byte of another 3-byte char
        let buf = &[b'A', b'B', 0xE2, 0x98, 0x83, 0xE2];
        let (valid, remainder) = split_utf8_safe(buf);
        // "AB" + snowman are valid; trailing 0xE2 is incomplete
        assert_eq!(valid, &[b'A', b'B', 0xE2, 0x98, 0x83]);
        assert_eq!(remainder, &[0xE2]);
    }

    #[test]
    fn test_four_byte_split() {
        // U+1F600 GRINNING FACE is [0xF0, 0x9F, 0x98, 0x80] (4 bytes)
        // Send first 3 bytes => should return empty valid, all as remainder
        let buf = &[0xF0, 0x9F, 0x98];
        let (valid, remainder) = split_utf8_safe(buf);
        assert!(valid.is_empty());
        assert_eq!(remainder, &[0xF0, 0x9F, 0x98]);
    }
}
