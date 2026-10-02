```javascript
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


const eventType =
  document.getElementById(
    "eventType"
  );


/* ---------------------------------
   Event-specific themes
--------------------------------- */

const themeSection =
  Array.from(
    document.querySelectorAll(".form-section")
  ).find(
    section =>
      section.querySelector("h2")?.textContent.trim() ===
      "Choose Your Theme"
  );


const themeContainer =
  themeSection
    ? themeSection.querySelector(".option-grid")
    : null;


const eventThemes = {

  Birthday: [
    {
      value: "balloons-confetti",
      label: "Balloons & Confetti"
    },
    {
      value: "birthday-celebration",
      label: "Birthday Celebration"
    },
    {
      value: "colorful-party",
      label: "Colorful Party"
    }
  ],

  Graduation: [
    {
      value: "graduation",
      label: "Graduation"
    },
    {
      value: "caps-diplomas",
      label: "Caps & Diplomas"
    },
    {
      value: "school-celebration",
      label: "School Celebration"
    }
  ],

  Wedding: [
    {
      value: "elegant-flowers",
      label: "Elegant Flowers"
    },
    {
      value: "romantic-hearts",
      label: "Romantic Hearts"
    },
    {
      value: "classic-wedding",
      label: "Classic Wedding"
    }
  ],

  "Baby Shower": [
    {
      value: "baby-celebration",
      label: "Baby Celebration"
    },
    {
      value: "soft-sweet",
      label: "Soft & Sweet"
    },
    {
      value: "baby-shower",
      label: "Baby Shower"
    }
  ],

  "Sports Event": [
    {
      value: "sports",
      label: "Sports"
    },
    {
      value: "stadium",
      label: "Stadium"
    },
    {
      value: "game-day",
      label: "Game Day"
    }
  ],

  "Game Night": [
    {
      value: "gaming",
      label: "Gaming"
    },
    {
      value: "controllers",
      label: "Controllers"
    },
    {
      value: "neon-arcade",
      label: "Neon Arcade"
    }
  ]

};


function updateEventThemes() {

  if (!eventType || !themeContainer) {
    return;
  }


  const selectedEvent =
    eventType.value;


  const themes =
    eventThemes[selectedEvent];


  if (!themes) {
    return;
  }


  themeContainer.innerHTML =
    "";


  themes.forEach(
    (theme, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "option-card";


      card.innerHTML = `
        <input
          type="radio"
          id="theme-${theme.value}"
          name="theme"
          value="${theme.value}"
          ${index === 0 ? "checked" : ""}
        >

        <label
          for="theme-${theme.value}"
        >
          ${theme.label}
        </label>
      `;


      themeContainer.appendChild(
        card
      );

    }
  );

}


if (eventType) {

  eventType.addEventListener(
    "change",
    updateEventThemes
  );

}


/* ---------------------------------
   Event form fields
--------------------------------- */

const eventName =
  document.getElementById(
    "eventName"
  );

const eventDate =
  document.getElementById(
    "eventDate"
  );

const startTime =
  document.getElementById(
    "startTime"
  );

const endTime =
  document.getElementById(
    "endTime"
  );

const primaryColor =
  document.getElementById(
    "primaryColor"
  );

const secondaryColor =
  document.getElementById(
    "secondaryColor"
  );

const accentColor =
  document.getElementById(
    "accentColor"
  );

const guestbookEnabled =
  document.getElementById(
    "guestbookEnabled"
  );

const rsvpEnabled =
  document.getElementById(
    "rsvpEnabled"
  );

const createBtn =
  document.getElementById(
    "createBtn"
  );

const status =
  document.getElementById(
    "status"
  );


const params =
  new URLSearchParams(
    window.location.search
  );


const editCode =
  (params.get("edit") || "")
    .toUpperCase();


const isEditMode =
  Boolean(editCode);


let editPackage = null;

let editLoaded =
  !isEditMode;


/* ---------------------------------
   Create event code
--------------------------------- */

function createEventCode() {

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (
    let i = 0;
    i < 6;
    i++
  ) {

    code +=
      characters[
        Math.floor(
          Math.random() *
          characters.length
        )
      ];

  }

  return code;

}


/* ---------------------------------
   Load existing event
--------------------------------- */

async function loadEditEvent() {

  if (!isEditMode) {
    return;
  }


  try {

    createBtn.disabled =
      true;

    status.textContent =
      "Loading your event…";


    const {
      data: event,
      error
    } =
      await supabase
        .from("events")
        .select("*")
        .eq(
          "code",
          editCode
        )
        .single();


    if (error) {
      throw error;
    }


    if (!event) {

      throw new Error(
        "Event not found."
      );

    }


    console.log(
      "EDIT EVENT LOADED:",
      event
    );


    editPackage =
      event.package ||
      "instant";


    if (
      editPackage !== "instant" &&
      editPackage !== "plus" &&
      editPackage !== "business"
    ) {

      editPackage =
        "instant";

    }


    console.log(
      "EDIT PACKAGE:",
      editPackage
    );


    if (eventType) {

      eventType.value =
        event.event_type ||
        "";

      updateEventThemes();

    }


    if (eventName) {

      eventName.value =
        event.event_name ||
        "";

    }


    if (eventDate) {

      eventDate.value =
        event.event_date ||
        "";

    }


    if (startTime) {

      startTime.value =
        event.start_time
          ? event.start_time.slice(0, 5)
          : "";

    }


    if (endTime) {

      endTime.value =
        event.end_time
          ? event.end_time.slice(0, 5)
          : "";

    }


    const tvValue =
      event.has_tv === false
        ? "false"
        : "true";


    const tvChoice =
      document.querySelector(
        `input[name="hasTV"][value="${tvValue}"]`
      );


    if (tvChoice) {

      tvChoice.checked =
        true;

    }


    const themeChoice =
      document.querySelector(
        `input[name="theme"][value="${event.theme}"]`
      );


    if (themeChoice) {

      themeChoice.checked =
        true;

    }


    const backgroundValue =
      event.background ||
      "default";


    const backgroundChoice =
      document.querySelector(
        `input[name="background"][value="${backgroundValue}"]`
      );


    if (backgroundChoice) {

      backgroundChoice.checked =
        true;

    } else {

      const classicBackground =
        document.querySelector(
          'input[name="background"][value="classic"]'
        );


      if (classicBackground) {

        classicBackground.checked =
          true;

      }

    }


    if (primaryColor) {

      primaryColor.value =
        event.primary_color ||
        "#b97979";

    }


    if (secondaryColor) {

      secondaryColor.value =
        event.secondary_color ||
        "#fffaf8";

    }


    if (accentColor) {

      accentColor.value =
        event.accent_color ||
        "#c8a24a";

    }


    if (guestbookEnabled) {

      guestbookEnabled.checked =
        event.guestbook_enabled === true;

    }


    if (rsvpEnabled) {

      rsvpEnabled.checked =
        event.rsvp_enabled === true;

    }


    /* ---------------------------------
       Business always includes
       Guestbook + RSVP
    --------------------------------- */

    if (
      editPackage === "business"
    ) {

      if (guestbookEnabled) {

        guestbookEnabled.checked =
          true;

      }

      if (rsvpEnabled) {

        rsvpEnabled.checked =
          true;

      }

    }


    editLoaded =
      true;


    createBtn.textContent =
      "Save Event Changes";


    createBtn.disabled =
      false;


    status.textContent =
      "Your event details have been loaded.";


  } catch (error) {

    console.error(
      "EDIT EVENT LOAD ERROR:",
      error
    );


    status.textContent =
      "Could not load this event.";


    createBtn.disabled =
      true;


    editLoaded =
      false;

  }

}


loadEditEvent();


/* ---------------------------------
   Save event
--------------------------------- */

createBtn.addEventListener(
  "click",
  async () => {

    status.textContent = "";


    if (
      isEditMode &&
      !editLoaded
    ) {

      status.textContent =
        "Please wait for your event to finish loading.";

      return;

    }


    /* ---------------------------------
       GET LOGGED-IN CUSTOMER
    --------------------------------- */

    const {
      data: {
        session
      }
    } =
      await supabase.auth.getSession();


    if (!session) {

      status.textContent =
        "Please log in before creating an event.";

      return;

    }


    const ownerId =
      session.user.id;


    let currentPackage =
      isEditMode
        ? editPackage
        : window.selectedCapturedPackage;


    console.log(
      "SELECTED PACKAGE:",
      currentPackage
    );


    console.log(
      "EVENT OWNER:",
      ownerId
    );


    /* ---------------------------------
       PACKAGE VALIDATION
    --------------------------------- */

    if (
      currentPackage !== "instant" &&
      currentPackage !== "plus" &&
      currentPackage !== "business"
    ) {

      status.textContent =
        "Please choose a package first.";

      return;

    }


    /* ---------------------------------
       BASIC VALIDATION
    --------------------------------- */

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


    if (
      !startTime.value ||
      !endTime.value
    ) {

      status.textContent =
        "Please choose a start and end time.";

      return;

    }


    if (
      endTime.value <=
      startTime.value
    ) {

      status.textContent =
        "The end time must be after the start time.";

      return;

    }


    /* ---------------------------------
       TV
    --------------------------------- */

    const selectedTV =
      document.querySelector(
        'input[name="hasTV"]:checked'
      );


    const hasTV =
      selectedTV
        ? selectedTV.value === "true"
        : true;


    /* ---------------------------------
       THEME
    --------------------------------- */

    const selectedTheme =
      document.querySelector(
        'input[name="theme"]:checked'
      )?.value ||
      "classic";


    /* ---------------------------------
       BACKGROUND
    --------------------------------- */

    const selectedBackground =
      document.querySelector(
        'input[name="background"]:checked'
      )?.value ||
      "classic";


    /* ---------------------------------
       GUESTBOOK
    --------------------------------- */

    let isGuestbookEnabled =
      guestbookEnabled
        ? guestbookEnabled.checked
        : false;


    /* ---------------------------------
       RSVP
    --------------------------------- */

    let isRSVPEnabled =
      rsvpEnabled
        ? rsvpEnabled.checked
        : false;


    /* ---------------------------------
       BUSINESS ALWAYS INCLUDES
       GUESTBOOK + RSVP
    --------------------------------- */

    if (
      currentPackage === "business"
    ) {

      isGuestbookEnabled =
        true;

      isRSVPEnabled =
        true;

    }


    /* ---------------------------------
       DEFAULT COLORS
    --------------------------------- */

    let finalPrimaryColor =
      "#b97979";

    let finalSecondaryColor =
      "#fffaf8";

    let finalAccentColor =
      "#c8a24a";

    let finalBackground =
      "classic";


    /* ---------------------------------
       PLUS + BUSINESS CUSTOMIZATION
    --------------------------------- */

    if (
      currentPackage === "plus" ||
      currentPackage === "business"
    ) {

      finalPrimaryColor =
        primaryColor.value;

      finalSecondaryColor =
        secondaryColor.value;

      finalAccentColor =
        accentColor.value;

      finalBackground =
        selectedBackground;

    }


    createBtn.disabled =
      true;


    createBtn.textContent =
      isEditMode
        ? "Saving changes…"
        : "Creating event…";


    try {


      /* ---------------------------------
         EDIT EXISTING EVENT
      --------------------------------- */

      if (isEditMode) {

        const {
          data: updatedEvent,
          error: updateError
        } =
          await supabase
            .from("events")
            .update({

              event_type:
                eventType.value,

              event_name:
                name,

              event_date:
                eventDate.value,

              start_time:
                startTime.value,

              end_time:
                endTime.value,

              theme:
                selectedTheme,

              primary_color:
                finalPrimaryColor,

              secondary_color:
                finalSecondaryColor,

              accent_color:
                finalAccentColor,

              background:
                finalBackground,

              has_tv:
                hasTV,

              guestbook_enabled:
                isGuestbookEnabled,

              rsvp_enabled:
                isRSVPEnabled

            })
            .eq(
              "code",
              editCode
            )
            .select()
            .si
```
