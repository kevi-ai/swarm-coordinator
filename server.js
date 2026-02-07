/**
 * SWARM Coordinator API
 * Multi-agent coordination service for bounty hunting
 * 
 * @author kevi-ai
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const BOUNTY_API = 'https://bounty.owockibot.xyz';

// In-memory state (would use DB in production)
const state = {
  agents: {
    'ALPHA-01': { name: 'ALPHA-01', skills: ['frontend', 'typescript', 'react', 'css'], status: 'online', currentTask: null },
    'BETA-02': { name: 'BETA-02', skills: ['backend', 'python', 'node', 'api'], status: 'online', currentTask: null },
    'GAMMA-03': { name: 'GAMMA-03', skills: ['blockchain', 'solidity', 'web3'], status: 'online', currentTask: null },
    'DELTA-04': { name: 'DELTA-04', skills: ['design', 'content', 'docs', 'testing'], status: 'online', currentTask: null },
  },
  jobs: {},
  logs: []
};

// Utility: fetch JSON
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Log event
function log(type, message, jobId = null) {
  const entry = { time: new Date().toISOString(), type, message, jobId };
  state.logs.push(entry);
  if (state.logs.length > 100) state.logs.shift();
  console.log(`[${type.toUpperCase()}] ${message}`);
  return entry;
}

// Skill matching score
function skillMatch(agentSkills, requiredSkills) {
  const matched = agentSkills.filter(s => requiredSkills.some(r => r.includes(s) || s.includes(r)));
  return matched.length / Math.max(requiredSkills.length, 1);
}

// Decompose bounty into subtasks
function decomposeBounty(bounty) {
  const tags = bounty.tags || [];
  const desc = (bounty.description || '').toLowerCase();
  
  const subtasks = [];
  
  // Frontend tasks
  if (tags.some(t => ['frontend', 'ui', 'dashboard', 'widget'].includes(t)) || desc.includes('frontend') || desc.includes('ui')) {
    subtasks.push({ id: 1, name: 'UI/Frontend Development', skills: ['frontend', 'react', 'css'], status: 'pending', progress: 0 });
  }
  
  // Backend tasks
  if (tags.some(t => ['backend', 'api', 'server'].includes(t)) || desc.includes('api') || desc.includes('backend')) {
    subtasks.push({ id: 2, name: 'API/Backend Development', skills: ['backend', 'node', 'api'], status: 'pending', progress: 0 });
  }
  
  // Blockchain tasks
  if (tags.some(t => ['blockchain', 'web3', 'contract', 'onchain'].includes(t)) || desc.includes('contract') || desc.includes('blockchain')) {
    subtasks.push({ id: 3, name: 'Smart Contract/Web3', skills: ['blockchain', 'solidity'], status: 'pending', progress: 0 });
  }
  
  // Always add docs/testing
  subtasks.push({ id: subtasks.length + 1, name: 'Documentation & Testing', skills: ['docs', 'testing'], status: 'pending', progress: 0 });
  
  // If no specific tasks detected, add generic coding task
  if (subtasks.length === 1) {
    subtasks.unshift({ id: 1, name: 'Core Implementation', skills: ['coding'], status: 'pending', progress: 0 });
  }
  
  return subtasks;
}

// Assign best agent for a task
function assignAgent(task) {
  let bestAgent = null;
  let bestScore = 0;
  
  for (const [id, agent] of Object.entries(state.agents)) {
    if (agent.status === 'offline' || agent.currentTask) continue;
    
    const score = skillMatch(agent.skills, task.skills);
    if (score > bestScore) {
      bestScore = score;
      bestAgent = id;
    }
  }
  
  return bestAgent;
}

// API Handlers
const handlers = {
  // GET /api/agents - List all agents
  'GET /api/agents': () => {
    return { agents: Object.values(state.agents) };
  },
  
  // GET /api/agents/:id - Get agent details
  'GET /api/agent': (params) => {
    const agent = state.agents[params.id];
    if (!agent) return { error: 'Agent not found', status: 404 };
    return { agent };
  },
  
  // POST /api/decompose - Decompose a bounty into subtasks
  'POST /api/decompose': async (params, body) => {
    const { bountyId } = body;
    if (!bountyId) return { error: 'bountyId required', status: 400 };
    
    log('info', `Fetching bounty #${bountyId}...`);
    
    try {
      const bounties = await fetchJSON(`${BOUNTY_API}/bounties`);
      const bounty = bounties.find(b => b.id === bountyId || b.id === String(bountyId));
      
      if (!bounty) return { error: 'Bounty not found', status: 404 };
      
      log('info', `Decomposing: "${bounty.title}"`);
      const subtasks = decomposeBounty(bounty);
      
      log('success', `Created ${subtasks.length} subtasks`);
      
      return {
        bounty: {
          id: bounty.id,
          title: bounty.title,
          reward: parseFloat(bounty.reward) / 1e6,
          tags: bounty.tags
        },
        subtasks
      };
    } catch (err) {
      log('error', err.message);
      return { error: err.message, status: 500 };
    }
  },
  
  // POST /api/assign - Assign agents to subtasks
  'POST /api/assign': async (params, body) => {
    const { bountyId, subtasks } = body;
    if (!bountyId || !subtasks) return { error: 'bountyId and subtasks required', status: 400 };
    
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
      } else {
        task.status = 'unassigned';
        log('warn', `No available agent for "${task.name}"`, jobId);
      }
    }
    
    state.jobs[jobId] = {
      id: jobId,
      bountyId,
      subtasks,
      status: 'running',
      createdAt: new Date().toISOString()
    };
    
    return { jobId, assignments, subtasks };
  },
  
  // GET /api/jobs/:id - Get job status
  'GET /api/job': (params) => {
    const job = state.jobs[params.id];
    if (!job) return { error: 'Job not found', status: 404 };
    return { job };
  },
  
  // GET /api/jobs - List all jobs
  'GET /api/jobs': () => {
    return { jobs: Object.values(state.jobs) };
  },
  
  // POST /api/coordinate - Full coordination flow (decompose + assign)
  'POST /api/coordinate': async (params, body) => {
    const { bountyId } = body;
    if (!bountyId) return { error: 'bountyId required', status: 400 };
    
    // Decompose
    const decomposeResult = await handlers['POST /api/decompose'](params, body);
    if (decomposeResult.error) return decomposeResult;
    
    // Assign
    const assignResult = await handlers['POST /api/assign'](params, {
      bountyId,
      subtasks: decomposeResult.subtasks
    });
    
    return {
      bounty: decomposeResult.bounty,
      jobId: assignResult.jobId,
      assignments: assignResult.assignments,
      subtasks: assignResult.subtasks
    };
  },
  
  // POST /api/complete - Mark a task as complete
  'POST /api/complete': (params, body) => {
    const { jobId, taskId, result } = body;
    const job = state.jobs[jobId];
    if (!job) return { error: 'Job not found', status: 404 };
    
    const task = job.subtasks.find(t => t.id === taskId);
    if (!task) return { error: 'Task not found', status: 404 };
    
    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date().toISOString();
    
    // Free up agent
    if (task.assignedTo && state.agents[task.assignedTo]) {
      state.agents[task.assignedTo].status = 'online';
      state.agents[task.assignedTo].currentTask = null;
    }
    
    log('success', `Task "${task.name}" completed`, jobId);
    
    // Check if all tasks done
    const allDone = job.subtasks.every(t => t.status === 'completed');
    if (allDone) {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      log('success', `Job ${jobId} fully completed!`, jobId);
    }
    
    return { task, jobStatus: job.status };
  },
  
  // GET /api/logs - Get recent logs
  'GET /api/logs': () => {
    return { logs: state.logs.slice(-50) };
  },
  
  // GET /api/status - System status
  'GET /api/status': () => {
    const onlineAgents = Object.values(state.agents).filter(a => a.status !== 'offline').length;
    const activeJobs = Object.values(state.jobs).filter(j => j.status === 'running').length;
    return {
      systemStatus: 'operational',
      agents: { total: Object.keys(state.agents).length, online: onlineAgents },
      jobs: { total: Object.keys(state.jobs).length, active: activeJobs },
      uptime: process.uptime()
    };
  }
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const params = Object.fromEntries(url.searchParams);
  
  // Extract ID from path like /api/agents/ALPHA-01
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length === 3) {
    params.id = pathParts[2];
  }
  
  // Build handler key
  const basePath = '/' + pathParts.slice(0, 2).join('/');
  const handlerKey = `${req.method} ${basePath}`;
  
  // Get body for POST
  let body = {};
  if (req.method === 'POST') {
    body = await new Promise(resolve => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({}); }
      });
    });
  }
  
  // Find handler
  const handler = handlers[handlerKey];
  if (!handler) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', path, method: req.method }));
    return;
  }
  
  try {
    const result = await handler(params, body);
    const status = result.status || 200;
    delete result.status;
    res.writeHead(status);
    res.end(JSON.stringify(result, null, 2));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     🐝 SWARM Coordinator API v1.0                  ║
║     Running on http://localhost:${PORT}              ║
╠═══════════════════════════════════════════════════╣
║  Endpoints:                                        ║
║    GET  /api/status     - System status           ║
║    GET  /api/agents     - List agents             ║
║    GET  /api/jobs       - List jobs               ║
║    POST /api/decompose  - Decompose bounty        ║
║    POST /api/assign     - Assign agents           ║
║    POST /api/coordinate - Full flow               ║
║    POST /api/complete   - Mark task done          ║
║    GET  /api/logs       - Recent logs             ║
╚═══════════════════════════════════════════════════╝
  `);
  log('info', 'SWARM Coordinator started');
  log('info', `${Object.keys(state.agents).length} agents registered`);
});
