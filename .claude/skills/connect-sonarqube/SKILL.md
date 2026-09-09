---
name: connect-sonarqube
description: Set up the SonarQube MCP server for this repository. Guides token generation, Docker verification, root MCP configuration, and connection testing.
---

# Connect SonarQube Skill

Use this skill when a developer asks to set up, configure, or connect SonarQube for this repository.

## Overview

SonarQube integration uses an MCP server, not the SonarLint extension. The MCP server runs via Docker and gives configured local assistants access to quality gates, coverage data, and issue tracking.

## Prerequisites

Before starting, confirm:

1. Docker is installed and running (`docker --version`).
2. The developer has access to the team's SonarQube instance.
3. The project key exists in `sonar-project.properties` as `sonar.projectKey`.

## Setup

### 1. Generate a SonarQube token

1. Open the SonarQube instance.
2. Navigate to **My Account > Security** (`/account/security`).
3. Generate a new **User Token**.
4. Copy the token immediately; it is shown only once.

### 2. Store the token in the shell environment

Add the token to the developer's shell profile:

```bash
export SONARQUBE_TOKEN="the-generated-token"
```

Reload the shell or open a new terminal.

The token must never be committed. The committed `.mcp.json` leaves `SONARQUBE_TOKEN` empty so the value comes from the local shell environment.

### 3. Verify Docker can pull the MCP image

```bash
docker pull mcp/sonarqube
```

### 4. Verify the MCP server starts

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{}}}' | \
  SONARQUBE_TOKEN="$SONARQUBE_TOKEN" SONARQUBE_URL="https://sonarqube.talana.dev" \
  docker run -i --rm --init --pull=always -e SONARQUBE_TOKEN -e SONARQUBE_URL mcp/sonarqube
```

A valid JSON-RPC response confirms the server works.

### 5. Start a fresh assistant session

Start the assistant from the repository root so it reads `.mcp.json`. Ask for the project quality gate status or available SonarQube projects to confirm the tools are available.

## MCP Configuration

This repository keeps one committed MCP config:

| File        | Key                    |
| ----------- | ---------------------- |
| `.mcp.json` | `mcpServers.sonarqube` |

The server runs:

```bash
docker run -i --rm --init --pull=always -e SONARQUBE_TOKEN -e SONARQUBE_URL mcp/sonarqube
```

## Troubleshooting

| Problem                      | Fix                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `SONARQUBE_TOKEN` is missing | Restart the terminal after setting the env var                                  |
| Docker image pull fails      | Check Docker is running and network access works                                |
| Tools fail after startup     | Verify the token has access to the project key in `sonar-project.properties`    |
| MCP tools are unavailable    | Start a new assistant session from the repository root so `.mcp.json` is loaded |

## Related Files

- `.mcp.json` - SonarQube MCP config
- `sonar-project.properties` - project key and analysis settings
- `.agents/skills/use-sonarqube/SKILL.md` - how to use SonarQube tools after setup
