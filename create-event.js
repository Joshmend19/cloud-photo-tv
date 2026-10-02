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


/* ---------------------------------
   Event Type
--------------------------------- */

const eventType =
  document.getElementById(
    "eventType"
  );


/* ---------------------------------
   Event-specific themes
--------------------------------- */

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


/* ---------------------------------
   Find theme container
--------------------------------- */

function getThemeContainer() {

  const themeHeading =
    Array.from(
      document.querySelectorAll("h2")
    ).find(
      heading =>
        heading.textContent
          .trim()
          .toLowerCase()
          .includes("choose your theme")
    );


  if (!themeHeading) {
    return null;
  }


  const themeSection =
    themeHeading.closest(
      ".form-section"
    );


  if (!themeSection) {
    return null;
  }


  return themeSection.querySelector(
    ".option-grid"
  );

}


/* ---------------------------------
   Update event themes
--------------------------------- */

function updateEventThemes() {

  const themeContainer =
    getThemeContainer();


  if (
    !eventType ||
    !themeContainer
  ) {

    console.log(
      "Theme container not found."
    );

    return;

  }


  const selectedEvent =
    eventType.value;


  const themes =
    eventThemes[selectedEvent];


  if (!themes) {

    console.log(
      "No themes found for:",
      selectedEvent
    );

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


  /* ---------------------------------
     Apply selected theme to page
  --------------------------------- */

  const themeInputs =
    themeContainer.querySelectorAll(
      'input[name="theme"]'
    );


  function applyTheme() {

    const selectedTheme =
      themeContainer.querySelector(
        'input[name="theme"]:checked'
      );


    if (!selectedTheme) {
      return;
    }


    document.body.dataset.theme =
      selectedTheme.value;


    console.log(
      "PAGE THEME:",
      selectedTheme.value
    );

  }


  themeInputs.forEach(
    input => {

      input.addEventListener(
        "change",
        applyTheme
      );

    }
  );


  /* Apply the first theme immediately */

  applyTheme();


  console.log(
    "THEMES UPDATED:",
    selectedEvent,
    themes
  );

}


/* ---------------------------------
   Event type change
--------------------------------- */

if (eventType) {

  eventType.addEventListener(
    "change",
    updateEventThemes
  );

  updateEventThemes();

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


    /* ---------------------------------
       Load saved theme
    --------------------------------- */

    const themeChoice =
      document.querySelector(
        `input[name="theme"][value="${event.theme}"]`
      );


    if (themeChoice) {

      themeChoice.checked =
        true;


      document.body.dataset.theme =
        themeChoice.value;


      console.log(
        "EDIT THEME:",
        themeChoice.value
      );

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
            .single();


        if (updateError) {

          throw updateError;

        }


        console.log(
          "EVENT UPDATED:",
          updatedEvent
        );


        sessionStorage.setItem(
          "cptv_event_code",
          editCode
        );


        location.href =
          `event-created.html?code=${editCode}`;


        return;

      }


      /* ---------------------------------
         CREATE UNIQUE EVENT CODE
      --------------------------------- */

      let code = null;

      let attempts = 0;


      while (
        !code &&
        attempts < 10
      ) {

        const possibleCode =
          createEventCode();


        const {
          data: existing,
          error: checkError
        } =
          await supabase
            .from("events")
            .select("id")
            .eq(
              "code",
              possibleCode
            )
            .maybeSingle();


        if (checkError) {

          throw checkError;

        }


        if (!existing) {

          code =
            possibleCode;

        }


        attempts++;

      }


      if (!code) {

        throw new Error(
          "Could not create a unique event code."
        );

      }


      /* ---------------------------------
         CREATE EVENT
      --------------------------------- */

      const {
        data: event,
        error: eventError
      } =
        await supabase
          .from("events")
          .insert({

            code,

            owner_id:
              ownerId,

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

            package:
              currentPackage,

            has_tv:
              hasTV,

            guestbook_enabled:
              isGuestbookEnabled,

            rsvp_enabled:
              isRSVPEnabled

          })
          .select()
          .single();


      if (eventError) {

        throw eventError;

      }


      /* ---------------------------------
         CREATE SESSION
      --------------------------------- */

      const eventEndDateTime =
        `${eventDate.value}T${endTime.value}:00`;

      const {
        error: sessionError
      } =
        await supabase
          .from("sessions")
          .insert({

            code,

            event_id:
              event.id,

            active:
              true,

            event_end_time:
              eventEndDateTime

          });


      if (sessionError) {

        await supabase
          .from("events")
          .delete()
          .eq(
            "id",
            event.id
          );


        throw sessionError;

      }


      /* ---------------------------------
         SAVE EVENT CODE
      --------------------------------- */

      sessionStorage.setItem(
        "cptv_event_code",
        code
      );


      console.log(
        "EVENT CREATED:",
        event
      );


      console.log(
        "TV ACCESS:",
        hasTV
      );


      console.log(
        "PACKAGE:",
        currentPackage
      );


      console.log(
        "GUESTBOOK:",
        isGuestbookEnabled
      );


      console.log(
        "RSVP:",
        isRSVPEnabled
      );


      /* ---------------------------------
         CONTINUE
      --------------------------------- */

      location.href =
        `event-created.html?code=${code}`;


    } catch (error) {

      console.error(
        "EVENT SAVE ERROR:",
        error
      );


      status.textContent =
        "Could not save the event. Please try again.";


      createBtn.disabled =
        false;


      createBtn.textContent =
        isEditMode
          ? "Save Event Changes"
          : "Continue to Checkout";

    }

  }
);
