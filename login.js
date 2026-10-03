class LoginForm {
    constructor(formId, submitBtnId) {
        this.form = document.getElementById(formId);
        this.submitBtn = document.getElementById(submitBtnId);
        this.username = document.getElementById('username');
        this.password = document.getElementById('password');
        this.userError = document.getElementById('invalid-user');
        this.passError = document.getElementById('invalid-pass');

        this.form.addEventListener('submit', (event) => this.login(event));
    }

    showError(element, message, duration = 3000) {
        element.textContent = message;
        element.previousElementSibling.focus();
        setTimeout(() => element.textContent = '', duration);
    }

    toggleButton(enabled, text) {
        this.submitBtn.disabled = !enabled;
        this.submitBtn.textContent = text;
    }

    login(event) {
        event.preventDefault();

        const usernameValue = this.username.value.trim();
        const passwordValue = this.password.value.trim();

        this.userError.textContent = '';
        this.passError.textContent = '';

        if (usernameValue === '') return this.showError(this.userError, 'Username cannot be empty');
        if (passwordValue === '') return this.showError(this.passError, 'Password cannot be empty');

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
const _loginForm = new LoginForm('loginForm', 'submitBtn');