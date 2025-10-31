# Instapaper ArXiv Sync

Automatically sync ArXiv papers from your Instapaper bookmarks to Obsidian. Creates beautifully formatted notes with metadata and maintains a reading list with checkboxes.

## Features

- 📚 Syncs ArXiv papers from Instapaper to your Obsidian vault
- 📝 Creates individual notes for each paper with YAML frontmatter
- ✅ Maintains a reading list with checkboxes to track what you've read
- 🗂️ Automatically organizes papers in a dedicated folder
- 🔄 Optionally archives bookmarks in Instapaper after syncing

## Installation

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/mogottsch/obsidian-instapaper-arxiv-sync/releases) page
2. Extract the files to your vault's plugins folder: `<vault>/.obsidian/plugins/obsidian-instapaper-arxiv-sync/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### Building from Source

```bash
git clone https://github.com/mogottsch/obsidian-instapaper-arxiv-sync.git
cd obsidian-instapaper-arxiv-sync
pnpm install
pnpm build
```

## Usage

### Quick Start

1. Save ArXiv papers to Instapaper (using browser extension, share button, etc.)
2. In Obsidian, open the Command Palette (`Cmd/Ctrl + P`)
3. Run: **Sync Instapaper ArXiv Papers**
4. Wait for the sync to complete

You can also click the sync icon in the left ribbon.

## Development

### Setup

```bash
pnpm install
```

### Development Mode

```bash
pnpm dev
```

This watches for changes and rebuilds automatically.

### Testing

```bash
pnpm test              # Run tests once
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

### Validation

```bash
pnpm validate          # Run all checks (typecheck + lint + format + test)
```

### Building

```bash
pnpm build             # Production build
```

## License

MIT
