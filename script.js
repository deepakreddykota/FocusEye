// DOM REFERENCES
const loginPage    = document.getElementById("loginPage");
const createPage   = document.getElementById("createPage");
const dashboard    = document.getElementById("dashboard");
const video        = document.getElementById("video");
const canvas       = document.getElementById("overlay");
const studentsGrid = document.getElementById("studentsGrid");

let stream            = null;
let detectionInterval = null;
let fixedStudentCount = 5;
let cameraActive      = true;

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  renderRegistry();
  checkSavedSession();
});

// AUTO LOGIN PERSISTENCE
function checkSavedSession() {
  const rememberToken = localStorage.getItem("rememberToken");
  const savedUser = localStorage.getItem("savedUser");
  if (rememberToken === "true" && savedUser) {
    document.getElementById("username").value = savedUser;
    // Autogenerate password field locally for security simulation
    document.getElementById("password").value = "********";
    document.getElementById("rememberMe").checked = true;
    
    // Simulate login transitions
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    document.getElementById("headerTeacherName").innerText = `Welcome, ${savedUser}`;
    startCamera();
  }
}

/* ─── LOGIN ─────────────────────────────────────────── */
function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!user || !pass) {
    alert("Please enter both username and password.");
    return;
  }

  // Demo user creation helper
  if (!localStorage.getItem("user")) {
    localStorage.setItem("user", user);
    localStorage.setItem("pass", pass);
  }

  const savedUser = localStorage.getItem("user");
  const savedPass = localStorage.getItem("pass");

  if (user === savedUser && (pass === savedPass || pass === "********")) {
    if (document.getElementById("rememberMe").checked) {
      localStorage.setItem("rememberToken", "true");
      localStorage.setItem("savedUser", user);
    } else {
      localStorage.removeItem("rememberToken");
      localStorage.removeItem("savedUser");
    }

    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    document.getElementById("headerTeacherName").innerText = `Welcome, ${user}`;
    startCamera();
  } else {
    alert("Invalid Login");
  }
}

/* ─── CREATE ACCOUNT ─────────────────────────────────── */
function showCreate() {
  loginPage.classList.add("hidden");
  createPage.classList.remove("hidden");
}

function backLogin() {
  createPage.classList.add("hidden");
  loginPage.classList.remove("hidden");
}

function createAccount() {
  const user = document.getElementById("newUser").value.trim();
  const pass = document.getElementById("newPass").value.trim();

  if (!user || !pass) {
    alert("Username and password cannot be empty.");
    return;
  }

  localStorage.setItem("user", user);
  localStorage.setItem("pass", pass);
  alert("Account Created Successfully");
  backLogin();
}

/* ─── CAMERA ─────────────────────────────────────────── */
async function startCamera() {
  if (!cameraActive) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
    });
  } catch (err) {
    console.warn("Camera Access Denied. Running dashboard in simulation mode.");
  }
  startDetection();
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    stream = null;
  }
  stopDetection();
}

function toggleCameraPower() {
  const btn = document.getElementById("cameraToggleBtn");
  if (cameraActive) {
    stopCamera();
    cameraActive = false;
    btn.innerText = "🔴 CAMERA OFF";
    btn.className = "form-btn toggle-inactive";
  } else {
    cameraActive = true;
    startCamera();
    btn.innerText = "🟢 CAMERA ON";
    btn.className = "form-btn toggle-active";
  }
}

/* ─── LOGOUT ─────────────────────────────────────────── */
function logout() {
  stopCamera();
  localStorage.removeItem("rememberToken");
  dashboard.classList.add("hidden");
  loginPage.classList.remove("hidden");
  
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("rememberMe").checked = false;
}

/* ─── AI AUTOMATIC STUDENT DETECTION ─────────────────── */
function rescanStudents() {
  const statusEl = document.getElementById("detectionStatus");
  statusEl.innerText = "Scanning classroom...";
  statusEl.style.color = "#00ffcc";

  setTimeout(() => {
    const detectedCount = Math.floor(Math.random() * 7) + 4; // 4 to 10
    fixedStudentCount = detectedCount;
    document.getElementById("students").innerText = fixedStudentCount;
    statusEl.innerText = `Active (${fixedStudentCount} detected)`;
    
    runDetectionTick();
  }, 1000);
}

/* ─── MENU / SECTION NAVIGATION ─────────────────────── */
function showSection(sectionId, clickedItem) {
  const sections = [
    "homeSection", "attentionSection", "cameraSection", "cameraControlSection",
    "occupancySection", "registrySection", "studentsSection", "emotionsSection",
    "gazeSection", "aiInsightsSection", "alertsSection", "analysisSection",
    "notesSection", "schedulerSection", "leaderboardSection", "historySection",
    "settingsSection", "helpSection", "logoutViewSection"
  ];
  
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const activeEl = document.getElementById(sectionId);
  if (activeEl) activeEl.classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(li => li.classList.remove("active"));
  if (clickedItem) clickedItem.classList.add("active");

  // Run page-specific layout triggers immediately on navigation
  if (sectionId === "gazeSection") {
    drawGazeMap();
  }
}

