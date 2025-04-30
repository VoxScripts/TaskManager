document.addEventListener('DOMContentLoaded', () => {
  const unfinishedContainer = document.getElementById('unfinishedContainer');
  const userMenu = document.getElementById('userMenu');
  const userDropdown = document.getElementById('userDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const usernameDisplay = document.getElementById('usernameDisplay');

  const loggedInUser = localStorage.getItem('loggedInUser');

  if (!loggedInUser) {
    window.location.href = 'login.html';
    return;
  }

  usernameDisplay.innerText = loggedInUser;

  document.querySelectorAll('.nav-middle li').forEach(link => {
    const text = link.textContent.trim();
    if (text === "Sign Up" || text === "Log In") {
      link.style.display = 'none';
    }
  });

  userMenu.addEventListener('mouseenter', () => {
    userDropdown.style.display = 'block';
  });
  userMenu.addEventListener('mouseleave', () => {
    setTimeout(() => {
      if (!userDropdown.matches(':hover')) {
        userDropdown.style.display = 'none';
      }
    }, 100);
  });
  userDropdown.addEventListener('mouseleave', () => {
    userDropdown.style.display = 'none';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
  });

  fetch(`/gettasks?username=${loggedInUser}`)
    .then(res => res.json())
    .then(tasks => {
      const now = new Date();
      const unfinishedTasks = tasks.filter(task => new Date(task.endTime) < now);

      if (unfinishedTasks.length === 0) {
        const message = document.createElement('p');
        message.textContent = "No unfinished tasks 🎉";
        unfinishedContainer.appendChild(message);
      } else {
        unfinishedTasks.forEach(task => displayUnfinishedCard(task));
      }
    })
    .catch(err => {
      console.error("Failed to fetch tasks", err);
    });

  function displayUnfinishedCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';

    if (task.priority) card.classList.add('priority');
    card.classList.add('overdue');

    card.innerHTML = `
      <h3>${task.taskName}</h3>
      <div><strong>Start:</strong> ${new Date(task.startTime).toLocaleString()}</div>
      <div><strong>End:</strong> ${new Date(task.endTime).toLocaleString()}</div>
      <div><strong>Priority:</strong> ${task.priority ? 'Yes' : 'No'}</div>
      <input type="checkbox" id="done"> Done
      <button class="reschedule-btn">Reschedule</button>
    `;

    const doneCheckbox = card.querySelector('#done');
    doneCheckbox.addEventListener('change', async () => {
      if (doneCheckbox.checked) {
        const res = await fetch('/deletetask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loggedInUser, taskName: task.taskName })
        });

        if (res.ok) {
          card.classList.add('fade-out');
          setTimeout(() => card.remove(), 500);
        } else {
          alert('Error deleting task.');
        }
      }
    });

    const rescheduleBtn = card.querySelector('.reschedule-btn');
    rescheduleBtn.addEventListener('click', () => {
      localStorage.setItem('rescheduleTask', JSON.stringify(task));
      window.location.href = 'index2.html#reschedule';
    });

    unfinishedContainer.appendChild(card);
  }
});
