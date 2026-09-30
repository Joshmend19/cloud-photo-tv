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

const loginForm =
  document.getElementById(
    "loginForm"
  );

const emailInput =
  document.getElementById(
    "email"
  );

const passwordInput =
  document.getElementById(
    "password"
  );

const loginButton =
  document.getElementById(
    "loginButton"
  );

const status =
  document.getElementById(
    "status"
  );

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    loginButton.disabled = true;

    loginButton.textContent =
      "Logging In...";

    status.textContent = "";

    const {
      data,
      error
    } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      console.error(
        "Login error:",
        error
      );

      loginButton.disabled = false;

      loginButton.textContent =
        "Log In";

      status.textContent =
        error.message;

      status.className =
        "status error";

      return;
    }

    console.log(
      "Login successful:",
      data
    );

    status.textContent =
      "Login successful!";

    status.className =
      "status success";

    setTimeout(() => {
      window.location.href =
        "dashboard.html";
    }, 800);

  }
);