/* ─── DETECTION LOOP & DATA SIMULATIONS ─────────────── */
const emotions = ["Happy", "Focused", "Neutral", "Sleepy", "Confused"];

function startDetection() {
  stopDetection();

  fixedStudentCount = Math.floor(Math.random() * 7) + 4; // 4 to 10
  document.getElementById("students").innerText = fixedStudentCount;

  const statusEl = document.getElementById("detectionStatus");
  if (statusEl) {
    statusEl.innerText = `Active (${fixedStudentCount} detected)`;
  }

  detectionInterval = setInterval(() => {
    runDetectionTick();
  }, 3000);

  runDetectionTick();
}

function stopDetection() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
}

function runDetectionTick() {
  const studentCount = fixedStudentCount;
  document.getElementById("students").innerText = studentCount;

  studentsGrid.innerHTML = "";
  let totalAttention  = 0;
  const emotionCounter = {};

  for (let i = 1; i <= studentCount; i++) {
    const emotion    = emotions[Math.floor(Math.random() * emotions.length)];
    const attention  = Math.floor(Math.random() * 100);

    totalAttention += attention;
    emotionCounter[emotion] = (emotionCounter[emotion] || 0) + 1;

    const status      = attention > 70 ? "✅ Attentive" : "⚠️ Distracted";
    const statusColor = attention > 70 ? "#00ffcc" : "#ff4444";

    studentsGrid.innerHTML += `
      <div class="student-card">
        <h3>Student ${i}</h3>
        <p>Emotion: ${emotion}</p>
        <p>Attention: ${attention}%</p>
        <div class="attention-bar-bg">
          <div class="attention-bar-fill" style="width:${attention}%"></div>
        </div>
        <p style="margin-top:8px; color:${statusColor}">Status: ${status}</p>
      </div>
    `;
  }

  const avg = studentCount > 0 ? Math.floor(totalAttention / studentCount) : 0;
  document.getElementById("avgAttention").innerText = avg + "%";

  const dominantEmotion = Object.keys(emotionCounter).length > 0 
    ? Object.keys(emotionCounter).reduce((a, b) => emotionCounter[a] > emotionCounter[b] ? a : b)
    : "---";
  document.getElementById("mainEmotion").innerText = dominantEmotion;

  let analysis = "";
  if (avg > 75) {
    analysis = "✅ Class attention level is HIGH. Students are focused.";
  } else if (avg > 50) {
    analysis = "⚠️ Class attention level is MODERATE. Some students are distracted.";
  } else {
    analysis = "🔴 Class attention level is LOW. Teacher interaction required.";
  }
  document.getElementById("analysisText").innerText = analysis;

  // Draw face overlays on camera canvas
  drawOverlay(studentCount);

  // Update dynamic views
  renderOccupancyMap(studentCount);
  renderEmotions(emotionCounter, studentCount);
  renderAIInsights(avg);
  renderLeaderboard(studentCount);
  updateAttentionGauge(avg);
  logAttentionTimeline(avg, dominantEmotion);
  checkFocusAlertThreshold(avg);
  drawGazeMap();
}

/* ─── CANVAS OVERLAY ─────────────────────────────────── */
function drawOverlay(count) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (canvas.width === 0 || canvas.height === 0) return;

  const cols   = Math.ceil(Math.sqrt(count));
  const cellW  = canvas.width  / cols;
  const cellH  = canvas.height / Math.ceil(count / cols);

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x   = col * cellW + cellW * 0.25;
    const y   = row * cellH + cellH * 0.15;
    const w   = cellW * 0.5;
    const h   = cellH * 0.65;

    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth   = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#00ffcc";
    ctx.font      = "14px Arial";
    ctx.fillText(`S${i + 1}`, x + 4, y - 4);
  }
}

/* ─── PAGE SIMULATION UPDATES ───────────────────────── */

// ATTENTION TIMELINE
function logAttentionTimeline(avg, emotion) {
  const timeline = document.getElementById("attentionTimeline");
  if (!timeline) return;
  const time = new Date().toLocaleTimeString();
  const li = document.createElement("li");
  li.innerText = `[${time}] Engagement: ${avg}%, Emotion: ${emotion}`;
  
  timeline.insertBefore(li, timeline.firstChild);
  if (timeline.children.length > 6) {
    timeline.removeChild(timeline.lastChild);
  }
}

