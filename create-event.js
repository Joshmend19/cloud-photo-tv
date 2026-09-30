import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";


const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ---------------------------------
// Form elements
// ---------------------------------

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

const guestbookEnabled =
  document.getElementById("guestbookEnabled");

const createBtn =
  document.getElementById("createBtn");

const status =
  document.getElementById("status");


// ---------------------------------
// URL / Edit mode
// ---------------------------------

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


// ---------------------------------
// Create event code
// ---------------------------------

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


// ---------------------------------
// Load event for editing
// ---------------------------------

async function loadEditEvent() {

  if (!isEditMode) {
    return;
  }


  try {

    createBtn.disabled = true;

    status.textContent =
      "Loading your event…";


    const {
      data: event,
      error
    } = await supabase

      .from("events")

      .select("*")

      .eq("code", editCode)

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


    // ---------------------------------
    // Package
    // ---------------------------------

    editPackage =
      event.package ||
      "instant";


    if (
      editPackage !== "instant" &&
      editPackage !== "plus"
    ) {

      editPackage =
        "instant";

    }


    console.log(
      "EDIT PACKAGE:",
      editPackage
    );


    // ---------------------------------
    // Event information
    // ---------------------------------

    if (eventType) {

      eventType.value =
        event.event_type || "";

    }


    if (eventName) {

      eventName.value =
        event.event_name || "";

    }


    if (eventDate) {

      eventDate.value =
        event.event_date || "";

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


    // ---------------------------------
    // TV
    // ---------------------------------

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


    // ---------------------------------
    // Theme
    // ---------------------------------

    const themeChoice =
      document.querySelector(
        `input[name="theme"][value="${event.theme}"]`
      );


    if (themeChoice) {

      themeChoice.checked =
        true;

    }


    // ---------------------------------
    // Background
    // ---------------------------------

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
          'input[name="background"][value="default"]'
        );


      if (classicBackground) {

        classicBackground.checked =
          true;

      }

    }


    // ---------------------------------
    // Colors
    // ---------------------------------

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


    // ---------------------------------
    // Guestbook
    // ---------------------------------

    if (guestbookEnabled) {

      guestbookEnabled.checked =
        event.guestbook_enabled === true;

    }


    // ---------------------------------
    // Finish loading
    // ---------------------------------

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


// ---------------------------------
// Create / Save Event
// ---------------------------------

createBtn.addEventListener(
  "click",
  async () => {

    status.textContent = "";


    // ---------------------------------
    // Wait for edit event
    // ---------------------------------

    if (
      isEditMode &&
      !editLoaded
    ) {

      status.textContent =
        "Please wait for your event to finish loading.";

      return;

    }


    // ---------------------------------
    // Get selected package
    // ---------------------------------
    //
    // IMPORTANT:
    // The package is selected by the
    // inline script in create-event.html.
    //
    // We read window.selectedCapturedPackage
    // here instead of reading the URL only once.
    //

    let currentPackage =
      isEditMode
        ? editPackage
        : window.selectedCapturedPackage;


    console.log(
      "SELECTED PACKAGE:",
      currentPackage
    );


    if (
      currentPackage !== "instant" &&
      currentPackage !== "plus"
    ) {

      status.textContent =
        "Please choose a package first.";

      return;

    }


    // ---------------------------------
    // Event name
    // ---------------------------------

    const name =
      eventName.value.trim();


    if (!name) {

      status.textContent =
        "Please enter an event name.";

      eventName.focus();

      return;

    }


    // ---------------------------------
    // Date
    // ---------------------------------

    if (!eventDate.value) {

      status.textContent =
        "Please choose an event date.";

      return;

    }


    // ---------------------------------
    // Time
    // ---------------------------------

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


    // ---------------------------------
    // TV
    // ---------------------------------

    const selectedTV =
      document.querySelector(
        'input[name="hasTV"]:checked'
      );


    const hasTV =
      selectedTV
        ? selectedTV.value === "true"
        : true;


    // ---------------------------------
    // Theme
    // ---------------------------------

    const selectedTheme =
      document.querySelector(
        'input[name="theme"]:checked'
      )?.value ||
      "classic";


    // ---------------------------------
    // Background
    // ---------------------------------

    const selectedBackground =
      document.querySelector(
        'input[name="background"]:checked'
      )?.value ||
      "default";


    // ---------------------------------
    // Guestbook
    // ---------------------------------

    const isGuestbookEnabled =
      guestbookEnabled
        ? guestbookEnabled.checked
        : false;


    // ---------------------------------
    // Default colors
    // ---------------------------------

    let finalPrimaryColor =
      "#b97979";

    let finalSecondaryColor =
      "#fffaf8";

    let finalAccentColor =
      "#c8a24a";

    let finalBackground =
      "default";


    // ---------------------------------
    // Plus customization
    // ---------------------------------

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


    // ---------------------------------
    // Button state
    // ---------------------------------

    createBtn.disabled =
      true;


    createBtn.textContent =
      isEditMode
        ? "Saving changes…"
        : "Creating event…";


    try {


      // =================================
      // EDIT EXISTING EVENT
      // =================================

      if (isEditMode) {

        const {
          data: updatedEvent,
          error: updateError
        } = await supabase

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
              isGuestbookEnabled

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


      // =================================
      // CREATE NEW EVENT
      // =================================

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
        } = await supabase

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


      // ---------------------------------
      // Insert event
      // ---------------------------------

      const {
        data: event,
        error: eventError
      } = await supabase

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
            hasTV,

          guestbook_enabled:
            isGuestbookEnabled

        })

        .select()

        .single();


      if (eventError) {

        throw eventError;

      }


      // ---------------------------------
      // Create session
      // ---------------------------------

      const {
        error: sessionError
      } = await supabase

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


      // ---------------------------------
      // Save event code
      // ---------------------------------

      sessionStorage.setItem(
        "cptv_event_code",
        code
      );


      // ---------------------------------
      // Debug information
      // ---------------------------------

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


      // ---------------------------------
      // Continue
      // ---------------------------------

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
