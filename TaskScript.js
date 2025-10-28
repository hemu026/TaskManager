/* ===========
   Reminders + Browser Notifications
   =========== */
let remindersShownFor = new Set();

// Ask permission once when app loads
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission().then(result => {
    console.log("Notification permission:", result);
  });
}

function showNotification(title, message) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: message, icon: "https://cdn-icons-png.flaticon.com/512/907/907717.png" });
  } else {
    // fallback to in-app toast
    showToast(message);
  }
}

function checkRemindersOnce(){
  const today = todayStart();
  tasks.forEach(t => {
    if (t.completed) return;
    const key = t.id || (t.title + "|" + t.dueDate);
    if (remindersShownFor.has(key)) return;

    const diff = daysDiff(t.dueDate);

    if (diff === 0) {
      const msg = `"${t.title}" is due TODAY`;
      showToast(`🔔 ${msg}`);
      showNotification("Task Reminder", msg);
      remindersShownFor.add(key);
    } 
    else if (diff === 1) {
      const msg = `"${t.title}" is due TOMORROW`;
      showToast(`⚠️ ${msg}`);
      showNotification("Upcoming Task Reminder", msg);
      remindersShownFor.add(key);
    }
  });
}
