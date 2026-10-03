class RegisterForm {
    constructor(formId, submitBtnId) {
        this.form = document.getElementById(formId);
        this.submitBtn = document.getElementById(submitBtnId);

        this.usernameElement = document.getElementById('username');
        this.passwordElement = document.getElementById('password');
        this.emailElement = document.getElementById('email');

        this.userErrorElement = document.getElementById('invalid-user');
        this.passErrorElement = document.getElementById('invalid-pass');
        this.emailErrorElement = document.getElementById('invalid-email');
        this.sameUserPwElement = document.getElementById('same-user-pw');

        this.form.addEventListener('submit', (event) => this.register(event));
    }

    showError(inputElement, errorElement, message, duration = 3000) {
        errorElement.textContent = message;
        inputElement.focus();
        setTimeout(() => (errorElement.textContent = ''), duration);
    }

    toggleButton(enabled, text) {
        this.submitBtn.disabled = !enabled;
        this.submitBtn.textContent = text;
    }

    validatePassword(password) {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
        return re.test(password);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    register(event) {
        event.preventDefault();

        const usernameValue = this.usernameElement.value.trim();
        const passwordValue = this.passwordElement.value.trim();
        const emailValue = this.emailElement.value.trim();

        // Clear previous errors
        this.userErrorElement.textContent = '';
        this.passErrorElement.textContent = '';
        this.emailErrorElement.textContent = '';
        this.sameUserPwElement.textContent = '';

        // Validate email
        if (!this.validateEmail(emailValue)) {
            return this.showError(this.emailElement, this.emailErrorElement, 'Please enter a valid email address');
        }

        // Validate username
        if (usernameValue === '') {
            return this.showError(this.usernameElement, this.userErrorElement, 'Username cannot be empty');
        }
        if (usernameValue.length < 3) {
            return this.showError(this.usernameElement, this.userErrorElement, 'Username must be at least 3 characters');
        }

        // Validate password
        if (passwordValue === '') {
            return this.showError(this.passwordElement, this.passErrorElement, 'Password cannot be empty');
        }
        if (passwordValue.length < 8) {
            return this.showError(this.passwordElement, this.passErrorElement, 'Password must be at least 8 characters');
        }
        if (!this.validatePassword(passwordValue)) {
            return this.showError(
                this.passwordElement,
                this.passErrorElement,
                'Password must include uppercase, lowercase, a number, and a special character'
            );
        }

        if (usernameValue === passwordValue) {
            return this.showError(this.passwordElement, this.sameUserPwElement, 'Username and password should not be the same');
        }

        // Simulate registration -> NOW SAVES TO LOCAL STORAGE
        this.toggleButton(false, 'Registering...');
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('users') || '[]');

            // Check for duplicate
            const emailExists = users.some(u => u.email.toLowerCase() === emailValue.toLowerCase());
            if (emailExists) {
                this.toggleButton(true, 'Login');
                return this.showError(this.emailElement, this.emailErrorElement, 'Email already registered');
            }

            const userExists = users.some(u => u.username.toLowerCase() === usernameValue.toLowerCase());
            if (userExists) {
                this.toggleButton(true, 'Login');
                return this.showError(this.usernameElement, this.userErrorElement, 'Username already taken');
            }

            // Create new user object
            const newUser = {
                id: Date.now(),
                username: usernameValue,
                email: emailValue,
                password: passwordValue, // Note: Don't do this in production - hash it!
                createdAt: new Date().toISOString()
            };

            // Save to Local Storage
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            localStorage.setItem('isLoggedIn', 'true');

            this.form.reset();
            this.toggleButton(true, 'Login');
            
            // Optional: redirect to login/dashboard
            window.location.href = '/dashboard.html';
            console.log('User saved:', newUser);
        }, 800);
    }
}

// eslint-disable-next-line no-unused-vars
const _registerForm = new RegisterForm('loginForm', 'submitBtn');