document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('priorityContainer');
  const username = localStorage.getItem('loggedInUser');
  if (!username) return window.location.href = 'login.html';

  document.getElementById('usernameDisplay').innerText = username;

  document.querySelectorAll('.nav-middle li').forEach(link => {
    const text = link.textContent.trim();
    if (text === "Sign Up" || text === "Log In") link.style.display = 'none';
  });

  fetch(`/gettasks?username=${username}`)
    .then(res => res.json())
    .then(tasks => {
      const filtered = tasks.filter(t => t.priority && !t.done);
      filtered.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
      filtered.forEach(task => renderCard(task));
    });

  function renderCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card priority';
    if (new Date(task.endTime) < new Date()) card.classList.add('overdue');

    card.innerHTML = `
      <h3>${task.taskName}</h3>
      <div><strong>Start:</strong> ${new Date(task.startTime).toLocaleString()}</div>
      <div><strong>End:</strong> ${new Date(task.endTime).toLocaleString()}</div>
      <div><strong>Priority:</strong> Yes</div>
      <input type="checkbox" class="done"> Done
    `;

    card.querySelector('.done').addEventListener('change', async () => {
      await fetch('/deletetask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, taskName: task.taskName })
      });
      card.classList.add('fade-out');
      setTimeout(() => card.remove(), 500);
    });

    container.appendChild(card);
  }
});
