function generateStudentQR() {
  let matric = document.getElementById("matric").value.trim();
  let name = document.getElementById("name").value.trim();
  let qrContainer = document.getElementById("qrcode");
  qrContainer.innerHTML = ""; // clear old QR

  if (!matric || !name) {
    alert("Please enter both Matric Number and Full Name");
    return;
  }

  let studentData = matric + "|" + name;

  let qr = new QRCode(qrContainer, {
    text: studentData,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  // Automatically download QR as image
  setTimeout(() => {
    let qrImg = qrContainer.querySelector("img");
    if (qrImg) {
      let link = document.createElement("a");
      link.href = qrImg.src;
      link.download = matric + "_QR.png";
      link.click();
    }
  }, 500);
}
