document.addEventListener('DOMContentLoaded', function() {
    
    // --- Core SPA Navigation Function ---
    const pages = document.querySelectorAll(".page");
    function showPage(id){
        pages.forEach(p => p.classList.remove("active"));
        const targetPage = document.getElementById(id);
        if (targetPage) {
            targetPage.classList.add("active");
        }
    }

    // --- Navigation Handlers ---

    // 1. Landing (startBtn) -> Lecturer Scan (#scan)
    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
        startBtn.onclick = () => showPage("scan");
    }

    // --- Simulated Lecturer Verification (On #scan page load) ---
    if (document.getElementById("scan")) {
        const scanVideo = document.getElementById("scanVideo");
        
        if (scanVideo) { 
            // Simulated Success: Verification happens after 3 seconds
            setTimeout(() => {
                const lecturerStatus = document.getElementById("lecturerStatus");
                if (lecturerStatus) {
                    lecturerStatus.innerHTML = '<span style="color: green; font-weight: bold;"><i class="bx bx-check-circle"></i> Verification Successful: Dr. Jane Doe</span>';
                    
                    // Transition to the main student scanning dashboard (#attendance) after 2 seconds
                    setTimeout(() => {
                        showPage("attendance");
                    }, 2000); 
                }
            }, 3000);
        }
    }

    // 2. End Session Button -> End Scan Verification
    const endSessionBtn = document.getElementById("endSessionBtn");
    if (endSessionBtn) {
        // Navigates to the end-of-session verification page
        endSessionBtn.onclick = () => showPage("endScan"); 
    }
    
    // --- Simulated End Session Verification (On #endScan page load) ---
    if (document.getElementById("endScan")) {
        const endScanVideo = document.getElementById("endScanVideo");
        
        if (endScanVideo) { 
            // Simulated Success: Verification happens after 3 seconds
            setTimeout(() => {
                const endScanStatus = document.getElementById("endScanStatus");
                if (endScanStatus) {
                    // Update status to show save message
                    endScanStatus.innerHTML = '<span style="color: green; font-weight: bold;"><i class="bx bx-check-circle"></i> Session Log Saved Successfully!</span>';
                    
                    // Transition back to Landing after successful save message is shown
                    setTimeout(() => {
                        showPage("landing"); 
                    }, 2000); // 2-second pause to read the success message
                }
            }, 3000);
        }
    }
    
    // 3. Generic Back Buttons (Using data-target attribute)
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
                clearInterval(interval);
            }
        }, 2000);
    }
});