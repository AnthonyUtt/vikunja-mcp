# vikunja-mcp

Basic MCP server for Vikunja, maybe will add more features in the future

## Currently Supported
- List projects
- Get project by ID
- List all tasks
- List tasks in project
- Add task to project
    - N.B. - Only supports title, description, and done fields
- Update task
- Delete task

## Installation
Via `npx`:
```json
{
    "mcpServers": {
        // ... other config
        "vikunja": {
            "command": "npx",
            "args": [
                "-y",
                "vikunja-mcp"
            ],
            "env": [
                "VIKUNJA_API_BASE": "https://app.vikunja.cloud",
                "VIKUNJA_API_TOKEN": "<your_token_here>"
            ]
        }
    }
}
```

Or local build:
```bash
git clone https://github.com/AnthonyUtt/vikunja-mcp && cd vikunja-mcp
pnpm install
pnpm build
```
Then, in Claude config:
```json
{
    "mcpServers": {
        // ... other config
        "vikunja": {
            "command": "node",
            "args": [
                "/path/to/dist/index.js"
            ],
            "env": [
                "VIKUNJA_API_BASE": "https://app.vikunja.cloud",
                "VIKUNJA_API_TOKEN": "<your_token_here>"
            ]
        }
    }
}
```
