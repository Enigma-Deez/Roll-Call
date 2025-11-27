async function verifyQr() {
    let qrInput = document.getElementById("qrInput").value.trim();
    if (!qrInput) return alert("Paste QR JSON");

    try {
        const qrData = JSON.parse(qrInput);
        const res = await fetch("http://localhost:5000/api/qr/verify-qr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(qrData)
        });
        const data = await res.json();
        document.getElementById("result").innerText = data.success ? "Attendance recorded!" : data.error;
    } catch (err) {
        alert("Invalid QR format");
    }
}
//Frontend Retry Implementation
let retryCount = 0;
const MAX_RETRIES = 3;

async function verifyQR(qrData) {
  const data = JSON.parse(qrData);

  const res = await fetch('/api/qr/verify-qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  if (result.success) {
    alert(result.message);
    retryCount = 0; // reset retries
  } else {
    retryCount++;
    alert('QR scan failed: ' + result.error);
    if (retryCount < MAX_RETRIES) {
      alert(`Retry attempt ${retryCount} of ${MAX_RETRIES}`);
      // allow another scan attempt
    } else {
      alert('Maximum retries reached. Please contact lecturer.');
      retryCount = 0; // reset
    }
  }
}
