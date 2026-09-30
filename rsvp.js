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


const params =
  new URLSearchParams(
    window.location.search
  );


const eventCode =
  params.get("code");


const eventName =
  document.getElementById(
    "eventName"
  );


const eventDate =
  document.getElementById(
    "eventDate"
  );


const rsvpForm =
  document.getElementById(
    "rsvpForm"
  );


const rsvpName =
  document.getElementById(
    "rsvpName"
  );


const rsvpEmail =
  document.getElementById(
    "rsvpEmail"
  );


const guestCount =
  document.getElementById(
    "guestCount"
  );


const guestCountGroup =
  document.getElementById(
    "guestCountGroup"
  );


const rsvpMessage =
  document.getElementById(
    "rsvpMessage"
  );


const submitRsvpBtn =
  document.getElementById(
    "submitRsvpBtn"
  );


const rsvpStatus =
  document.getElementById(
    "rsvpStatus"
  );


const successMessage =
  document.getElementById(
    "successMessage"
  );


const successText =
  document.getElementById(
    "successText"
  );


let currentEvent = null;


/* ---------------------------------
   Escape HTML
--------------------------------- */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ---------------------------------
   Format event date
--------------------------------- */

function formatEventDate(dateString) {

  if (!dateString) {
    return "";
  }


  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;

  }


  return date.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );

}


/* ---------------------------------
   Load event
--------------------------------- */

async function loadEvent() {

  if (!eventCode) {

    eventName.textContent =
      "Event Not Found";

    eventDate.textContent =
      "No event code was provided.";

    rsvpForm.style.display =
      "none";

    return;

  }


  const {
    data,
    error
  } =
    await supabase
      .from("events")
      .select("*")
      .eq(
        "code",
        eventCode
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Error loading event:",
      error
    );


    eventName.textContent =
      "Unable to Load Event";

    eventDate.textContent =
      "Please try again later.";

    rsvpForm.style.display =
      "none";

    return;

  }


  if (!data) {

    eventName.textContent =
      "Event Not Found";

    eventDate.textContent =
      "This RSVP link may be invalid or expired.";

    rsvpForm.style.display =
      "none";

    return;

  }


  currentEvent =
    data;


  if (
    data.rsvp_enabled !== true
  ) {

    eventName.textContent =
      data.event_name ||
      "Event";

    eventDate.textContent =
      "RSVP is not available for this event.";

    rsvpForm.style.display =
      "none";

    return;

  }


  eventName.textContent =
    data.event_name ||
    "Event";


  eventDate.textContent =
    formatEventDate(
      data.event_date
    );

}


/* ---------------------------------
   Attending selection
--------------------------------- */

document
  .querySelectorAll(
    'input[name="attending"]'
  )
  .forEach(
    (radio) => {

      radio.addEventListener(
        "change",
        () => {

          const attending =
            document.querySelector(
              'input[name="attending"]:checked'
            )?.value;


          if (
            attending === "true"
          ) {

            guestCountGroup.style.display =
              "block";

          } else {

            guestCountGroup.style.display =
              "none";

          }

        }
      );

    }
  );


/* ---------------------------------
   Submit RSVP
--------------------------------- */

rsvpForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    if (!currentEvent) {

      rsvpStatus.textContent =
        "Event information is not available.";

      rsvpStatus.className =
        "status error";

      return;

    }


    const name =
      rsvpName.value.trim();


    const email =
      rsvpEmail.value.trim();


    const attendingValue =
      document.querySelector(
        'input[name="attending"]:checked'
      )?.value;


    if (!attendingValue) {

      rsvpStatus.textContent =
        "Please select whether you are attending.";

      rsvpStatus.className =
        "status error";

      return;

    }


    const attending =
      attendingValue === "true";


    const numberOfGuests =
      attending
        ? Number(
            guestCount.value
          )
        : 0;


    const message =
      rsvpMessage.value.trim();


    if (!name) {

      rsvpStatus.textContent =
        "Please enter your name.";

      rsvpStatus.className =
        "status error";

      return;

    }


    submitRsvpBtn.disabled =
      true;


    submitRsvpBtn.textContent =
      "Submitting...";


    rsvpStatus.textContent =
      "";


    const {
      error
    } =
      await supabase
        .from("rsvps")
        .insert({

          event_id:
            currentEvent.id,

          name,

          email:
            email || null,

          attending,

          guest_count:
            numberOfGuests,

          message:
            message || null

        });


    if (error) {

      console.error(
        "RSVP submission error:",
        error
      );


      submitRsvpBtn.disabled =
        false;


      submitRsvpBtn.textContent =
        "Submit RSVP";


      rsvpStatus.textContent =
        "Couldn't submit your RSVP. Please try again.";

      rsvpStatus.className =
        "status error";

      return;

    }


    rsvpForm.style.display =
      "none";


    successMessage.style.display =
      "block";


    successText.innerHTML =
      `Thank you, <strong>${escapeHtml(name)}</strong>! ` +
      `Your RSVP has been submitted.`;

  }
);


/* ---------------------------------
   Start
--------------------------------- */

loadEvent();
