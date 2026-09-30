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
   URL parameters
--------------------------------- */

const params =
  new URLSearchParams(
    window.location.search
  );

const editCode =
  (params.get("edit") || "")
    .toUpperCase();

const selectedPackage =
  params.get("package");


const isEditMode =
  Boolean(editCode);


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
   Load existing event for editing
--------------------------------- */

async function loadEditEvent() {

  if (!isEditMode) {
    return;
  }

  try {

    status.textContent =
      "Loading your event…";

    const {
      data: event,
      error
    } =
      await supabase
        .from("events")
        .select("*")
        .eq("code", editCode)
        .single();


    if (error) {
      throw error;
    }


    /* -------------------------------
       Fill basic information
    ------------------------------- */

    eventType.value =
      event.event_type;

    eventName.value =
      event.event_name;

    eventDate.value =
      event.event_date;

    startTime.value =
      event.start_time.slice(0, 5);

    endTime.value =
      event.end_time.slice(0, 5);


    /* -------------------------------
       Fill TV choice
    ------------------------------- */

    const tvChoice =
      document.querySelector(
        `input[name="hasTV"][value="${event.has_tv ? "true" : "false"}"]`
      );

    if (tvChoice) {
      tvChoice.checked = true;
    }


    /* -------------------------------
       Fill theme
    ------------------------------- */

    const themeChoice =
      document.querySelector(
        `input[name="theme"][value="${event.theme}"]`
      );

    if (themeChoice) {
      themeChoice.checked = true;
    }


    /* -------------------------------
       Fill background
    ------------------------------- */

    const backgroundChoice =
      document.querySelector(
        `input[name="background"][value="${event.background}"]`
      );

    if (backgroundChoice) {
      backgroundChoice.checked = true;
    }


    /* -------------------------------
       Fill colors
    ------------------------------- */

    if (primaryColor) {
      primaryColor.value =
        event.primary_color || "#b97979";
    }

    if (secondaryColor) {
      secondaryColor.value =
        event.secondary_color || "#fffaf8";
    }

    if (accentColor) {
      accentColor.value =
        event.accent_color || "#c8a24a";
    }


    /* -------------------------------
       Set package
    ------------------------------- */

    const packageToUse =
      event.package || "instant";

    console.log(
      "EDITING EVENT:",
      event
    );

    console.log(
      "EVENT PACKAGE:",
      packageToUse
    );


    /* -------------------------------
       Update button
    ------------------------------- */

    createBtn.textContent =
      "Save Event Changes";

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

  }

}


/* ---------------------------------
   Load edit mode
--------------------------------- */

loadEditEvent();


/* ---------------------------------
   Create or update event
--------------------------------- */

createBtn.addEventListener(
  "click",
  async () => {

    status.textContent = "";


    /* -------------------------------
       Get package
    ------------------------------- */

    let currentPackage =
      selectedPackage;


    /* -------------------------------
       If editing, get package
       directly from the event
    ------------------------------- */

    if (isEditMode) {

      const {
        data: existingEvent,
        error: existingEventError
      } =
        await supabase
          .from("events")
          .select("package")
          .eq("code", editCode)
          .single();


      if (existingEventError) {

        console.error(
          "PACKAGE LOAD ERROR:",
          existingEventError
        );

        status.textContent =
          "Could not load the event package.";

        return;

      }


      currentPackage =
        existingEvent.package;

    }


    /* -------------------------------
       Validate package
    ------------------------------- */

    if (
      currentPackage !== "instant" &&
      currentPackage !== "plus"
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
      currentPackage === "plus"
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


    /* --------------------------------
       Disable button
    -------------------------------- */

    createBtn.disabled = true;

    createBtn.textContent =
      isEditMode
        ? "Saving changes…"
        : "Creating event…";


    try {

      /* =================================
         EDIT EXISTING EVENT
      ================================= */

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
                hasTV

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


      /* =================================
         CREATE NEW EVENT
      ================================= */

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
              currentPackage,

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
        currentPackage
      );


      /* -----------------------------
         Continue
      ----------------------------- */

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
