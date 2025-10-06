// Signup manager: uses the same notification UI/UX as Login.js
class SignupManager {
    constructor() {
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.form = document.getElementById('signupForm');
        this.usernameField = document.getElementById('username');
        this.passwordField = document.getElementById('password');
        this.confirmPasswordField = document.getElementById('confirmPassword');
        this.showPasswordCheckbox = document.getElementById('showPassword');
        this.showConfirmPasswordCheckbox = document.getElementById('showConfirmPassword');
        this.signupButton = document.getElementById('signupButton');
        this.buttonText = this.signupButton.querySelector('.button-text');
        this.loadingSpinner = this.signupButton.querySelector('.loading-spinner');
        this.usernameError = document.getElementById('usernameError');
        this.passwordError = document.getElementById('passwordError');
        this.notificationContainer = document.getElementById('notificationContainer');
    }

    bindEvents() {
        if (this.showPasswordCheckbox) {
            this.showPasswordCheckbox.addEventListener('change', () => {
                this.passwordField.type = this.showPasswordCheckbox.checked ? 'text' : 'password';
            });
        }

        if (this.showConfirmPasswordCheckbox) {
            this.showConfirmPasswordCheckbox.addEventListener('change', () => {
                this.confirmPasswordField.type = this.showConfirmPasswordCheckbox.checked ? 'text' : 'password';
            });
        }

        this.usernameField.addEventListener('input', () => this.validateUsername(this.usernameField.value));
        this.passwordField.addEventListener('input', () => this.validatePassword(this.passwordField.value));
        this.confirmPasswordField.addEventListener('input', () => this.validateConfirmPassword(this.confirmPasswordField.value));

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    validateUsername(username) {
        const isValid = username.length >= 3 && !/\s|@/.test(username);
        this.updateFieldValidation(this.usernameField, this.usernameError, isValid, 'Username must be at least 3 characters and cannot contain spaces or @');
        return isValid;
    }

    validatePassword(password) {
        const isValid = password.length >= 8;
        this.updateFieldValidation(this.passwordField, this.passwordError, isValid, 'Password must be at least 8 characters long');
        return isValid;
    }

    validateConfirmPassword(confirmPassword) {
        const isValid = confirmPassword === this.passwordField.value;
        // Reuse passwordError element for confirm mismatch to keep markup minimal
        if (!isValid && confirmPassword !== '') {
            this.showError(this.passwordError, 'Passwords do not match');
        } else {
            this.hideError(this.passwordError);
        }
        return isValid;
    }

    updateFieldValidation(field, errorElement, isValid, errorMessage) {
        if (field.value === '') {
            field.classList.remove('error', 'success');
            this.hideError(errorElement);
            return;
        }

        if (isValid) {
            field.classList.remove('error');
            field.classList.add('success');
            this.hideError(errorElement);
        } else {
            field.classList.remove('success');
            field.classList.add('error');
            this.showError(errorElement, errorMessage);
        }
    }

    showError(errorElement, message) {
        if (!errorElement) return;
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    hideError(errorElement) {
        if (!errorElement) return;
        errorElement.classList.remove('show');
        setTimeout(() => {
            if (!errorElement.classList.contains('show')) {
                errorElement.textContent = '';
            }
        }, 300);
    }

    async handleSubmit(event) {
        event.preventDefault();

        const username = this.usernameField.value.trim();
        const password = this.passwordField.value;
        const confirmPassword = this.confirmPasswordField.value;

        const isUsernameValid = this.validateUsername(username);
        const isPasswordValid = this.validatePassword(password);
        const isConfirmValid = this.validateConfirmPassword(confirmPassword);

        if (!isUsernameValid || !isPasswordValid || !isConfirmValid) {
            this.showNotification('Please fix the errors above', 'error');
            this.shakeForm();
            return;
        }

        this.setLoadingState(true);

        try {
            // Small delay for UX
            await this.delay(500);

            // Attempt Firebase signup
            try {
                const firebase = await loadFirebase();
                const pseudoEmail = `${username}@perlas.local`;

                // Check username reservation
                const nameSnap = await firebase.database().ref('usernames/' + username).once('value');
                if (nameSnap.exists()) {
                    this.showNotification('That username is already taken. Please choose another.', 'error');
                    this.setLoadingState(false);
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

                this.showNotification('Account registered successfully. Redirecting to login...', 'success');
                await this.delay(1000);
                window.location.href = 'Login.html';
                return;
            } catch (err) {
                console.warn('Firebase signup error:', err && err.message ? err.message : err);

                if (err && err.code === 'auth/email-already-in-use') {
                    this.showNotification('That username is already taken. Please choose another.', 'error');
                    return;
                }

                // Fall through to local fallback
            }

            // Local fallback (insecure) — useful for offline/testing
            try {
                localStorage.setItem('registeredUsername', username);
                localStorage.setItem('registeredPassword', password);
                this.showNotification('Account registered locally (offline). Redirecting to login...', 'success');
                await this.delay(900);
                window.location.href = 'Login.html';
                return;
            } catch (e) {
                console.error('Local fallback failed:', e);
                this.showNotification('Unable to register account right now. Please try again later.', 'error');
                return;
            }

        } catch (e) {
            console.error(e);
            this.showNotification('An error occurred. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.signupButton.classList.add('loading');
            if (this.buttonText) this.buttonText.style.display = 'none';
            if (this.loadingSpinner) this.loadingSpinner.style.display = 'inline-block';
            this.signupButton.disabled = true;
        } else {
            this.signupButton.classList.remove('loading');
            if (this.buttonText) this.buttonText.style.display = 'inline-block';
            if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
            this.signupButton.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        if (!this.notificationContainer) return alert(message);

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        this.notificationContainer.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove after 3 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 3000);
    }

    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    shakeForm() {
        const container = document.querySelector('.login-container');
        if (!container) return;
        container.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            container.style.animation = '';
        }, 500);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add shake animation to CSS if not present (same as Login.js)
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);

document.addEventListener('DOMContentLoaded', () => {
    new SignupManager();
});
