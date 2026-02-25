// ============================================
//  MEDICAL APPOINTMENT CENTER — script.js
//  All logic is here: auth, storage, appointments.
//  No backend, no framework — just localStorage.
// ============================================

// ─────────────────────────────────────────
//  STORAGE HELPERS
//  Thin wrappers around localStorage so we
//  don't repeat JSON.parse/stringify everywhere.
// ─────────────────────────────────────────

const Storage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  // Returns all users array, or empty array
  getUsers() { return this.get('mac_users') || []; },
  // Returns all appointments array, or empty array
  getAppointments() { return this.get('mac_appointments') || []; },
  // Returns current logged-in user object, or null
  getSession() { return this.get('mac_session'); },
  setSession(user) { this.set('mac_session', user); },
  clearSession() { localStorage.removeItem('mac_session'); }
};

// ─────────────────────────────────────────
//  AUTH HELPERS
// ─────────────────────────────────────────

const Auth = {
  // Find user by email
  findUser(email) {
    return Storage.getUsers().find(u => u.email === email.toLowerCase().trim());
  },

  // Register a new user; returns {ok, error}
  register(data) {
    const users = Storage.getUsers();
    if (users.find(u => u.email === data.email.toLowerCase().trim())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const user = { ...data, email: data.email.toLowerCase().trim(), id: Date.now().toString() };
    users.push(user);
    Storage.set('mac_users', users);
    return { ok: true, user };
  },

  // Login; returns {ok, user, error}
  login(email, password) {
    const user = this.findUser(email);
    if (!user) return { ok: false, error: 'No account found with this email.' };
    if (user.password !== password) return { ok: false, error: 'Incorrect password.' };
    return { ok: true, user };
  }
};

// ─────────────────────────────────────────
//  APPOINTMENT HELPERS
// ─────────────────────────────────────────

const Appointments = {
  // All appointments for a specific doctor
  forDoctor(doctorId) {
    return Storage.getAppointments().filter(a => a.doctorId === doctorId);
  },

  // All appointments for a specific patient
  forPatient(patientId) {
    return Storage.getAppointments().filter(a => a.patientId === patientId);
  },

  // Book a new appointment for a patient with a doctor
  book(doctor, patient) {
    // Check if patient already has an appointment with this doctor
    const existing = Storage.getAppointments().find(
      a => a.doctorId === doctor.id && a.patientId === patient.id
    );
    if (existing) return { ok: false, error: 'You already have an appointment with this doctor.' };

    const appts = Storage.getAppointments();
    // Count existing appointments for this doctor to assign serial number
    const doctorAppts = appts.filter(a => a.doctorId === doctor.id);
    const serial = doctorAppts.length + 1;

    // Calculate appointment time based on serial number
    // Assume each appointment is 15 minutes, starting from doctor's start time
    const appointmentTime = this.calcTime(doctor.startTime, serial - 1);

    const appt = {
      id: Date.now().toString(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      chamber: doctor.chamber,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone || 'N/A',
      serial,
      time: appointmentTime,
      bookedAt: new Date().toLocaleString()
    };

    appts.push(appt);
    Storage.set('mac_appointments', appts);
    return { ok: true, appt };
  },

  // Calculate appointment time: start time + (slotIndex * 15 minutes)
  calcTime(startTime, slotIndex) {
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + slotIndex * 15;
    const hours = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    // Return formatted as 12h time, e.g. "10:30 AM"
    const period = hours < 12 ? 'AM' : 'PM';
    const h12 = hours % 12 || 12;
    return `${h12}:${String(mins).padStart(2, '0')} ${period}`;
  },

  // Update appointment time (doctor can edit)
  updateTime(apptId, newTime) {
    const appts = Storage.getAppointments();
    const idx = appts.findIndex(a => a.id === apptId);
    if (idx === -1) return false;
    appts[idx].time = newTime;
    Storage.set('mac_appointments', appts);
    return true;
  },

  // Remove an appointment (doctor can remove)
  remove(apptId) {
    let appts = Storage.getAppointments();
    appts = appts.filter(a => a.id !== apptId);
    Storage.set('mac_appointments', appts);
    // Re-number serials for affected doctor
    this.renumber();
  },

  // After a removal, re-number serials sequentially per doctor
  renumber() {
    const appts = Storage.getAppointments();
    // Group by doctor
    const byDoctor = {};
    appts.forEach(a => {
      if (!byDoctor[a.doctorId]) byDoctor[a.doctorId] = [];
      byDoctor[a.doctorId].push(a);
    });
    const updated = [];
    // Find doctor start time from users
    const users = Storage.getUsers();
    Object.keys(byDoctor).forEach(doctorId => {
      const doctor = users.find(u => u.id === doctorId);
      byDoctor[doctorId].forEach((appt, i) => {
        appt.serial = i + 1;
        if (doctor) appt.time = this.calcTime(doctor.startTime, i);
        updated.push(appt);
      });
    });
    Storage.set('mac_appointments', updated);
  }
};

// ─────────────────────────────────────────
//  UI HELPERS — used across pages
// ─────────────────────────────────────────

// Show an alert box with a message
function showAlert(el, message, type = 'error') {
  el.className = `alert alert-${type} show`;
  el.textContent = message;
}

// Validate that no field in a form is empty
function validateForm(formEl) {
  const inputs = formEl.querySelectorAll('input[required], select[required]');
  for (const input of inputs) {
    if (!input.value.trim()) {
      input.focus();
      return false;
    }
  }
  return true;
}

// Redirect helper
function go(page) { window.location.href = page; }

// Logout: clear session and go to landing page
function logout() {
  Storage.clearSession();
  go('index.html');
}

// Guard: if not logged in, redirect to login
function requireAuth() {
  const session = Storage.getSession();
  if (!session) { go('login.html'); return null; }
  return session;
}

// Guard: if already logged in, redirect to dashboard
function redirectIfLoggedIn() {
  const session = Storage.getSession();
  if (session) go('dashboard.html');
}

// ─────────────────────────────────────────
//  PAGE: INDEX (landing)
// ─────────────────────────────────────────
function initIndex() {
  // If already logged in, go straight to dashboard
  const session = Storage.getSession();
  if (session) go('dashboard.html');
}

// ─────────────────────────────────────────
//  PAGE: SIGNUP
// ─────────────────────────────────────────
function initSignup() {
  redirectIfLoggedIn();

  const roleInputs = document.querySelectorAll('input[name="role"]');
  const doctorFields = document.getElementById('doctor-fields');
  const patientFields = document.getElementById('patient-fields');
  const form = document.getElementById('signup-form');
  const alertEl = document.getElementById('alert');

  // Show/hide role-specific fields when role changes
  roleInputs.forEach(input => {
    input.addEventListener('change', () => {
      if (input.value === 'doctor') {
        doctorFields.style.display = 'block';
        patientFields.style.display = 'none';
        // Make doctor fields required, remove patient required
        toggleRequired(doctorFields, true);
        toggleRequired(patientFields, false);
      } else {
        doctorFields.style.display = 'none';
        patientFields.style.display = 'block';
        toggleRequired(doctorFields, false);
        toggleRequired(patientFields, true);
      }
    });
  });

  // Trigger change on page load for default selected role (patient)
  document.querySelector('input[name="role"]:checked').dispatchEvent(new Event('change'));

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Validate all visible required fields
    if (!validateForm(form)) {
      showAlert(alertEl, 'Please fill in all required fields.');
      return;
    }

    const role = document.querySelector('input[name="role"]:checked').value;
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirm-password').value;

    if (password !== confirm) {
      showAlert(alertEl, 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      showAlert(alertEl, 'Password must be at least 6 characters.');
      return;
    }

    // Build user object based on role
    const base = {
      role,
      name:     document.getElementById('name').value.trim(),
      email:    document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    };

    const userData = role === 'doctor'
      ? { ...base,
          specialization: document.getElementById('specialization').value.trim(),
          chamber:        document.getElementById('chamber').value.trim(),
          startTime:      document.getElementById('start-time').value,
          endTime:        document.getElementById('end-time').value
        }
      : { ...base,
          age:   document.getElementById('age').value.trim(),
          phone: document.getElementById('phone').value.trim()
        };

    const result = Auth.register(userData);
    if (!result.ok) {
      showAlert(alertEl, result.error);
      return;
    }

    // Auto-login after signup
    Storage.setSession(result.user);
    go('dashboard.html');
  });
}

// Helper to toggle required attribute on inputs inside a container
function toggleRequired(container, required) {
  container.querySelectorAll('input, select').forEach(el => {
    if (required) el.setAttribute('required', '');
    else el.removeAttribute('required');
  });
}

// ─────────────────────────────────────────
//  PAGE: LOGIN
// ─────────────────────────────────────────
function initLogin() {
  redirectIfLoggedIn();

  const form    = document.getElementById('login-form');
  const alertEl = document.getElementById('alert');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm(form)) {
      showAlert(alertEl, 'Please fill in all fields.');
      return;
    }

    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const result   = Auth.login(email, password);

    if (!result.ok) {
      showAlert(alertEl, result.error);
      return;
    }

    Storage.setSession(result.user);
    go('dashboard.html');
  });
}

