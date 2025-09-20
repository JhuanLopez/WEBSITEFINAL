document.getElementById('showPassword').addEventListener('change', function() {
    const passwordField = document.getElementById('password');
    passwordField.type = this.checked ? 'text' : 'password';
});

document.getElementById('showConfirmPassword').addEventListener('change', function() {
    const confirmPasswordField = document.getElementById('confirmPassword');
    confirmPasswordField.type = this.checked ? 'text' : 'password';
});

document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!username || !password || !confirmPassword) {
        alert('Please fill out all fields.');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    // Store the username and password in localStorage
    localStorage.setItem('registeredUsername', username);
    localStorage.setItem('registeredPassword', password);

    alert('Account Registered');
    window.location.href = 'Login.html';
});