// ATTENTION GAUGE
function updateAttentionGauge(avg) {
  const gaugeFill = document.getElementById("attentionGaugeFill");
  const gaugeVal = document.getElementById("attentionGaugeValue");
  if (gaugeFill && gaugeVal) {
    const deg = (avg / 100 * 180) - 90;
    gaugeFill.style.transform = `rotate(${deg}deg)`;
    gaugeVal.innerText = `${avg}%`;
  }
}

// SEAT OCCUPANCY MAP
function renderOccupancyMap(studentCount) {
  const grid = document.getElementById("seatMapGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const totalSeats = 20; // 5x4 Grid layout
  for (let i = 1; i <= totalSeats; i++) {
    const seat = document.createElement("div");
    if (i <= studentCount) {
      seat.className = "seat occupied";
      seat.innerText = `Seat ${i}\n(S${i})`;
    } else {
      seat.className = "seat empty";
      seat.innerText = `Seat ${i}\nEmpty`;
    }
    grid.appendChild(seat);
  }
}

// STUDENT REGISTRY
let registryList = [
  { seat: 1, name: "Alice Jenkins" },
  { seat: 2, name: "Bob Harrison" },
  { seat: 3, name: "Charlie Smith" },
  { seat: 4, name: "David Miller" },
  { seat: 5, name: "Eva Carter" }
];

function renderRegistry() {
  const tableBody = document.getElementById("registryTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  registryList.sort((a, b) => a.seat - b.seat);
  registryList.forEach(student => {
    tableBody.innerHTML += `
      <tr>
        <td>Desk ${student.seat}</td>
        <td>${student.name}</td>
        <td><button class="remove-btn" onclick="removeStudent(${student.seat})">Remove</button></td>
      </tr>
    `;
  });
}

function registerStudent() {
  const name = document.getElementById("regStudentName").value.trim();
  const seat = parseInt(document.getElementById("regStudentSeat").value);
  if (!name || isNaN(seat) || seat < 1) {
    alert("Please enter a valid student name and desk position.");
    return;
  }
  if (registryList.some(s => s.seat === seat)) {
    alert("This seat position is already occupied.");
    return;
  }
  registryList.push({ seat, name });
  document.getElementById("regStudentName").value = "";
  document.getElementById("regStudentSeat").value = "";
  renderRegistry();
}

function removeStudent(seat) {
  registryList = registryList.filter(s => s.seat !== seat);
  renderRegistry();
}

// EMOTION HISTOGRAM
function renderEmotions(counter, total) {
  const container = document.getElementById("emotionsDistribution");
  if (!container) return;
  container.innerHTML = "";
  emotions.forEach(emotion => {
    const count = counter[emotion] || 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    container.innerHTML += `
      <div class="emotion-row">
        <div class="emotion-label">${emotion}</div>
        <div class="emotion-bar-bg">
          <div class="emotion-bar-fill" style="width:${percent}%"></div>
        </div>
        <div class="emotion-percent">${percent}%</div>
      </div>
    `;
  });
}

// EYE GAZE HEATMAP CANVAS
function drawGazeMap() {
  const canvasGaze = document.getElementById("gazeTrackerCanvas");
  if (!canvasGaze) return;
  const ctx = canvasGaze.getContext("2d");
  ctx.clearRect(0, 0, canvasGaze.width, canvasGaze.height);

  // Draw simulated screen area
  ctx.strokeStyle = "#12263a";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, canvasGaze.width - 20, canvasGaze.height - 20);

  // Calculate random gaze coordinates
  const x = Math.random() * (canvasGaze.width - 60) + 30;
  const y = Math.random() * (canvasGaze.height - 60) + 30;

  // Draw Gaze pointer circle
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(0, 255, 204, 0.5)";
  ctx.fill();
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw focus percentages
  const boardFocus = Math.floor(Math.random() * 30) + 65; // 65-95%
  document.getElementById("blackboardFocusText").innerText = `${boardFocus}%`;
  document.getElementById("deviceFocusText").innerText = `${100 - boardFocus}%`;
}

// AI INSIGHTS
function renderAIInsights(avg) {
  const list = document.getElementById("aiInsightsList");
  if (!list) return;
  list.innerHTML = "";
  let insights = [];
  if (avg > 75) {
    insights = [
      { icon: "💡", title: "Focus Levels Excellent", desc: "Attention is very high. Maintain the current lecturing speed." },
      { icon: "📈", title: "Apply Challenge", desc: "Perfect window to introduce complex tasks or self-evaluation quizzes." }
    ];
  } else if (avg > 50) {
    insights = [
      { icon: "🚨", title: "Interactive Trigger Needed", desc: "Attention is drifting. Consider launching an active polling session." },
      { icon: "🧘", title: "Stretching Interval", desc: "Sleepy emotion classifications detected. Introduce a 1-minute stretch check." }
    ];
  } else {
    insights = [
      { icon: "🛑", title: "Low Focus Warning", desc: "Classroom engagement level has dropped below critical minimum." },
      { icon: "🎯", title: "Engagement Shift Required", desc: "High distraction levels detected. Shift to group activities or interactive maps." }
    ];
  }
  insights.forEach(item => {
    list.innerHTML += `
      <div class="insight-card">
        <span class="insight-icon">${item.icon}</span>
        <div class="insight-content">
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
        </div>
      </div>
    `;
  });
}

// THRESHOLD ALERTS
let alertThreshold = 65;
function updateThreshold(val) {
  alertThreshold = parseInt(val);
  document.getElementById("thresholdVal").innerText = `${alertThreshold}%`;
}

function checkFocusAlertThreshold(avg) {
  if (avg < alertThreshold && document.getElementById("soundAlertCheckbox")?.checked) {
    console.warn(`[Alert] Engagement level (${avg}%) dropped below threshold (${alertThreshold}%)!`);
  }
}

function triggerSimulatedAlert() {
  alert(`🚨 Distraction Alert! Classroom engagement level has dropped below your set threshold of ${alertThreshold}%!`);
}

// TEACHER NOTES
let teacherNotes = [];
function addTeacherNote() {
  const noteInput = document.getElementById("teacherNoteInput");
  const text = noteInput.value.trim();
  if (!text) return;
  teacherNotes.unshift({
    time: new Date().toLocaleTimeString(),
    text: text
  });
  noteInput.value = "";
  renderNotes();
}

function renderNotes() {
  const list = document.getElementById("teacherNotesList");
  if (!list) return;
  list.innerHTML = "";
  teacherNotes.forEach(note => {
    list.innerHTML += `
      <li>
        <span class="note-time">${note.time}</span>
        <p>${note.text}</p>
      </li>
    `;
  });
}

// TIMER SCHEDULER
let schedulerTimer = null;
let schedulerSecondsLeft = 0;

function toggleSchedulerTimer() {
  const btn = document.getElementById("schedulerStartBtn");
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    btn.innerText = "▶️ Start Session";
    logSchedulerEvent("Lecture session paused manually.");
  } else {
    if (schedulerSecondsLeft <= 0) {
      const mins = parseInt(document.getElementById("schedulerMinutesInput").value);
      if (isNaN(mins) || mins < 1) return;
      schedulerSecondsLeft = mins * 60;
    }
    btn.innerText = "⏸️ Pause Session";
    logSchedulerEvent(`Session started: ${Math.floor(schedulerSecondsLeft / 60)} minutes remaining.`);
    schedulerTimer = setInterval(() => {
      if (schedulerSecondsLeft <= 0) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
        btn.innerText = "▶️ Start Session";
        logSchedulerEvent("Session completed.");
        alert("⏰ Classroom Lecture Timer Finished!");
        return;
      }
      schedulerSecondsLeft--;
      updateSchedulerTimerDisplay();
    }, 1000);
  }
}

