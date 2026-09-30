import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

const signupForm =
  document.getElementById(
    "signupForm"
  );

const emailInput =
  document.getElementById(
    "email"
  );

const passwordInput =
  document.getElementById(
    "password"
  );

const confirmPasswordInput =
  document.getElementById(
    "confirmPassword"
  );

const signupButton =
  document.getElementById(
    "signupButton"
  );

const status =
  document.getElementById(
    "status"
  );

signupForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    const confirmPassword =
      confirmPasswordInput.value;

    if (password !== confirmPassword) {

      status.textContent =
        "Passwords do not match.";

      status.className =
        "status error";

      return;
    }

    if (password.length < 6) {

      status.textContent =
        "Password must be at least 6 characters.";

      status.className =
        "status error";

      return;
    }

    signupButton.disabled = true;

    signupButton.textContent =
      "Creating Account...";

    status.textContent = "";

    const {
      data,
      error
    } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            "https://joshmend19.github.io/cloud-photo-tv/login.html"
        }
      });

    if (error) {

      console.error(
        "Signup error:",
        error
      );

      signupButton.disabled = false;

      signupButton.textContent =
        "Create Account";

      status.textContent =
        error.message;

      status.className =
        "status error";

      return;
    }

    console.log(
      "Account created:",
      data
    );

    status.textContent =
      "Your account was created successfully. Check your email to verify your account.";

    status.className =
      "status success";

    signupForm.reset();

    signupButton.disabled = false;

    signupButton.textContent =
      "Create Account";

  }
);
