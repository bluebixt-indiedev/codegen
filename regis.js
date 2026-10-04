class RegisterForm {
  constructor(formId, submitBtnId) {
    this.form = document.getElementById(formId);
    this.submitBtn = document.getElementById(submitBtnId);

    this.usernameElement = document.getElementById("username");
    this.passwordElement = document.getElementById("password");
    this.emailElement = document.getElementById("email");

    this.userErrorElement = document.getElementById("invalid-user");
    this.passErrorElement = document.getElementById("invalid-pass");
    this.emailErrorElement = document.getElementById("invalid-email");
    this.sameUserPwElement = document.getElementById("same-user-pw");

    this.form.addEventListener("submit", (event) => this.register(event));
  }

  showError(inputElement, errorElement, message, duration = 3000) {
    errorElement.textContent = message;
    inputElement.focus();
    setTimeout(() => {
      errorElement.textContent = "";
    }, duration);
  }

  toggleButton(enabled, text) {
    this.submitBtn.disabled = !enabled;
    this.submitBtn.textContent = text;
  }

  validatePassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(password);
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async register(event) {
    event.preventDefault();

    const usernameValue = this.usernameElement.value.trim();
    const passwordValue = this.passwordElement.value.trim();
    const emailValue = this.emailElement.value.trim();

    this.userErrorElement.textContent = "";
    this.passErrorElement.textContent = "";
    this.emailErrorElement.textContent = "";
    this.sameUserPwElement.textContent = "";

    if (!this.validateEmail(emailValue)) {
      return this.showError(this.emailElement, this.emailErrorElement, "Please enter a valid email address");
    }

    if (usernameValue === "") {
      return this.showError(this.usernameElement, this.userErrorElement, "Username cannot be empty");
    }

    if (usernameValue.length < 3) {
      return this.showError(this.usernameElement, this.userErrorElement, "Username must be at least 3 characters");
    }

    if (passwordValue === "") {
      return this.showError(this.passwordElement, this.passErrorElement, "Password cannot be empty");
    }

    if (passwordValue.length < 8) {
      return this.showError(this.passwordElement, this.passErrorElement, "Password must be at least 8 characters");
    }

    if (!this.validatePassword(passwordValue)) {
      return this.showError(
        this.passwordElement,
        this.passErrorElement,
        "Password must include uppercase, lowercase, a number, and a special character"
      );
    }

    if (usernameValue === passwordValue) {
      return this.showError(this.passwordElement, this.sameUserPwElement, "Username and password should not be the same");
    }

    this.toggleButton(false, "Registering...");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: usernameValue,
          email: emailValue,
          password: passwordValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.message || "Registration failed";
        const field = data.field || "username";

        if (field === "username") {
          this.showError(this.usernameElement, this.userErrorElement, message);
        } else if (field === "email") {
          this.showError(this.emailElement, this.emailErrorElement, message);
        } else {
          this.showError(this.passwordElement, this.passErrorElement, message);
        }

        this.toggleButton(true, "Register");
        return;
      }

      localStorage.setItem("codegen_token", data.token);
      localStorage.setItem("codegen_user", JSON.stringify(data.user));

      this.form.reset();
      this.toggleButton(true, "Register");

      window.location.href = "dashboard.html";
    } catch (error) {
      this.showError(this.passwordElement, this.passErrorElement, "Server error. Please try again.");
      this.toggleButton(true, "Register");
    }
  }
}

const registerForm = new RegisterForm("regForm", "submitBtn");