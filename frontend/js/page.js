// ===========================================
// === 1. GLOBAL WEBCAM UTILITY FUNCTIONS ===
// ===========================================

let verificationTimer;

/**
 * Initializes the webcam stream and assigns it to a video element.
 * @param {string} videoId The ID of the HTML <video> element.
 */
function initWebcam(videoId) {
    const videoElement = document.getElementById(videoId);
    if (!videoElement) return;

    // Stop any currently running streams first
    if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
    }

    // Start the new stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoElement.srcObject = stream;
            console.log(`Webcam started for: #${videoId}`);
        })
        .catch(err => {
            console.error(`Error accessing webcam for #${videoId}:`, err);
            const statusElement = document.getElementById(videoId).closest('.page-content, .camera-panel').querySelector('.feedback, #lecturerStatus, #endScanStatus');
            if (statusElement) {
                statusElement.innerHTML = '<span style="color: red; font-weight: bold;"><i class="bx bx-error-circle"></i> Camera Access Denied or Failed.</span>';
            }
        });
}

/**
 * Stops the webcam stream associated with a video element.
 * @param {string} videoId The ID of the HTML <video> element.
 */
function stopWebcam(videoId) {
    const videoElement = document.getElementById(videoId);
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        console.log(`Webcam stopped for: #${videoId}`);
    }
}


// ==================================================
// === 2. MAIN DOCUMENT LOAD EVENT LISTENER (SPA) ===
// ==================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Core SPA Navigation Function ---
    const pages = document.querySelectorAll(".page");
    
    function showPage(id){
        // 1. Clear any running timers
        clearTimeout(verificationTimer);
        
        // 2. Hide all pages and show the target
        pages.forEach(p => p.classList.remove("active"));
        const targetPage = document.getElementById(id);
        if (targetPage) {
            targetPage.classList.add("active");
        }

        // 3. Webcam Management Logic (Stop/Start)
        // Stop all potentially running webcams first
        stopWebcam("scanVideo");
        stopWebcam("studentScanVideo");
        stopWebcam("endScanVideo");
        stopWebcam("enrollVideo"); // Crucial: Stop enrollment cam when leaving the enroll page

        // Start only the webcam for the *new* active page
        if (id === "scan") {
            initWebcam("scanVideo");
        } else if (id === "attendance") {
            initWebcam("studentScanVideo");
        } else if (id === "endScan") {
            initWebcam("endScanVideo");
        } else if (id === "enroll") {
            // NOTE: We only initialize the webcam here. The enrollment submission is done on the separate file.
            initWebcam("enrollVideo"); 
        }
        
        // 4. Run Page Simulation Logic
        if (id === "scan") {
            const lecturerStatus = document.getElementById("lecturerStatus");
            if (lecturerStatus) {
                lecturerStatus.innerHTML = '<span style="color: blue;"><i class="bx bx-loader-alt bx-spin"></i> Verifying Lecturer...</span>';
            }
            
            // --- Simulated Lecturer Verification: START ---
            verificationTimer = setTimeout(() => {
                if (lecturerStatus) {
                    lecturerStatus.innerHTML = '<span style="color: green; font-weight: bold;"><i class="bx bx-check-circle"></i> Verification Successful: Dr. Jane Doe</span>';
                    
                    // TRANSITION TO ATTENDANCE PAGE
                    setTimeout(() => {
                        showPage("attendance"); 
                    }, 2000); 
                }
            }, 3000);
            // --- Simulated Lecturer Verification: END ---

        } else if (id === "endScan") {
            const endScanStatus = document.getElementById("endScanStatus");
            if (endScanStatus) {
                endScanStatus.innerHTML = '<span style="color: blue;"><i class="bx bx-loader-alt bx-spin"></i> Verifying Lecturer to End Session...</span>';
            }

            // --- Simulated End Session Verification: START ---
            verificationTimer = setTimeout(() => {
                if (endScanStatus) {
                    endScanStatus.innerHTML = '<span style="color: green; font-weight: bold;"><i class="bx bx-check-circle"></i> Verification Complete. Session Log Saved!</span>';
                    
                    // TRANSITION TO LANDING PAGE
                    setTimeout(() => {
                        showPage("landing"); 
                    }, 2000); 
                }
            }, 3000);
            // --- Simulated End Session Verification: END ---
        } else if (id === "enroll") {
            // This button redirects the user to the separate, working enrollment file
            const enrollmentRedirectBtn = document.querySelector('#enroll .card .backBtn:first-child');
            if (enrollmentRedirectBtn) {
                enrollmentRedirectBtn.onclick = () => {
                    window.location.href = "enroll.html";
                };
            }
        }
    } // END showPage function

    // --- Navigation Handlers ---

    // 1. Landing (startBtn) -> Lecturer Scan (#scan)
    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
        startBtn.onclick = () => showPage("scan");
    }

    // 2. New: Landing (enrollNavBtn) -> Enrollment Page (#enroll)
    const enrollNavBtn = document.getElementById("enrollNavBtn");
    if (enrollNavBtn) {
        enrollNavBtn.onclick = () => showPage("enroll");
    }
    
    // 3. End Session Button -> End Scan Verification (#endScan)
    const endSessionBtn = document.getElementById("endSessionBtn");
    if (endSessionBtn) {
        endSessionBtn.onclick = () => showPage("endScan");
    }
    
    // 4. Generic Back Buttons (Using data-target attribute)
    document.querySelectorAll(".backBtn").forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            showPage(btn.dataset.target);
        };
    });

    // --- Light/Dark Mode Toggle ---
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.onclick = () => {
            const body = document.body;
            if (body.classList.contains("light")) {
                body.classList.replace("light", "dark");
                themeToggle.classList.replace("bx-sun", "bx-moon");
            } else {
                body.classList.replace("dark", "light");
                themeToggle.classList.replace("bx-moon", "bx-sun");
            }
        };
    }

    // --- Dummy Attendance Simulation ---
    const attendanceList = document.getElementById("attendanceList");
    if(attendanceList) {
        const dummyAttendees = [
            { name: "Alice Johnson", matric: "U20CS101" },
            { name: "Bob Williams", matric: "U20CS105" },
            { name: "Charlie Brown", matric: "U20CS107" }
        ];

        let count = 0;
        const interval = setInterval(() => {
            // Only run the simulation when the attendance page is active
            if (document.getElementById("attendance").classList.contains("active") && count < dummyAttendees.length) {
                const attendee = dummyAttendees[count];
                const listItem = document.createElement('li');
                listItem.innerHTML = `<i class='bx bx-check-circle' style='color: green;'></i> **${attendee.matric}** (${attendee.name})`;
                attendanceList.appendChild(listItem);
                document.getElementById("attendeeCount").textContent = count + 1;
                count++;
            } else if (count >= dummyAttendees.length) {
                // Keep the interval running but don't add more students
            }
        }, 2000);
    }
});