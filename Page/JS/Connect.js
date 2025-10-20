/* Connect form behaviors and EmailJS wiring extracted from Connect.html */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS if available
    if (window.emailjs && typeof emailjs.init === 'function') {
        try {
            // Keep placeholder; instruct user to replace with their EmailJS user ID
            emailjs.init('YOUR_EMAILJS_USER_ID');
        } catch (e) {
            // ignore init errors
            console.warn('EmailJS init failed', e);
        }
    }

    const form = document.getElementById('contactForm');
    if (!form) return;
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');
    const status = document.getElementById('formStatus');

    function validateFields() {
        let valid = true;
        if (!name.value.trim()) {
            name.style.borderColor = 'red';
            valid = false;
        } else {
            name.style.borderColor = '#004d6d';
        }
        if (!email.value.trim() || !/^\S+@\S+\.\S+$/.test(email.value)) {
            email.style.borderColor = 'red';
            valid = false;
        } else {
            email.style.borderColor = '#007a99';
        }
        if (!message.value.trim()) {
            message.style.borderColor = 'red';
            valid = false;
        } else {
            message.style.borderColor = '';
        }
        return valid;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        status.hidden = true;
        if (!validateFields()) {
            status.textContent = 'Please fill in all fields correctly.';
            status.style.color = 'red';
            status.hidden = false;
            return;
        }

        // If EmailJS is configured, use it; otherwise simulate send and show success
        if (window.emailjs && typeof emailjs.sendForm === 'function') {
            // Replace with your EmailJS service/template IDs
            emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form)
                .then(function() {
                    status.textContent = 'Thank you for your message! We will get back to you soon.';
                    status.style.color = 'green';
                    status.hidden = false;
                    form.reset();
                }, function(error) {
                    status.textContent = 'Failed to send message. Please try again later.';
                    status.style.color = 'red';
                    status.hidden = false;
                    console.error('EmailJS send error:', error);
                });
        } else {
            // fallback / simulation
            status.textContent = 'Thank you for your message! We will get back to you soon.';
            status.style.color = 'green';
            status.hidden = false;
            form.reset();
        }
    });

    form.addEventListener('reset', function() {
        if (name) name.style.borderColor = '#004d6d';
        if (email) email.style.borderColor = '#007a99';
        if (message) message.style.borderColor = '';
        if (status) status.hidden = true;
    });
});
// Simple client-side form handler for Connect.html
// Validates inputs and opens user's email client using mailto: as a fallback.

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  form.addEventListener('submit', function(e){
    e.preventDefault();
    status.hidden = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    // basic validation
    if(!name){
      showStatus('Please enter your name', true);
      form.name.focus();
      return;
    }
    if(!validateEmail(email)){
      showStatus('Please enter a valid email address', true);
      form.email.focus();
      return;
    }
    if(!message){
      showStatus('Please enter a message', true);
      form.message.focus();
      return;
    }

    // Build mailto: link (works as fallback and opens user's email client)
    const to = 'youremail@example.com'; // <-- replace with your destination email
    const subject = encodeURIComponent('Website message from ' + name);
    const body = encodeURIComponent(
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n\n' +
      message
    );

    const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

    // try to open mail client
    window.location.href = mailto;
    showStatus('Opening your email client to send the message...', false);
  });

  function showStatus(msg, isError){
    status.textContent = msg;
    status.style.color = isError ? '#b00020' : '#0b3';
    status.hidden = false;
  }

  function validateEmail(email){
    // simple regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});
