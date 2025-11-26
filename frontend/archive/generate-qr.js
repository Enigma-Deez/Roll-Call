async function requestQr() {
    const matric = document.getElementById("matric").value.trim();
    const sessionId = document.getElementById("sessionId").value.trim();

    const res = await fetch("http://localhost:5000/api/qr/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matric, sessionId })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);

    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, { text: JSON.stringify(data.qrData), width: 200, height: 200 });
}