function updateSchedulerTimerDisplay() {
  const m = Math.floor(schedulerSecondsLeft / 60).toString().padStart(2, "0");
  const s = (schedulerSecondsLeft % 60).toString().padStart(2, "0");
  document.getElementById("schedulerTimerDisplay").innerText = `${m}:${s}`;
}

function logSchedulerEvent(msg) {
  const logEl = document.getElementById("schedulerLog");
  if (!logEl) return;
  const time = new Date().toLocaleTimeString();
  logEl.innerHTML += `<div>[${time}] ${msg}</div>`;
  logEl.scrollTop = logEl.scrollHeight;
}

// ATTENTION LEADERBOARD
function renderLeaderboard(studentCount) {
  const list = document.getElementById("leaderboardList");
  if (!list) return;
  list.innerHTML = "";
  const leaders = [];
  for (let i = 1; i <= studentCount; i++) {
    leaders.push({
      name: `Student ${i}`,
      score: Math.floor(Math.random() * 30) + 70 // 70 to 100%
    });
  }
  leaders.sort((a, b) => b.score - a.score);
  leaders.forEach((student, index) => {
    const rank = index + 1;
    let rankClass = "";
    if (rank === 1) rankClass = "rank-1";
    else if (rank === 2) rankClass = "rank-2";
    else if (rank === 3) rankClass = "rank-3";
    list.innerHTML += `
      <div class="leader-item ${rankClass}">
        <span class="leader-name">#${rank} ${student.name}</span>
        <span class="leader-score">${student.score}% Attention</span>
      </div>
    `;
  });
}

// GENERAL SETTINGS SAVE
function saveGeneralSettings() {
  const school = document.getElementById("settingsSchoolName").value.trim();
  alert(`Settings saved successfully!\nSchool name updated to: ${school}`);
}
