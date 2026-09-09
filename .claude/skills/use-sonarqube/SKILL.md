---
name: use-sonarqube
description: Use SonarQube MCP tools to inspect quality gates, coverage gaps, and high-priority issues before merging.
---

# Use SonarQube Skill

Use this skill when a developer asks about quality gates, coverage, SonarQube issues, or project health before merging.

## Prerequisites

- SonarQube MCP must be configured and available from `.mcp.json`.
- If MCP is not available, use the `connect-sonarqube` skill first.
- The project key is defined in `sonar-project.properties` as `sonar.projectKey`.

## Available MCP Tools

| Tool                              | Purpose                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `get_project_quality_gate_status` | Check whether the quality gate passes                           |
| `get_component_measures`          | Inspect overall metrics such as coverage, lines, and violations |
| `search_files_by_coverage`        | Find files with low coverage                                    |
| `get_file_coverage_details`       | Inspect uncovered lines and partial branches                    |
| `search_sonar_issues_in_projects` | Search bugs, vulnerabilities, and code smells                   |
| `search_my_sonarqube_projects`    | List accessible projects on the server                          |
| `analyze_code_snippet`            | Analyze a local snippet without pushing                         |

## Workflow

1. Read `sonar-project.properties` and capture `sonar.projectKey`.
2. Check `get_project_quality_gate_status` first.
3. If the gate fails, use `get_component_measures` to identify the failing metric.
4. For coverage gaps, use `search_files_by_coverage`, then `get_file_coverage_details`.
5. For issues, use `search_sonar_issues_in_projects` and prioritize `BLOCKER` and `HIGH` severity first.
6. After changes, rerun local verification.

## Local Verification

```bash
pnpm test:unit --run
pnpm test:coverage
pnpm build
```

## Output

When reporting results, include:

- Current gate status.
- Exact files or lines affected.
- Recommended next action or verification command.

## Related Files

- `.mcp.json` - SonarQube MCP config
- `sonar-project.properties` - project key and analysis settings
- `.agents/skills/connect-sonarqube/SKILL.md` - setup guide
