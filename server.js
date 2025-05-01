const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static('public'));

const USERS_FILE = path.join(__dirname, 'users.json');

// Helper function to read users
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

// Helper function to write users
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index2.html'));
});

// Sign up
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  let users = readUsers();

  const existing = users.find(user => user.username === username);
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }

  users.push({ username, password, tasks: [] });
  writeUsers(users);
  res.json({ message: 'Signup successful' });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get Tasks
app.get('/gettasks', (req, res) => {
  const { username } = req.query;
  const users = readUsers();

  const user = users.find(u => u.username === username);
  if (user) {
    res.json(user.tasks);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Add Task
app.post('/addtask', (req, res) => {
  const { username, taskName, startTime, endTime, priority } = req.body;
  let users = readUsers();

  const user = users.find(u => u.username === username);
  if (user) {
    user.tasks.push({ taskName, startTime, endTime, priority });
    writeUsers(users);
    res.json({ message: 'Task added' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Delete Task
app.post('/deletetask', (req, res) => {
  const { username, taskName } = req.body;
  let users = readUsers();

  const user = users.find(u => u.username === username);
  if (user) {
    user.tasks = user.tasks.filter(task => task.taskName !== taskName);
    writeUsers(users);
    res.json({ message: 'Task deleted' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Reschedule Task (with updated priority)
app.post('/rescheduletask', (req, res) => {
  const { username, taskName, startTime, endTime, priority } = req.body;
  let users = readUsers();

  const user = users.find(u => u.username === username);
  if (user) {
    const task = user.tasks.find(t => t.taskName === taskName);
    if (task) {
      task.startTime = startTime;
      task.endTime = endTime;
      task.priority = priority;
      writeUsers(users);
      res.json({ message: 'Task rescheduled' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