// ─────────────────────────────────────────
//  PAGE: DASHBOARD
// ─────────────────────────────────────────
function initDashboard() {
  const user = requireAuth();
  if (!user) return;

  // Set user name in navbar
  const nameEl = document.getElementById('nav-user-name');
  if (nameEl) nameEl.textContent = user.name;

  // Set welcome message
  const welcomeEl = document.getElementById('welcome-name');
  if (welcomeEl) welcomeEl.textContent = user.name.split(' ')[0];

  // Route to correct dashboard
  if (user.role === 'doctor') {
    renderDoctorDashboard(user);
  } else {
    renderPatientDashboard(user);
  }
}

// ── PATIENT DASHBOARD ──
function renderPatientDashboard(patient) {
  // Show patient section, hide doctor section
  document.getElementById('patient-section').style.display = 'block';
  document.getElementById('doctor-section').style.display  = 'none';

  // Update role badge
  const roleEl = document.getElementById('role-badge');
  if (roleEl) { roleEl.textContent = 'Patient'; roleEl.className = 'text-muted'; }

  renderDoctorList(patient);
  renderPatientAppointments(patient);
}

// Show all available doctors
function renderDoctorList(patient) {
  const users   = Storage.getUsers();
  const doctors = users.filter(u => u.role === 'doctor');
  const grid    = document.getElementById('doctor-grid');

  if (!grid) return;

  if (doctors.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🏥</div>
        <p>No doctors registered yet. Check back later.</p>
      </div>`;
    return;
  }

  grid.innerHTML = doctors.map(doc => {
    // Check if patient already booked this doctor
    const alreadyBooked = Storage.getAppointments().find(
      a => a.doctorId === doc.id && a.patientId === patient.id
    );
    const btnHtml = alreadyBooked
      ? `<button class="btn btn-outline btn-full" disabled style="opacity:0.5;cursor:not-allowed">Already Booked</button>`
      : `<button class="btn btn-primary btn-full" onclick="bookAppointment('${doc.id}')">Book Appointment</button>`;

    return `
      <div class="doctor-card">
        <span class="specialization">${escHtml(doc.specialization)}</span>
        <h3>Dr. ${escHtml(doc.name)}</h3>
        <div class="info-line">🏥 ${escHtml(doc.chamber)}</div>
        <div class="info-line">🕐 ${escHtml(doc.startTime)} – ${escHtml(doc.endTime)}</div>
        ${btnHtml}
      </div>`;
  }).join('');
}

// Show patient's booked appointments
function renderPatientAppointments(patient) {
  const appts = Appointments.forPatient(patient.id);
  const list  = document.getElementById('patient-appointments');
  const countEl = document.getElementById('appt-count');

  if (countEl) countEl.textContent = appts.length;

  if (!list) return;

  if (appts.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>You have no appointments yet. Book one above!</p>
      </div>`;
    return;
  }

  list.innerHTML = appts.map(a => `
    <div class="appointment-item">
      <div class="appt-info">
        <h3>Dr. ${escHtml(a.doctorName)} — ${escHtml(a.specialization)}</h3>
        <div class="appt-meta">
          <span>🏥 ${escHtml(a.chamber)}</span>
          <span>🕐 ${escHtml(a.time)}</span>
          <span>📅 Booked: ${escHtml(a.bookedAt)}</span>
        </div>
      </div>
      <div class="serial-badge">#${a.serial}</div>
    </div>
  `).join('');
}

