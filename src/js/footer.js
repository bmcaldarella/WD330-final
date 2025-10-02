document.querySelector('#year')?.append(new Date().getFullYear());
const nl = document.getElementById('newsletter');
nl?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = new FormData(nl).get('email')?.toString().trim();
  const msg = document.getElementById('nl-msg');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = 'Please enter a valid email.'; return;
  }
  msg.textContent = 'Thanks! Check your inbox to confirm.';
  nl.reset();
});
