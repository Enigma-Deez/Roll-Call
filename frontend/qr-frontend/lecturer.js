let attendance = [];

function onScanSuccess(decodedText, decodedResult) {
  let [matric, name] = decodedText.split("|");
  let time = new Date().toLocaleString();

  // Prevent duplicate scans
  if (attendance.some(entry => entry.matric === matric)) {
    document.getElementById("attendanceTable").insertAdjacentHTML(
      "beforeend",
      `<tr><td colspan="3" style="color:red;">Duplicate scan for ${matric}</td></tr>`
    );
    return;
  }

  let entry = { matric, name, time };
  attendance.push(entry);

  document.getElementById("attendanceTable").insertAdjacentHTML(
    "beforeend",
    `<tr><td>${matric}</td><td>${name}</td><td>${time}</td></tr>`
  );
}

function onScanFailure(error) {
  console.warn(`Scan error: ${error}`);
}

let html5QrcodeScanner = new Html5QrcodeScanner("reader", {
  fps: 10,
  qrbox: 250
});
html5QrcodeScanner.render(onScanSuccess, onScanFailure);

function exportCSV() {
  let sessionName = document.getElementById("sessionName").value.trim();
  if (!sessionName) sessionName = "attendance";

  let csv = "Matric Number,Name,Time\n";
  attendance.forEach(entry => {
    csv += `${entry.matric},${entry.name},${entry.time}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = sessionName + ".csv";
  link.click();
}

