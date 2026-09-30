import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const params =
  new URLSearchParams(
    window.location.search
  );

const code =
  (params.get("code") || "")
    .toUpperCase();

const eventName =
  document.getElementById("eventName");

const eventCode =
  document.getElementById("eventCode");

const gallery =
  document.getElementById("gallery");

const status =
  document.getElementById("status");

const downloadAllBtn =
  document.getElementById("downloadAllBtn");

const rsvpSection =
  document.getElementById("rsvpSection");

const rsvpForm =
  document.getElementById("rsvpForm");

const rsvpName =
  document.getElementById("rsvpName");

const rsvpEmail =
  document.getElementById("rsvpEmail");

const guestCount =
  document.getElementById("guestCount");

const rsvpMessage =
  document.getElementById("rsvpMessage");

const submitRsvpBtn =
  document.getElementById("submitRsvpBtn");

const rsvpMessageStatus =
  document.getElementById(
    "rsvpMessageStatus"
  );

const guestCountGroup =
  document.getElementById(
    "guestCountGroup"
  );

let photos = [];

let currentEvent = null;


/* ---------------------------------
   Load gallery
--------------------------------- */

async function loadGallery() {

  if (!code) {

    eventName.textContent =
      "Event Gallery";

    eventCode.textContent =
      "No event code";

    status.textContent =
      "No event code was provided.";

    return;

  }


  try {

    /* ---------------------------------
       Get event
    --------------------------------- */

    const {
      data: event,
      error: eventError
    } =
      await supabase
        .from("events")
        .select("*")
        .eq("code", code)
        .single();


    if (eventError) {
      throw eventError;
    }


    if (!event) {

      throw new Error(
        "Event not found."
      );

    }


    currentEvent =
      event;


    eventName.textContent =
      event.event_name;

    eventCode.textContent =
      `EVENT ${event.code}`;


    /* ---------------------------------
       Show RSVP if enabled
    --------------------------------- */

    if (
      event.rsvp_enabled === true &&
      rsvpSection
    ) {

      rsvpSection.style.display =
        "block";

    }


    /* ---------------------------------
       Get photos
    --------------------------------- */

    const {
      data,
      error
    } =
      await supabase
        .from("photos")
        .select("*")
        .eq(
          "event_id",
          event.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    photos =
      data || [];


    renderGallery();


  } catch (error) {

    console.error(
      "GALLERY ERROR:",
      error
    );

    status.textContent =
      "There was a problem loading the gallery.";

  }

}


/* ---------------------------------
   Render gallery
--------------------------------- */

function renderGallery() {

  gallery.innerHTML =
    "";


  if (photos.length === 0) {

    status.textContent =
      "No photos have been shared yet.";


    gallery.innerHTML = `
      <div class="empty">
        <h2>No Photos Yet</h2>
        <p>
          Photos shared at the event will appear here.
        </p>
      </div>
    `;


    if (downloadAllBtn) {
      downloadAllBtn.disabled = true;
    }


    return;

  }


  status.textContent =
    `${photos.length} photo${photos.length === 1 ? "" : "s"} in this gallery`;


  if (downloadAllBtn) {
    downloadAllBtn.disabled = false;
  }


  photos.forEach(
    (photo, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "photo-card";


      const image =
        document.createElement(
          "img"
        );

      image.src =
        photo.url;

      image.alt =
        `Event photo ${index + 1}`;

      image.loading =
        "lazy";


      const footer =
        document.createElement(
          "div"
        );

      footer.className =
        "photo-footer";


      const number =
        document.createElement(
          "span"
        );

      number.className =
        "photo-number";

      number.textContent =
        `Photo ${index + 1}`;


      const download =
        document.createElement(
          "a"
        );

      download.className =
        "download-link";

      download.href =
        photo.url;

      download.target =
        "_blank";

      download.rel =
        "noopener";

      download.textContent =
        "Download";


      footer.appendChild(
        number
      );

      footer.appendChild(
        download
      );


      card.appendChild(
        image
      );

      card.appendChild(
        footer
      );


      gallery.appendChild(
        card
      );

    }
  );

}


/* ---------------------------------
   RSVP attendance selection
--------------------------------- */

const attendanceInputs =
  document.querySelectorAll(
    'input[name="attending"]'
  );


attendanceInputs.forEach(
  input => {

    input.addEventListener(
      "change",
      () => {

        if (
          input.value === "false" &&
          input.checked
        ) {

          guestCount.value =
            "1";

          guestCountGroup.style.display =
            "none";

        }


        if (
          input.value === "true" &&
          input.checked
        ) {

          guestCountGroup.style.display =
            "grid";

        }

      }
    );

  }
);


/* ---------------------------------
   Submit RSVP
--------------------------------- */

if (rsvpForm) {

  rsvpForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!currentEvent) {

        rsvpMessageStatus.textContent =
          "Event information has not loaded yet.";

        return;

      }


      const selectedAttendance =
        document.querySelector(
          'input[name="attending"]:checked'
        );


      if (!selectedAttendance) {

        rsvpMessageStatus.textContent =
          "Please choose whether you are attending.";

        return;

      }


      const name =
        rsvpName.value.trim();

      const email =
        rsvpEmail.value.trim();

      const attending =
        selectedAttendance.value === "true";

      const numberOfGuests =
        attending
          ? Number(guestCount.value)
          : 1;

      const message =
        rsvpMessage.value.trim();


      if (!name) {

        rsvpMessageStatus.textContent =
          "Please enter your name.";

        rsvpName.focus();

        return;

      }


      submitRsvpBtn.disabled =
        true;

      submitRsvpBtn.textContent =
        "Submitting…";

      rsvpMessageStatus.textContent =
        "";


      try {

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
          throw error;
        }


        rsvpForm.innerHTML = `
          <div class="rsvp-success">
            Thank you, ${escapeHtml(name)}! Your RSVP has been submitted.
          </div>
        `;


      } catch (error) {

        console.error(
          "RSVP ERROR:",
          error
        );


        rsvpMessageStatus.textContent =
          "Could not submit your RSVP. Please try again.";

        submitRsvpBtn.disabled =
          false;

        submitRsvpBtn.textContent =
          "Submit RSVP";

      }

    }
  );

}


/* ---------------------------------
   Escape HTML
--------------------------------- */

function escapeHtml(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    value;

  return div.innerHTML;

}


/* ---------------------------------
   Download all photos
--------------------------------- */

if (downloadAllBtn) {

  downloadAllBtn.addEventListener(
    "click",
    async () => {

      if (!photos.length) {
        return;
      }


      status.textContent =
        "Preparing downloads...";


      for (
        let i = 0;
        i < photos.length;
        i++
      ) {

        const photo =
          photos[i];


        const link =
          document.createElement(
            "a"
          );

        link.href =
          photo.url;

        link.download =
          `captured-moments-${i + 1}.jpg`;

        link.target =
          "_blank";


        document.body.appendChild(
          link
        );

        link.click();

        link.remove();


        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              300
            )
        );

      }


      status.textContent =
        "Downloads started.";

    }
  );

}


/* ---------------------------------
   Start
--------------------------------- */

loadGallery();