// Book appointment (called from button in doctor card)
function bookAppointment(doctorId) {
  const patient = Storage.getSession();
  const doctor  = Storage.getUsers().find(u => u.id === doctorId);
  if (!doctor || !patient) return;

  const result = Appointments.book(doctor, patient);
  if (!result.ok) {
    alert(result.error); // simple browser alert for quick feedback
    return;
  }

  // Show confirmation modal
  document.getElementById('modal-serial').textContent  = result.appt.serial;
  document.getElementById('modal-time').textContent    = result.appt.time;
  document.getElementById('modal-doctor').textContent  = 'Dr. ' + result.appt.doctorName;
  document.getElementById('modal-chamber').textContent = result.appt.chamber;
  document.getElementById('booking-modal').classList.add('open');

  // Refresh lists
  renderDoctorList(patient);
  renderPatientAppointments(patient);
}

// Close booking modal
function closeModal() {
  document.getElementById('booking-modal').classList.remove('open');
}

// ── DOCTOR DASHBOARD ──
function renderDoctorDashboard(doctor) {
  document.getElementById('doctor-section').style.display  = 'block';
  document.getElementById('patient-section').style.display = 'none';

  const roleEl = document.getElementById('role-badge');
  if (roleEl) { roleEl.textContent = 'Doctor'; roleEl.className = 'text-muted'; }

  renderPatientList(doctor);
}

