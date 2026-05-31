// DOM REFERENCES
const loginPage    = document.getElementById("loginPage");
const createPage   = document.getElementById("createPage");
const dashboard    = document.getElementById("dashboard");
const video        = document.getElementById("video");
const canvas       = document.getElementById("overlay");
const studentsGrid = document.getElementById("studentsGrid");

let stream            = null;
let detectionInterval = null;

// FIX: Fixed student count — not random every tick
// Teacher sets this via the input; defaults to 5
let fixedStudentCount = 5;

/* ─── LOGIN ─────────────────────────────────────────── */

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  // FIX: Input validation — no empty login
  if (!user || !pass) {
    alert("Please enter both username and password.");
    return;
  }

  const savedUser = localStorage.getItem("user");
  const savedPass = localStorage.getItem("pass");

  if (user === savedUser && pass === savedPass) {
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
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

  // FIX: Input validation — no empty account creation
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
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // FIX: Wait for video metadata so canvas can match dimensions
    video.addEventListener("loadedmetadata", () => {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    startDetection();
  } catch (err) {
    alert("Camera Access Denied. Please allow camera permission.");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    stream = null;
  }
  stopDetection();
}

/* ─── LOGOUT ─────────────────────────────────────────── */

function logout() {
  stopCamera();
  dashboard.classList.add("hidden");
  loginPage.classList.remove("hidden");

  // Clear inputs on logout
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

/* ─── SET STUDENT COUNT ──────────────────────────────── */
// FIX: Teacher manually sets class size — count stays stable between ticks

function setStudentCount() {
  const input = parseInt(document.getElementById("studentCountInput").value);
  if (isNaN(input) || input < 1 || input > 50) {
    alert("Please enter a valid student count between 1 and 50.");
    return;
  }
  fixedStudentCount = input;
  document.getElementById("students").innerText = fixedStudentCount;
}

/* ─── MENU / SECTION NAVIGATION ─────────────────────── */
// FIX: Active sidebar item highlighted; camera section shows video on navigate

function showSection(sectionId, clickedItem) {
  // Hide all sections
  const sections = ["homeSection", "cameraSection", "studentsSection", "analysisSection"];
  sections.forEach(id => document.getElementById(id).classList.add("hidden"));

  // Show chosen section
  document.getElementById(sectionId).classList.remove("hidden");

  // FIX: Remove active from all nav items and set on clicked
  document.querySelectorAll(".nav-item").forEach(li => li.classList.remove("active"));
  if (clickedItem) clickedItem.classList.add("active");
}

/* ─── DETECTION LOOP ─────────────────────────────────── */

const emotions = ["Happy", "Focused", "Neutral", "Sleepy", "Confused"];

function startDetection() {
  // Clear any old interval before starting a new one
  stopDetection();

  // FIX: Show student count immediately on start
  document.getElementById("students").innerText = fixedStudentCount;

  detectionInterval = setInterval(() => {
    runDetectionTick();
  }, 3000);

  // Also run once immediately
  runDetectionTick();
}

function stopDetection() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
}

function runDetectionTick() {
  // FIX: Use fixed student count, not random
  const studentCount = fixedStudentCount;

  // Update header count card
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

    // FIX: Added visual attention bar inside each student card
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

  /* AVERAGE ATTENTION */
  const avg = Math.floor(totalAttention / studentCount);
  document.getElementById("avgAttention").innerText = avg + "%";

  /* DOMINANT EMOTION */
  const dominantEmotion = Object.keys(emotionCounter)
    .reduce((a, b) => emotionCounter[a] > emotionCounter[b] ? a : b);
  document.getElementById("mainEmotion").innerText = dominantEmotion;

  /* QUICK ANALYSIS */
  let analysis = "";
  if (avg > 75) {
    analysis = "✅ Class attention level is HIGH. Students are focused.";
  } else if (avg > 50) {
    analysis = "⚠️ Class attention level is MODERATE. Some students are distracted.";
  } else {
    analysis = "🔴 Class attention level is LOW. Teacher interaction required.";
  }
  document.getElementById("analysisText").innerText = analysis;

  /* CANVAS OVERLAY — draw simple face boxes for visual feedback */
  drawOverlay(studentCount);
}

/* ─── CANVAS OVERLAY ─────────────────────────────────── */
// FIX: Canvas is now sized correctly and draws simulated face boxes

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
