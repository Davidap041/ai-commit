# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-24

### Added
- Multi-provider support for generating commit messages:
  - OpenAI integration
  - Google Gemini integration
  - Ollama integration for local model support
- Interactive commit message selection with multiple suggestions
- Customizable commit message templates
- Emoji support in commit messages
- Language selection support for commit messages
- Secure API key management through secrets.js
- Installation script for easy setup
- Command-line interface with various options:
  - Force commit without confirmation
  - Custom commit types
  - Template-based commit messages
  - Multiple language support

### Changed
- Improved project structure with modular design
- Enhanced error handling for API keys and configurations
- Optimized diff analysis for better commit message generation

### Security
- Secure storage of API keys in secrets.js with restricted permissions
- Input validation for API keys during setup