// Show doctor's patient list
function renderPatientList(doctor) {
  const appts    = Appointments.forDoctor(doctor.id);
  const container = document.getElementById('patient-list-container');
  const countEl  = document.getElementById('patient-count');

  if (countEl) countEl.textContent = appts.length;

  if (!container) return;

  if (appts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <p>No patients booked yet.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="card" style="padding:0; overflow:hidden;">
      <table class="patient-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Patient Name</th>
            <th>Phone</th>
            <th>Appointment Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${appts.map(a => `
            <tr id="row-${a.id}">
              <td><div class="serial-badge" style="width:32px;height:32px;font-size:0.8rem;">${a.serial}</div></td>
              <td>${escHtml(a.patientName)}</td>
              <td>${escHtml(a.patientPhone)}</td>
              <td>
                <div class="time-edit">
                  <input type="time" id="time-${a.id}" value="${to24h(a.time)}" style="width:120px;">
                  <button class="btn btn-sm btn-outline" onclick="updateTime('${a.id}', '${doctor.id}')">Save</button>
                </div>
              </td>
              <td>
                <button class="btn btn-danger" onclick="removePatient('${a.id}', '${doctor.id}')">Remove</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

// Doctor: update appointment time
function updateTime(apptId, doctorId) {
  const input = document.getElementById(`time-${apptId}`);
  if (!input || !input.value) return;
  // Convert 24h to 12h display
  const time12 = to12h(input.value);
  Appointments.updateTime(apptId, time12);
  alert('Appointment time updated.');
  renderPatientList({ id: doctorId });
}

// Doctor: remove a patient
function removePatient(apptId, doctorId) {
  if (!confirm('Remove this patient from your list?')) return;
  Appointments.remove(apptId);
  renderPatientList({ id: doctorId });
}

// ─────────────────────────────────────────
//  TIME FORMAT HELPERS
// ─────────────────────────────────────────

// Convert "10:30 AM" → "10:30" (for <input type="time">)
function to24h(time12) {
  if (!time12 || time12.includes(':') && !time12.includes('AM') && !time12.includes('PM')) return time12;
  const [time, period] = time12.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// Convert "10:30" → "10:30 AM"
function to12h(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${period}`;
}

// ─────────────────────────────────────────
//  SECURITY HELPER
//  Escape HTML to prevent XSS when inserting
//  user-supplied data into innerHTML.
// ─────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
