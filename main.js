// Nav scroll state
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Mobile nav toggle
const toggle = document.querySelector('.nav-mobile-toggle');
const navLinks = document.querySelector('.nav-links');
toggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));

// =============================================
// MULTI-STEP INTAKE FORM
// =============================================

const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

const overlay = document.getElementById('intakeOverlay');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');

const STEP_COUNT = 4;
const progressMap = { 1: 25, 2: 50, 3: 75, 4: 100, success: 100 };

function openForm() {
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  goToStep(1);
}

function closeForm() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function goToStep(num) {
  document.querySelectorAll('.intake-step').forEach(s => s.classList.remove('active'));

  const isSuccess = num === 'success';
  const targetId = isSuccess ? 'stepSuccess' : 'step' + num;
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  const intakeProgress = document.getElementById('intakeProgress');
  if (isSuccess) {
    intakeProgress.style.display = 'none';
  } else {
    intakeProgress.style.display = 'flex';
    progressFill.style.width = progressMap[num] + '%';
    progressLabel.textContent = 'STEP ' + num + ' OF ' + STEP_COUNT;
  }

  const modal = document.querySelector('.intake-modal');
  if (modal) modal.scrollTop = 0;
}

function validateStep(num) {
  clearErrors();

  if (num === 1) {
    const firstName = document.getElementById('firstName').value.trim();
    const businessName = document.getElementById('businessName').value.trim();
    const industry = document.getElementById('industry').value;
    let valid = true;
    if (!firstName) { showError('firstName', 'Please enter your first name.'); valid = false; }
    if (!businessName) { showError('businessName', 'Please enter your business name.'); valid = false; }
    if (!industry) { showError('industry', 'Please select your industry.'); valid = false; }
    return valid;
  }

  if (num === 2) {
    const checked = document.querySelectorAll('input[name="bottleneck"]:checked');
    if (checked.length === 0) {
      showError('checkboxGroup', 'Please select at least one option.');
      return false;
    }
    return true;
  }

  if (num === 3) { return true; }

  if (num === 4) {
    const email = document.getElementById('email').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('email', 'Please enter a valid email address.');
      return false;
    }
    return true;
  }

  return true;
}

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) {
    const group = document.querySelector('.checkbox-group');
    if (group) {
      let err = group.nextElementSibling;
      if (!err || !err.classList.contains('form-error')) {
        err = document.createElement('p');
        err.className = 'form-error';
        group.after(err);
      }
      err.textContent = message;
      err.classList.add('visible');
    }
    return;
  }
  let err = field.parentElement.querySelector('.form-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'form-error';
    field.after(err);
  }
  err.textContent = message;
  err.classList.add('visible');
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(e => {
    e.classList.remove('visible');
    e.textContent = '';
  });
}

function collectFormData() {
  const bottlenecks = Array.from(
    document.querySelectorAll('input[name="bottleneck"]:checked')
  ).map(cb => cb.value).join(', ');

  const nextStep = document.querySelector('input[name="nextStep"]:checked');

  return {
    firstName: document.getElementById('firstName').value.trim(),
    businessName: document.getElementById('businessName').value.trim(),
    industry: document.getElementById('industry').value,
    bottlenecks,
    currentProcess: document.getElementById('currentProcess').value.trim(),
    teamSize: document.getElementById('teamSize').value,
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    nextStep: nextStep ? nextStep.value : '',
    _subject: 'New Wicket AI intake submission',
  };
}

async function submitForm() {
  if (!validateStep(4)) return;

  const submitBtn = document.getElementById('submitForm');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const data = collectFormData();

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      goToStep('success');
    } else {
      const json = await res.json().catch(() => ({}));
      const msg = (json.errors && json.errors[0] && json.errors[0].message) || 'Something went wrong. Please try again.';
      showError('email', msg);
    }
  } catch (err) {
    showError('email', 'Could not send. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit <span>→</span>';
  }
}

document.querySelectorAll('.js-open-form').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    openForm();
  });
});

document.querySelectorAll('.intake-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const current = parseInt(btn.closest('.intake-step').id.replace('step', ''));
    if (validateStep(current)) goToStep(parseInt(btn.dataset.next));
  });
});

document.querySelectorAll('.intake-back').forEach(btn => {
  btn.addEventListener('click', () => {
    goToStep(parseInt(btn.dataset.back));
  });
});

document.getElementById('submitForm').addEventListener('click', submitForm);
document.getElementById('intakeClose').addEventListener('click', closeForm);
document.getElementById('closeSuccess').addEventListener('click', closeForm);

overlay.addEventListener('click', e => {
  if (e.target === overlay) closeForm();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeForm();
});
