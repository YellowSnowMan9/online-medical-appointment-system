# 🏥 Online Medical Appointment Center

A simple, fully client-side web app for booking medical appointments.
Built with plain HTML, CSS, and Vanilla JavaScript — no backend, no frameworks, no build tools.

---

## 📁 Folder Structure

```
medical-appointment/
├── index.html       ← Landing page (Login / Sign Up)
├── login.html       ← Login page
├── signup.html      ← Sign up page (Doctor or Patient)
├── dashboard.html   ← Dashboard (auto-detects Doctor or Patient)
├── style.css        ← All styles
├── script.js        ← All JavaScript logic
└── README.md        ← This file
```

---

## 🚀 Run on Localhost

### Option 1 — Just open the file (simplest)
Double-click `index.html` and it opens in your browser. Done.

> ⚠️ Some browsers block localStorage when opening files directly (`file://`).
> If that happens, use one of the options below.

### Option 2 — Python (no install needed, comes with macOS/Linux)
```bash
# Navigate to the project folder
cd medical-appointment

# Python 3
python3 -m http.server 8000

# Then open your browser and go to:
# http://localhost:8000
```

### Option 3 — Node.js (if you have Node installed)
```bash
# Install a simple static server globally (one-time)
npm install -g serve

# Run it from the project folder
serve .

# Then open: http://localhost:3000
```

### Option 4 — VS Code Live Server
Install the **Live Server** extension in VS Code, then right-click `index.html` → **Open with Live Server**.

---

## ☁️ Deploy to GitHub Pages

### Step 1 — Create a GitHub repository
1. Go to [github.com](https://github.com) and create a new repository (e.g. `medical-appointment`)
2. Make it **Public**

### Step 2 — Push your code
```bash
# In your project folder:
git init
git add .
git commit -m "Initial commit: Medical Appointment Center"

# Connect to your GitHub repo (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/medical-appointment.git
git branch -M main
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Open your repo on GitHub
2. Go to **Settings** → **Pages**
3. Under **Source**, select `main` branch and `/ (root)` folder
4. Click **Save**
5. Your site will be live at:
   `https://YOUR_USERNAME.github.io/medical-appointment/`

---

## 💾 How Data is Stored

All data is stored in **localStorage** (your browser's built-in key-value storage).

| Key               | Contents                          |
|-------------------|-----------------------------------|
| `mac_users`       | Array of all registered users     |
| `mac_appointments`| Array of all booked appointments  |
| `mac_session`     | Currently logged-in user object   |

> Data is stored **only in your browser**. It does not sync between devices or browsers.
> Clearing browser data / cookies will erase all data.

---

## 👤 How to Use

### As a Patient
1. Sign up as **Patient** with your name, email, password, age, and phone
2. Login → you'll see the **Patient Dashboard**
3. Browse available doctors and click **Book Appointment**
4. A serial number and time slot are assigned automatically (every 15 minutes)
5. View your booked appointments below the doctor list

### As a Doctor
1. Sign up as **Doctor** with your specialization, chamber, and available hours
2. Login → you'll see the **Doctor Dashboard**
3. View all booked patients with their serial number and appointment time
4. Adjust any patient's appointment time using the time input
5. Remove a patient from your list if needed

---

## 🛠 Tech Stack

| Tech           | Purpose                    |
|----------------|----------------------------|
| HTML5          | Structure                  |
| CSS3           | Styling (no frameworks)    |
| Vanilla JS     | Logic & interactivity      |
| localStorage   | Client-side data storage   |
| Google Fonts   | Typography (Lora + Mulish) |

---

## 📝 Notes for Beginners

- All the JavaScript logic is in `script.js` — it's heavily commented, read through it!
- CSS variables are in `:root` in `style.css` — easy to change colors/fonts from one place
- The app has zero dependencies — no npm, no build step, just open and use
- `escHtml()` in script.js prevents XSS by sanitizing user input before inserting into the page

---

## 📄 License
Free to use and modify for personal or educational purposes.
