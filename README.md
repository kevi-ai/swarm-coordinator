# SWARM // Agent Coordination Protocol 🐝

Cyberpunk-themed multi-agent coordination system for complex bounty hunting.

**Live Demo:** https://swarm-coordinator.surge.sh
**Backend API:** Run `npm start` locally

## Quick Start

```bash
# Install & run the coordinator API
npm install
npm start

# API runs on http://localhost:3000
```

## Features

### 🤖 Agent Registry
- Track multiple specialized agents
- Real-time online/busy/offline status
- Skill-based agent profiles
- Visual agent selection

### 🧩 Task Decomposition
- Break complex bounties into subtasks
- Automatic skill matching
- Intelligent agent assignment
- Parallel execution tracking

### 🔄 Visual Orchestration
- Real-time task flow visualization
- Animated connection lines
- Progress indicators per subtask
- Central coordinator node

### 💻 System Console
- Live activity logging
- Timestamped events
- Color-coded log levels
- Auto-scroll output

### 🔗 Bounty Board Integration
- Fetch bounty details by ID
- Parse requirements
- Coordinate claiming
- Track payouts

## Cyberpunk UI Features

- 🌃 Animated grid background
- ✨ Floating neon orbs
- 💜 Glitch text effects
- 🎨 Neon color palette (cyan/pink/purple/green)
- 📦 Cut-corner cyber panels
- ⚡ Glowing borders & buttons
- 🖥️ Terminal-style console

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | System status |
| `/api/agents` | GET | List all agents |
| `/api/jobs` | GET | List all jobs |
| `/api/decompose` | POST | Decompose bounty into subtasks |
| `/api/assign` | POST | Assign agents to subtasks |
| `/api/coordinate` | POST | Full flow (decompose + assign) |
| `/api/complete` | POST | Mark task as complete |
| `/api/logs` | GET | Recent activity logs |

### Example: Full Coordination

```bash
curl -X POST http://localhost:3000/api/coordinate \
  -H "Content-Type: application/json" \
  -d '{"bountyId": "55"}'
```

Response:
```json
{
  "bounty": { "id": "55", "title": "Build Real-Time Leaderboard", "reward": 60 },
  "jobId": "job_1234567890",
  "assignments": [
    { "taskId": 1, "taskName": "UI/Frontend Development", "agentId": "ALPHA-01" },
    { "taskId": 2, "taskName": "Documentation & Testing", "agentId": "DELTA-04" }
  ],
  "subtasks": [...]
}
```

## Architecture

```
┌─────────────┐
│ COORDINATOR │ ← Orchestrates all tasks
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌─────┐ ┌─────┐
│ α-1 │ │ β-2 │ ← Specialized agents
└─────┘ └─────┘
   │       │
   ▼       ▼
┌─────────────┐
│   RESULT    │ ← Aggregated output
└─────────────┘
```

## License

MIT

---

Built by [kevi-ai](https://github.com/kevi-ai) for [AI Bounty Board](https://bounty.owockibot.xyz) Bounty #85
