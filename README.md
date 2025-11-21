# Roll Call 📋  
_A QR Code Based Attendance System for Achievers University_

## 📖 Overview
Roll Call is a simple web app that helps manage student attendance using **QR codes**.  
- **Students** generate their unique QR codes with their matric number and name.  
- **Lecturers** scan these QR codes to mark attendance during class.  

The project is built with **vanilla JavaScript**, **HTML**, and **CSS**, and uses free, open-source libraries via CDN.

---

## ✨ Features
- 🎓 **Student QR Generator**: Each student generates a QR code tied to their matric number + name.  
- 👨‍🏫 **Lecturer QR Scanner**: Lecturers scan student codes directly from their browser using the device camera.  
- 🔗 **One Deployment**: Both student and lecturer pages are hosted together, with a landing page for easy navigation.  
- 🌐 **Lightweight & Free**: No backend, no premium frameworks — just front-end code and free libraries.  

---

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS, JavaScript  
- **QR Code Generator**: [`qrcode.js`](https://github.com/soldair/node-qrcode) via CDN  
- **QR Code Scanner**: [`html5-qrcode`](https://github.com/mebjas/html5-qrcode) via CDN  
- **Hosting**: Vercel

---

## 📂 Project Structure
Roll-call/
├── index.html # Landing page (choose Student or Lecturer)
├── student-id.html # Student QR generator page
├── lecturer-scan.html # Lecturer QR scanner page
├── style.css # Shared styling
├── script.js # Core JS logic
└── README.md # Project documentation

---

## 🚀 How to Use
1. Open the [Roll Call app](https://roll-call-three.vercel.app/).  
2. On the landing page:  
   - Click **"I am a Student"** → go to Student page.  
   - Click **"I am a Lecturer"** → go to Lecturer page.  
3. **Students**: Enter your matric number + name → generate your unique QR code.  
4. **Lecturers**: Use the camera scanner to read student QR codes → attendance is logged in real-time.  

---

## 🎯 Future Improvements
- 🔒 Add a backend (Node.js, Firebase, etc.) to store attendance logs.  
- 📊 Generate attendance reports (download as CSV/Excel).  
- 📱 Mobile optimization for smoother use on phones.  
- 🎨 Improve UI/UX for even cleaner presentation.  

---

## 🙌 Credits
- Achievers University inspiration 🏫  
- Libraries: `qrcode.js`, `html5-qrcode`  
- Developed by Japheth Obaloluwa Egbedele
