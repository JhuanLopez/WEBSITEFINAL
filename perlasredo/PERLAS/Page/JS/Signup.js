// Show/hide password checkboxes
document.getElementById('showPassword').addEventListener('change', function() {
    const passwordField = document.getElementById('password');
    passwordField.type = this.checked ? 'text' : 'password';
});

document.getElementById('showConfirmPassword').addEventListener('change', function() {
    const confirmPasswordField = document.getElementById('confirmPassword');
    confirmPasswordField.type = this.checked ? 'text' : 'password';
});

// Signup handler
document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById('username').value.trim();
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

    // Basic username validation (no spaces, no @)
    if (/\s|@/.test(username)) {
        alert('Username cannot contain spaces or @ characters.');
        return;
    }

    // Attempt Firebase signup
    try {
        const firebase = await loadFirebase();
        const pseudoEmail = `${username}@perlas.local`;

        // Check if username already exists in DB (reserve usernames)
        const nameSnap = await firebase.database().ref('usernames/' + username).once('value');
        if (nameSnap.exists()) {
            alert('That username is already taken. Please choose another.');
            return;
        }

        // Create auth user
        const userCred = await firebase.auth().createUserWithEmailAndPassword(pseudoEmail, password);
        const uid = userCred.user.uid;

        // Set user profile and username->uid mapping atomically
        const updates = {};
        updates[`users/${uid}`] = {
            username: username,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        updates[`usernames/${username}`] = uid;

        await firebase.database().ref().update(updates);

        alert('Account registered successfully. Please log in.');
        window.location.href = 'Login.html';
        return;
    } catch (err) {
        console.warn('Firebase signup error:', err && err.message ? err.message : err);

        // If auth/email-already-in-use, inform the user
        if (err && err.code === 'auth/email-already-in-use') {
            alert('That username is already taken. Please choose another.');
            return;
        }

        // Fallback to localStorage if Firebase is not available or other error
        try {
            localStorage.setItem('registeredUsername', username);
            localStorage.setItem('registeredPassword', password);
            alert('Account registered locally (offline fallback). Please log in.');
            window.location.href = 'Login.html';
            return;
        } catch (e) {
            console.error('Local fallback failed:', e);
            alert('Unable to register account right now. Please try again later.');
            return;
        }
    }
});
