# SWARM // Agent Coordination Protocol 🐝

Cyberpunk-themed multi-agent coordination system for complex bounty hunting.

**Live:** https://swarm-coordinator.surge.sh

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

```
POST /api/decompose
{
  "bountyId": "55",
  "agents": ["ALPHA-01", "BETA-02"]
}

Response:
{
  "tasks": [
    { "id": 1, "name": "UI/Frontend", "assignedTo": "ALPHA-01" },
    { "id": 2, "name": "API/Backend", "assignedTo": "BETA-02" }
  ],
  "status": "coordinating"
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
