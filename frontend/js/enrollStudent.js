 const video = document.getElementById('video');
        const captureBtn = document.getElementById('captureBtn');
        const messageEl = document.getElementById('message');

        // Access webcam
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { video.srcObject = stream; })
            .catch(err => { messageEl.textContent = 'Camera access denied'; messageEl.style.color = "red"; });

        // Capture frame and send to backend
        captureBtn.addEventListener('click', async () => {
            const name = document.getElementById('name').value.trim();
            const matric_no = document.getElementById('matric_no').value.trim();
            if (!name || !matric_no) {
                messageEl.textContent = "Fill all fields";
                messageEl.style.color = "red";
                return;
            }

            // Make sure video has loaded
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                messageEl.textContent = "Video not ready. Try again.";
                messageEl.style.color = "red";
                return;
            }

            // Draw video frame to canvas
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('name', name);
                formData.append('matric_no', matric_no);
                formData.append('file', blob, 'capture.jpg');

                messageEl.textContent = "Uploading...";
                messageEl.style.color = "black";

                try {
                    const res = await fetch("http://localhost:8000/students/enroll", {
                        method: "POST",
                        body: formData
                    });

                    const result = await res.json();

                    if (result.student_id) {
                        messageEl.textContent = `Success! Student ID: ${result.student_id}`;
                        messageEl.style.color = "green";

                        // Clear inputs
                        document.getElementById('name').value = "";
                        document.getElementById('matric_no').value = "";
                    } else if (result.error) {
                        messageEl.textContent = `Error: ${result.error}`;
                        messageEl.style.color = "red";
                    } else {
                        messageEl.textContent = "Unknown response from server";
                        messageEl.style.color = "red";
                    }

                } catch (err) {
                    messageEl.textContent = `Error: ${err.message}`;
                    messageEl.style.color = "red";
                }
            }, 'image/jpeg', 0.95);
        });