# Directory where emulator data will be stored
EMULATOR_DATA_DIR := ./firebase-data

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make firebase-start    - Start Firebase emulators with data persistence"
	@echo "  make firebase-clean    - Remove persisted emulator data"

# Create data directory if it doesn't exist
$(EMULATOR_DATA_DIR):
	mkdir -p $(EMULATOR_DATA_DIR)

# Start emulators with data persistence
.PHONY: firebase-start
firebase-start: $(EMULATOR_DATA_DIR)
	@echo "Starting Firebase emulators..."
	firebase emulators:start --import=$(EMULATOR_DATA_DIR) --export-on-exit=$(EMULATOR_DATA_DIR)

# Clean persisted data
.PHONY: firebase-clean
firebase-clean:
	rm -rf $(EMULATOR_DATA_DIR)