// Enhanced Interactive Login System
class LoginManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupValidation();
    }

    initializeElements() {
        this.form = document.getElementById('loginForm');
        this.emailField = document.getElementById('email');
        this.passwordField = document.getElementById('password');
        this.showPasswordCheckbox = document.getElementById('showPassword');
        this.loginButton = document.getElementById('loginButton');
        this.buttonText = this.loginButton.querySelector('.button-text');
        this.loadingSpinner = this.loginButton.querySelector('.loading-spinner');
    this.emailError = document.getElementById('emailError') || document.getElementById('usernameError');
        this.passwordError = document.getElementById('passwordError');
        this.notificationContainer = document.getElementById('notificationContainer');
    }

    bindEvents() {
        // Show/hide password functionality
        this.showPasswordCheckbox.addEventListener('change', () => {
            this.togglePasswordVisibility();
        });

        // Real-time validation
        // validate email as user types
        if (this.emailField) {
            this.emailField.addEventListener('input', () => {
                this.validateEmail(this.emailField.value);
            });
        }

        this.passwordField.addEventListener('input', () => {
            this.validatePassword(this.passwordField.value);
        });

        // Form submission
        this.form.addEventListener('submit', (event) => {
            this.handleFormSubmit(event);
        });

        // Enhanced keyboard navigation
        this.setupKeyboardNavigation();

        // Focus effects
        this.setupFocusEffects();
    }

    togglePasswordVisibility() {
        const isChecked = this.showPasswordCheckbox.checked;
        this.passwordField.type = isChecked ? 'text' : 'password';
        
        // Add smooth transition effect
        this.passwordField.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.passwordField.style.transform = 'scale(1)';
        }, 150);
    }

    // Username removed — validateEmail used instead

    validateEmail(email) {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    this.updateFieldValidation(this.emailField, this.emailError, isValid, 'Please enter a valid email address');
        return isValid;
    }

    validatePassword(password) {
        const isValid = password.length >= 6;
        this.updateFieldValidation(this.passwordField, this.passwordError, isValid, 
            'Password must be at least 6 characters long');
        return isValid;
    }

    updateFieldValidation(field, errorElement, isValid, errorMessage) {
        if (field.value === '') {
            // Reset state when field is empty
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
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    hideError(errorElement) {
        errorElement.classList.remove('show');
        setTimeout(() => {
            if (!errorElement.classList.contains('show')) {
                errorElement.textContent = '';
            }
        }, 300);
    }

    setupValidation() {
        // Initial validation setup
        if (this.emailField) {
            this.emailField.addEventListener('blur', () => {
                if (this.emailField.value) {
                    this.validateEmail(this.emailField.value);
                }
            });
        }

        this.passwordField.addEventListener('blur', () => {
            if (this.passwordField.value) {
                this.validatePassword(this.passwordField.value);
            }
        });
    }

    setupKeyboardNavigation() {
        // Enter key navigation
        if (this.emailField) {
            this.emailField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.passwordField.focus();
                }
            });
        }

        this.passwordField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.form.dispatchEvent(new Event('submit'));
            }
        });

        // Escape key to clear form
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearForm();
            }
        });
    }

    setupFocusEffects() {
        [this.emailField, this.passwordField].forEach(field => {
            field.addEventListener('focus', () => {
                field.parentElement.style.transform = 'scale(1.02)';
            });

            field.addEventListener('blur', () => {
                field.parentElement.style.transform = 'scale(1)';
            });
        });
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        const email = (this.emailField && this.emailField.value || '').trim();
        const password = this.passwordField.value.trim();

        // Validate all fields
        const isEmailValid = this.validateEmail(email);
        const isPasswordValid = this.validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            this.showNotification('Please fix the errors above', 'error');
            this.shakeForm();
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Simulate API call delay
            await this.delay(1500);

            // Check credentials
            const result = await this.authenticateUser(email, password);
            
            if (result.success) {
                this.showNotification('Login successful! Redirecting...', 'success');
                await this.delay(1000);
                window.location.href = 'Home.html';
            } else {
                this.showNotification(result.message, 'error');
                this.shakeForm();
            }
        } catch (error) {
            this.showNotification('An error occurred. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async authenticateUser(email, password) {
        // Try Firebase Auth first (email + password)
        try {
            if (typeof loadFirebase === 'function') {
                const firebase = await loadFirebase();

                const userCred = await firebase.auth().signInWithEmailAndPassword(email, password);
                if (userCred && userCred.user) {
                    // fetch profile from realtime DB
                    try {
                        const uid = userCred.user.uid;
                        const snap = await firebase.database().ref('users/' + uid).once('value');
                        const profile = snap.val() || { email };
                        // store profile in sessionStorage for the session
                        try { sessionStorage.setItem('userProfile', JSON.stringify(profile)); } catch(e){}
                        return { success: true, message: 'Login successful (Firebase)!', profile };
                    } catch (dbErr) {
                        console.warn('Failed to read user profile:', dbErr);
                        return { success: true, message: 'Login successful (Firebase) - profile not found' };
                    }
                }
            }
        } catch (err) {
            console.warn('Firebase login error:', err && err.message ? err.message : err);
            // fall back to localStorage below
        }

        // Local fallback (insecure) — useful for offline/testing
        const registeredEmail = localStorage.getItem('registeredEmail');
        const registeredPassword = localStorage.getItem('registeredPassword');

        if (!registeredEmail || !registeredPassword) {
            return {
                success: false,
                message: 'No registered user found. Please sign up first.'
            };
        }
        if (email !== registeredEmail) {
            return {
                success: false,
                message: 'Email not found. Please check your email.'
            };
        }

        if (password !== registeredPassword) {
            return {
                success: false,
                message: 'Incorrect password. Please try again.'
            };
        }

        return {
            success: true,
            message: 'Login successful! (local)'
        };
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.loginButton.classList.add('loading');
            this.buttonText.style.display = 'none';
            this.loadingSpinner.style.display = 'inline-block';
            this.loginButton.disabled = true;
        } else {
            this.loginButton.classList.remove('loading');
            this.buttonText.style.display = 'inline-block';
            this.loadingSpinner.style.display = 'none';
            this.loginButton.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
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
        container.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            container.style.animation = '';
        }, 500);
    }

    clearForm() {
        if (this.emailField) this.emailField.value = '';
        this.passwordField.value = '';
        if (this.emailField) this.emailField.classList.remove('error', 'success');
        this.passwordField.classList.remove('error', 'success');
    this.hideError(this.emailError);
        this.hideError(this.passwordError);
        this.showNotification('Form cleared', 'info');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add shake animation to CSS if not present
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);

// Initialize the login manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Add some additional interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add floating labels effect
    const inputs = document.querySelectorAll('input[type="email"], input[type="text"], input[type="password"]');
    
    inputs.forEach(input => {
        const label = input.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.classList.add('floating-label');
            
            // Handle focus and blur events
            input.addEventListener('focus', () => {
                label.classList.add('active');
            });
            
            input.addEventListener('blur', () => {
                if (input.value === '') {
                    label.classList.remove('active');
                }
            });
            
            // Check if input has value on page load
            if (input.value !== '') {
                label.classList.add('active');
            }
        }
    });

    // Add parallax effect to background
    document.addEventListener('mousemove', (e) => {
        const container = document.querySelector('.login-container');
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const xPercent = (x / rect.width - 0.5) * 2;
            const yPercent = (y / rect.height - 0.5) * 2;
            
            container.style.transform = `translate(${xPercent * 2}px, ${yPercent * 2}px)`;
        } else {
            container.style.transform = 'translate(0, 0)';
        }
    });
});
