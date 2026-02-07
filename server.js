/**
 * SWARM Coordinator API
 * Multi-agent coordination service for bounty hunting
 * @author kevi-ai
 */

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const BOUNTY_API = 'https://bounty.owockibot.xyz';

// Middleware
app.use(cors());
app.use(express.json());

// State
const state = {
  agents: {
    'ALPHA-01': { name: 'ALPHA-01', skills: ['frontend', 'typescript', 'react'], status: 'online', currentTask: null },
    'BETA-02': { name: 'BETA-02', skills: ['backend', 'python', 'node', 'api'], status: 'online', currentTask: null },
    'GAMMA-03': { name: 'GAMMA-03', skills: ['blockchain', 'solidity', 'web3'], status: 'online', currentTask: null },
    'DELTA-04': { name: 'DELTA-04', skills: ['design', 'content', 'docs'], status: 'online', currentTask: null },
  },
  jobs: {},
  logs: []
};

// Helpers
function log(type, msg, jobId = null) {
  const entry = { time: new Date().toISOString(), type, msg, jobId };
  state.logs.push(entry);
  if (state.logs.length > 100) state.logs.shift();
  console.log(`[${type.toUpperCase()}] ${msg}`);
}

function decomposeBounty(bounty) {
  const tags = bounty.tags || [];
  const desc = (bounty.description || '').toLowerCase();
  const subtasks = [];

  if (tags.some(t => ['frontend', 'ui', 'dashboard'].includes(t)) || desc.includes('frontend')) {
    subtasks.push({ id: subtasks.length + 1, name: 'UI/Frontend', skills: ['frontend', 'react'], status: 'pending' });
  }
  if (tags.some(t => ['backend', 'api', 'server'].includes(t)) || desc.includes('api')) {
    subtasks.push({ id: subtasks.length + 1, name: 'API/Backend', skills: ['backend', 'node'], status: 'pending' });
  }
  if (tags.some(t => ['blockchain', 'web3', 'contract'].includes(t)) || desc.includes('contract')) {
    subtasks.push({ id: subtasks.length + 1, name: 'Smart Contract', skills: ['blockchain', 'solidity'], status: 'pending' });
  }
  subtasks.push({ id: subtasks.length + 1, name: 'Documentation', skills: ['docs'], status: 'pending' });

  if (subtasks.length === 1) {
    subtasks.unshift({ id: 1, name: 'Core Implementation', skills: ['coding'], status: 'pending' });
  }
  return subtasks;
}

function assignAgent(task) {
  for (const [id, agent] of Object.entries(state.agents)) {
    if (agent.status === 'online' && !agent.currentTask) {
      const match = agent.skills.some(s => task.skills.includes(s));
      if (match) return id;
    }
  }
  return Object.keys(state.agents).find(id => state.agents[id].status === 'online' && !state.agents[id].currentTask);
}

// Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    agents: Object.keys(state.agents).length,
    jobs: Object.keys(state.jobs).length,
    uptime: process.uptime()
  });
});

app.get('/api/agents', (req, res) => {
  res.json({ agents: Object.values(state.agents) });
});

app.get('/api/jobs', (req, res) => {
  res.json({ jobs: Object.values(state.jobs) });
});

app.get('/api/logs', (req, res) => {
  res.json({ logs: state.logs.slice(-50) });
});

app.post('/api/decompose', async (req, res) => {
  const { bountyId } = req.body;
  if (!bountyId) return res.status(400).json({ error: 'bountyId required' });

  try {
    const response = await fetch(`${BOUNTY_API}/bounties`);
    const bounties = await response.json();
    const bounty = bounties.find(b => b.id === String(bountyId));
    if (!bounty) return res.status(404).json({ error: 'Bounty not found' });

    log('info', `Decomposing bounty #${bountyId}: ${bounty.title}`);
    const subtasks = decomposeBounty(bounty);

    res.json({
      bounty: { id: bounty.id, title: bounty.title, reward: parseFloat(bounty.reward) / 1e6 },
      subtasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assign', (req, res) => {
  const { bountyId, subtasks } = req.body;
  if (!bountyId || !subtasks) return res.status(400).json({ error: 'bountyId and subtasks required' });

  const jobId = `job_${Date.now()}`;
  const assignments = [];

  for (const task of subtasks) {
    const agentId = assignAgent(task);
    if (agentId) {
      state.agents[agentId].status = 'busy';
      state.agents[agentId].currentTask = task.id;
      task.assignedTo = agentId;
      task.status = 'assigned';
      assignments.push({ taskId: task.id, taskName: task.name, agentId });
      log('success', `Assigned "${task.name}" to ${agentId}`, jobId);
    }
  }

  state.jobs[jobId] = { id: jobId, bountyId, subtasks, status: 'running', createdAt: new Date().toISOString() };
  res.json({ jobId, assignments, subtasks });
});

app.post('/api/coordinate', async (req, res) => {
  const { bountyId } = req.body;
  if (!bountyId) return res.status(400).json({ error: 'bountyId required' });

  try {
    const response = await fetch(`${BOUNTY_API}/bounties`);
    const bounties = await response.json();
    const bounty = bounties.find(b => b.id === String(bountyId));
    if (!bounty) return res.status(404).json({ error: 'Bounty not found' });

    log('info', `Coordinating bounty #${bountyId}`);
    const subtasks = decomposeBounty(bounty);
    const jobId = `job_${Date.now()}`;
    const assignments = [];

    for (const task of subtasks) {
      const agentId = assignAgent(task);
      if (agentId) {
        state.agents[agentId].status = 'busy';
        state.agents[agentId].currentTask = task.id;
        task.assignedTo = agentId;
        task.status = 'assigned';
        assignments.push({ taskId: task.id, taskName: task.name, agentId });
        log('success', `Assigned "${task.name}" to ${agentId}`, jobId);
      }
    }

    state.jobs[jobId] = { id: jobId, bountyId, subtasks, status: 'running', createdAt: new Date().toISOString() };

    res.json({
      bounty: { id: bounty.id, title: bounty.title, reward: parseFloat(bounty.reward) / 1e6 },
      jobId,
      assignments,
      subtasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/complete', (req, res) => {
  const { jobId, taskId } = req.body;
  const job = state.jobs[jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const task = job.subtasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = 'completed';
  if (task.assignedTo && state.agents[task.assignedTo]) {
    state.agents[task.assignedTo].status = 'online';
    state.agents[task.assignedTo].currentTask = null;
  }

  log('success', `Task "${task.name}" completed`, jobId);

  if (job.subtasks.every(t => t.status === 'completed')) {
    job.status = 'completed';
    log('success', `Job ${jobId} fully completed!`, jobId);
  }

  res.json({ task, jobStatus: job.status });
});

// Start
app.listen(PORT, () => {
  console.log(`🐝 SWARM Coordinator running on http://localhost:${PORT}`);
  log('info', 'SWARM started');
});
