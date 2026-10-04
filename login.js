class LoginForm {
  constructor(formId, submitBtnId) {
    this.form = document.getElementById(formId);
    this.submitBtn = document.getElementById(submitBtnId);

    this.username = document.getElementById("username");
    this.password = document.getElementById("password");

    this.userError = document.getElementById("invalid-user");
    this.passError = document.getElementById("invalid-pass");

    this.form.addEventListener("submit", (event) => this.login(event));
  }

  showError(element, message, duration = 3000) {
    element.textContent = message;
    element.previousElementSibling?.focus?.();
    setTimeout(() => {
      element.textContent = "";
    }, duration);
  }

  toggleButton(enabled, text) {
    this.submitBtn.disabled = !enabled;
    this.submitBtn.textContent = text;
  }

  async login(event) {
    event.preventDefault();

    const usernameValue = this.username.value.trim();
    const passwordValue = this.password.value.trim();

    this.userError.textContent = "";
    this.passError.textContent = "";

    if (usernameValue === "") {
      return this.showError(this.userError, "Username cannot be empty");
    }

    if (passwordValue === "") {
      return this.showError(this.passError, "Password cannot be empty");
    }

    this.toggleButton(false, "Logging in...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: usernameValue,
          password: passwordValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.message || "Login failed";
        const field = data.field || "username";

        if (field === "username") {
          this.showError(this.userError, message);
        } else {
          this.showError(this.passError, message);
        }

        this.toggleButton(true, "Login");
        return;
      }

      localStorage.setItem("codegen_token", data.token);
      localStorage.setItem("codegen_user", JSON.stringify(data.user));

      this.form.reset();
      this.toggleButton(true, "Login");

      window.location.href = "dashboard.html";
    } catch (error) {
      this.showError(this.passError, "Server error. Please try again.");
      this.toggleButton(true, "Login");
    }
  }
}

const loginForm = new LoginForm("loginForm", "submitBtn");