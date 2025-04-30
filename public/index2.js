
document.addEventListener('DOMContentLoaded', () => {
  const addTaskButton = document.getElementById('addTaskButton');
  const taskModal = document.getElementById('taskModal');
  const closeModal = document.getElementById('closeModal');
  const taskForm = document.getElementById('taskForm');
  const taskContainer = document.getElementById('taskContainer');
  const userMenu = document.getElementById('userMenu');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const userDropdown = document.getElementById('userDropdown');
  const logoutBtn = document.getElementById('logoutBtn');

  const rescheduleModal = document.getElementById('rescheduleModal');
  const closeRescheduleModal = document.getElementById('closeRescheduleModal');
  const rescheduleForm = document.getElementById('rescheduleForm');
  const rescheduleTaskName = document.getElementById('rescheduleTaskName');
  const rescheduleStartDate = document.getElementById('rescheduleStartDate');
  const rescheduleStartTime = document.getElementById('rescheduleStartTime');
  const rescheduleEndDate = document.getElementById('rescheduleEndDate');
  const rescheduleEndTime = document.getElementById('rescheduleEndTime');
  const rescheduleOption = document.getElementById('rescheduleOption');
  const toast = document.getElementById('toast');

  let overdueTasks = [];
  const loggedInUser = localStorage.getItem('loggedInUser');
  const needsRescheduleCheck = localStorage.getItem('needsRescheduleCheck') === 'true';

  if (!loggedInUser) {
    window.location.href = 'login.html';
    return;
  }

  usernameDisplay.innerText = loggedInUser;

  document.querySelectorAll('.nav-middle li').forEach(link => {
    const linkText = link.textContent.trim();
    if (linkText === "Sign Up" || linkText === "Log In") {
      link.style.display = 'none';
    }
  });

  const toastMessage = localStorage.getItem('showToast');
  if (toastMessage) {
    showToast(toastMessage);
    localStorage.removeItem('showToast');
  }

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
    localStorage.removeItem('needsRescheduleCheck');
    window.location.href = 'login.html';
  });

  fetch(`/gettasks?username=${loggedInUser}`)
    .then(res => res.json())
    .then(tasks => {
      const now = new Date();
      overdueTasks = tasks.filter(task => new Date(task.endTime) < now && !task.done);

      if (overdueTasks.length > 0 && needsRescheduleCheck) {
        localStorage.setItem('needsRescheduleCheck', 'false');
        blockPageForReschedule();
        openNextReschedule();
      } else {
        tasks.forEach(task => {
          displayTaskCard(task);
        });
      }
    })
    .catch(err => console.error('Error fetching tasks:', err));

  function blockPageForReschedule() {
    taskContainer.style.display = 'none';
    addTaskButton.style.display = 'none';
  }

  function unblockPageAfterReschedule() {
    taskContainer.style.display = 'flex';
    addTaskButton.style.display = 'inline-block';
  }

  function openNextReschedule() {
    if (overdueTasks.length > 0) {
      const nextTask = overdueTasks.shift();
      rescheduleTaskName.textContent = "Rescheduling: " + nextTask.taskName;
      rescheduleModal.dataset.taskName = nextTask.taskName;
      rescheduleModal.style.display = 'block';
      rescheduleOption.value = 'another'; // Default to "another day"
      rescheduleOption.dispatchEvent(new Event('change'));
    } else {
      unblockPageAfterReschedule();
      window.location.reload();
    }
  }

  addTaskButton.addEventListener('click', () => {
    taskModal.style.display = 'block';
  });

  closeModal.addEventListener('click', () => {
    taskModal.style.display = 'none';
  });

  closeRescheduleModal.addEventListener('click', () => {
    rescheduleModal.style.display = 'none';
    window.location.reload();
  });

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskName = document.getElementById('taskName').value;
    const startDate = document.getElementById('startDate').value;
    const startTime = document.getElementById('startTime').value;
    const endDate = document.getElementById('endDate').value;
    const endTime = document.getElementById('endTime').value;
    const priority = document.getElementById('priority').checked;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      alert('End date/time must be after start date/time.');
      return;
    }

    const task = {
      username: loggedInUser,
      taskName,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      priority,
      done: false
    };

    const res = await fetch('/addtask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });

    if (res.ok) {
      displayTaskCard(task);
      taskForm.reset();
      taskModal.style.display = 'none';
    } else {
      alert('Error adding task.');
    }
  });

  rescheduleOption.addEventListener('change', () => {
    const today = new Date().toISOString().split('T')[0];
    if (rescheduleOption.value === "today") {
      rescheduleStartDate.value = today;
      rescheduleEndDate.value = today;
      rescheduleStartDate.disabled = true;
      rescheduleEndDate.disabled = true;
    } else {
      rescheduleStartDate.disabled = false;
      rescheduleEndDate.disabled = false;
    }
  });

  rescheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const startDate = rescheduleStartDate.value;
    const startTime = rescheduleStartTime.value;
    const endDate = rescheduleEndDate.value;
    const endTime = rescheduleEndTime.value;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      alert('End date/time must be after start date/time.');
      return;
    }

    const updatedTask = {
  username: loggedInUser,
  taskName: rescheduleModal.dataset.taskName,
  startTime: startDateTime.toISOString(),
  endTime: endDateTime.toISOString(),
  priority: document.getElementById('reschedulePriority').checked
};


    const res = await fetch('/rescheduletask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask)
    });

    if (res.ok) {
      rescheduleModal.style.display = 'none';
      localStorage.setItem('showToast', 'Task Rescheduled!');
      window.location.reload();
    } else {
      alert('Failed to reschedule task.');
    }
  });

  function displayTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';

    if (task.priority) card.classList.add('priority');

    const now = new Date();
    const taskEndTime = new Date(task.endTime);
    const isOverdue = taskEndTime < now;

    if (isOverdue) card.classList.add('overdue');

    card.innerHTML = `
      <h3>${task.taskName}</h3>
      <div><strong>Start:</strong> ${new Date(task.startTime).toLocaleString()}</div>
      <div><strong>End:</strong> ${new Date(task.endTime).toLocaleString()}</div>
      <div><strong>Priority:</strong> ${task.priority ? 'Yes' : 'No'}</div>
      <input type="checkbox" class="done"> Done
      ${isOverdue ? `<button class="reschedule-btn">Reschedule</button>` : ''}
    `;

    const doneCheckbox = card.querySelector('.done');
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

    if (isOverdue) {
      const rescheduleBtn = card.querySelector('.reschedule-btn');
      rescheduleBtn.addEventListener('click', () => {
        rescheduleTaskName.textContent = "Rescheduling: " + task.taskName;
        rescheduleModal.dataset.taskName = task.taskName;
        rescheduleModal.style.display = 'block';
        rescheduleOption.value = 'another';
        rescheduleOption.dispatchEvent(new Event('change'));
      });
    }

    taskContainer.appendChild(card);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.className = "toast show";
    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, 3000);
  }
});
