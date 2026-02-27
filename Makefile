.PHONY: all build test lint clean desktop desktop-build desktop-test rust-check rust-test man verify help

# Default target
all: build test

# TypeScript library build
build:
	npm run build

# Run all tests
test:
	npm test -- --run

# TypeScript type checking
lint:
	npx tsc --noEmit

# Desktop development server
desktop:
	npm run desktop:dev

# Desktop production build
desktop-build:
	npm run desktop:build

# Desktop tests
desktop-test:
	npm run desktop:test

# Rust checks
rust-check:
	cd src-tauri && cargo check

# Rust tests
rust-test:
	cd src-tauri && cargo test

# Clean build artifacts
clean:
	rm -rf dist/
	rm -rf desktop/dist/
	cd src-tauri && cargo clean

# Compile man pages (requires scdoc)
man:
	@command -v scdoc >/dev/null 2>&1 || { echo "scdoc not found. Install with: sudo apt install scdoc"; exit 1; }
	scdoc < extra/man/gsd-os.1.scd > extra/man/gsd-os.1
	scdoc < extra/man/skill-creator.1.scd > extra/man/skill-creator.1
	scdoc < extra/man/sc-config.5.scd > extra/man/sc-config.5

# Full verification
verify: lint rust-check test desktop-test
	@echo "All checks passed."

# Help
help:
	@echo "Targets:"
	@echo "  all           Build and test (default)"
	@echo "  build         TypeScript library build"
	@echo "  test          Run all Vitest tests"
	@echo "  lint          TypeScript type checking"
	@echo "  desktop       Start desktop dev server"
	@echo "  desktop-build Build desktop for production"
	@echo "  desktop-test  Run desktop tests"
	@echo "  rust-check    Cargo check"
	@echo "  rust-test     Cargo test"
	@echo "  clean         Remove build artifacts"
	@echo "  man           Compile man pages (requires scdoc)"
	@echo "  verify        Run all verification checks"
