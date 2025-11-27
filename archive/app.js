const landing = document.getElementById('landing');
const createSession = document.getElementById('createSession');
const login = document.getElementById('login');
const dashboard = document.getElementById('dashboard');
const fullDashboard = document.getElementById('fullDashboard');

document.getElementById('startBtn').onclick = () => {
  landing.style.display = 'none';
  createSession.style.display = 'block';
};

document.getElementById('nextToLogin').onclick = () => {
  createSession.style.display = 'none';
  login.style.display = 'block';
  startCamera('camera');
};

document.getElementById('loginBtn').onclick = () => {
  // Here you can integrate facial recognition logic
  login.style.display = 'none';
  dashboard.style.display = 'block';
  startCamera('scanCamera');
};

document.getElementById('viewNames').onclick = () => {
  dashboard.style.display = 'none';
  fullDashboard.style.display = 'block';
};

document.getElementById('backToMain').onclick = () => {
  fullDashboard.style.display = 'none';
  dashboard.style.display = 'block';
};

// Function to start webcam
function startCamera(videoId) {
  const video = document.getElementById(videoId);
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error("Camera error: ", err));
}
