import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* ---------------------------------
   Form elements
--------------------------------- */

const eventType =
  document.getElementById("eventType");

const eventName =
  document.getElementById("eventName");

const eventDate =
  document.getElementById("eventDate");

const startTime =
  document.getElementById("startTime");

const endTime =
  document.getElementById("endTime");

const primaryColor =
  document.getElementById("primaryColor");

const secondaryColor =
  document.getElementById("secondaryColor");

const accentColor =
  document.getElementById("accentColor");

const createBtn =
  document.getElementById("createBtn");

const status =
  document.getElementById("status");


/* ---------------------------------
   Create unique event code
--------------------------------- */

function createEventCode() {

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 6; i++) {

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
   Create event
--------------------------------- */

createBtn.addEventListener(
  "click",
  async () => {

    status.textContent = "";


    /* -------------------------------
       Get package
    ------------------------------- */

    const params =
      new URLSearchParams(
        window.location.search
      );

    const selectedPackage =
      params.get("package");


    if (
      selectedPackage !== "instant" &&
      selectedPackage !== "plus"
    ) {

      status.textContent =
        "Please choose a package first.";

      return;

    }


    /* -------------------------------
       Get event information
    ------------------------------- */

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


    /* -------------------------------
       Get TV choice
    ------------------------------- */

    const selectedTV =
      document.querySelector(
        'input[name="hasTV"]:checked'
      );


    const hasTV =
      selectedTV
        ? selectedTV.value === "true"
        : true;


    /* -------------------------------
       Get theme
    ------------------------------- */

    const selectedTheme =
      document.querySelector(
        'input[name="theme"]:checked'
      )?.value || "classic";


    /* -------------------------------
       Get background
    ------------------------------- */

    const selectedBackground =
      document.querySelector(
        'input[name="background"]:checked'
      )?.value || "classic";


    /* -------------------------------
       Package customization
    ------------------------------- */

    let finalPrimaryColor =
      "#b97979";

    let finalSecondaryColor =
      "#fffaf8";

    let finalAccentColor =
      "#c8a24a";

    let finalBackground =
      "classic";


    if (
      selectedPackage === "plus"
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


    /* -------------------------------
       Disable button
    ------------------------------- */

    createBtn.disabled = true;

    createBtn.textContent =
      "Creating event…";


    try {

      /* -----------------------------
         Create unique code
      ----------------------------- */

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


      /* -----------------------------
         Create event
      ----------------------------- */

      const {
        data: event,
        error: eventError
      } =
        await supabase
          .from("events")
          .insert({

            code,

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
              selectedPackage,

            has_tv:
              hasTV

          })
          .select()
          .single();


      if (eventError) {

        throw eventError;

      }


      /* -----------------------------
         Create TV/photo session
      ----------------------------- */

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
              true

          });


      if (sessionError) {

        /* ---------------------------
           Remove incomplete event
        --------------------------- */

        await supabase
          .from("events")
          .delete()
          .eq(
            "id",
            event.id
          );


        throw sessionError;

      }


      /* -----------------------------
         Save temporary event code
      ----------------------------- */

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
        selectedPackage
      );


      /* -----------------------------
         Continue
      ----------------------------- */

      location.href =
        `event-created.html?code=${code}`;


    } catch (error) {

      console.error(
        "EVENT CREATION ERROR:",
        error
      );


      status.textContent =
        "Could not create the event. Please try again.";


      createBtn.disabled =
        false;

      createBtn.textContent =
        "Continue to Checkout";

    }

  }
);
