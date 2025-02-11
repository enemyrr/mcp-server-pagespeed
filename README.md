# @enemyrr/mcp-server-pagespeed

A Model Context Protocol server that provides Google PageSpeed Insights analysis. This server enables AI models to analyze webpage performance through a standardized interface.

<a href="https://glama.ai/mcp/servers/wes81w8il2"><img width="380" height="200" src="https://glama.ai/mcp/servers/wes81w8il2/badge" alt="Server Pagespeed MCP server" /></a>

## Installation & Setup for Cursor IDE

1. Clone and build the project:
```bash
git clone https://github.com/enemyrr/mcp-server-pagespeed.git
cd mcp-server-pagespeed
npm install
npm run build
```

2. Add the server in Cursor IDE settings:
   - Open Command Palette (Cmd/Ctrl + Shift + P)
   - Search for "MCP: Add Server"
   - Fill in the fields:
     - Name: `pagespeed`
     - Type: `command`
     - Command: `node /absolute/path/to/mcp-server-pagespeed/build/index.js`

> **Note**: Replace `/absolute/path/to/` with the actual path where you cloned and built the project.

## Available Tools

### analyze_pagespeed
Analyze a webpage using Google PageSpeed Insights API.

```typescript
use_mcp_tool({
  server_name: "pagespeed",
  tool_name: "analyze_pagespeed",
  arguments: {
    url: "https://example.com"
  }
});
```

The tool returns:
- Overall performance score (0-100)
- Loading experience metrics
  - First Contentful Paint
  - First Input Delay
- Top 5 improvement suggestions with:
  - Title
  - Description
  - Potential impact
  - Current value

## Features

- Real-time webpage performance analysis
- Detailed loading experience metrics
- Prioritized improvement suggestions
- Comprehensive error handling
- TypeScript support

## Error Handling

The server provides detailed error messages for:
- Invalid URLs
- API request failures
- Connection issues
- Invalid tool calls

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to https://github.com/enemyrr/mcp-server-pagespeed

## License

MIT 
