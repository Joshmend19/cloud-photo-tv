import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const eventType = document.getElementById("eventType");
const eventName = document.getElementById("eventName");
const eventDate = document.getElementById("eventDate");
const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");

const primaryColor = document.getElementById("primaryColor");
const secondaryColor = document.getElementById("secondaryColor");
const accentColor = document.getElementById("accentColor");

const background = document.getElementById("background");

const logo = document.getElementById("logo");

const createBtn = document.getElementById("createBtn");
const status = document.getElementById("status");


function createEventCode() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += characters[
      Math.floor(Math.random() * characters.length)
    ];
  }

  return code;
}


createBtn.addEventListener("click", async () => {

  status.textContent = "";

  const name =
    eventName.value.trim();

  if (!name) {
    status.textContent =
      "Please enter an event name.";

    eventName.focus();

    return;
  }

  if (!eventDate.value) {
    status.textContent =
      "Please choose an event date.";

    return;
  }

  if (!startTime.value || !endTime.value) {
    status.textContent =
      "Please choose a start and end time.";

    return;
  }

  if (endTime.value <= startTime.value) {
    status.textContent =
      "The end time must be after the start time.";

    return;
  }

  createBtn.disabled = true;
  createBtn.textContent =
    "Creating event…";

  try {

    let code = null;

    let attempts = 0;

    while (!code && attempts < 10) {

      const possibleCode =
        createEventCode();

      const { data: existing } =
        await supabase
          .from("events")
          .select("id")
          .eq("code", possibleCode)
          .maybeSingle();

      if (!existing) {
        code = possibleCode;
      }

      attempts++;
    }

    if (!code) {
      throw new Error(
        "Could not create a unique event code."
      );
    }


    const selectedTheme =
      document.querySelector(
        'input[name="theme"]:checked'
      )?.value || "classic";


    const { data: event, error } =
      await supabase
        .from("events")
        .insert({
          code,
          event_type: eventType.value,
          event_name: name,
          event_date: eventDate.value,
          start_time: startTime.value,
          end_time: endTime.value,
          theme: selectedTheme,
          primary_color: primaryColor.value,
          secondary_color: secondaryColor.value,
          accent_color: accentColor.value,
          background: background.value
        })
        .select()
        .single();


    if (error) {
      throw error;
    }


    status.textContent =
      "Event created successfully!";

    console.log(
      "EVENT CREATED:",
      event
    );

  } catch (error) {

    console.error(error);

    status.textContent =
      "Could not create the event. Please try again.";

  } finally {

    createBtn.disabled = false;

    createBtn.textContent =
      "Continue to Checkout";
  }

});
