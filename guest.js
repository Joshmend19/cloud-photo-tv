import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

const supabase =
  createClient(
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


// =========================
// PAGE ELEMENTS
// =========================

const eventName =
  document.getElementById(
    "eventName"
  );

const input =
  document.getElementById(
    "photoInput"
  );

const email =
  document.getElementById(
    "emailInput"
  );

const button =
  document.getElementById(
    "uploadBtn"
  );

const label =
  document.getElementById(
    "fileLabel"
  );

const status =
  document.getElementById(
    "uploadStatus"
  );


// Guest Hub

const hubSection =
  document.getElementById(
    "hubSection"
  );

const uploadSection =
  document.getElementById(
    "uploadSection"
  );

const galleryRequestSection =
  document.getElementById(
    "galleryRequestSection"
  );

const uploadPhotosButton =
  document.getElementById(
    "uploadPhotosButton"
  );

const guestbookButton =
  document.getElementById(
    "guestbookButton"
  );

const rsvpButton =
  document.getElementById(
    "rsvpButton"
  );

const galleryButton =
  document.getElementById(
    "galleryButton"
  );

const galleryRequestButton =
  document.getElementById(
    "galleryRequestButton"
  );

const backFromUpload =
  document.getElementById(
    "backFromUpload"
  );

const backFromGalleryRequest =
  document.getElementById(
    "backFromGalleryRequest"
  );

const hubStatus =
  document.getElementById(
    "hubStatus"
  );

const galleryEmailInput =
  document.getElementById(
    "galleryEmailInput"
  );

const galleryRequestSubmit =
  document.getElementById(
    "galleryRequestSubmit"
  );

const galleryRequestStatus =
  document.getElementById(
    "galleryRequestStatus"
  );


// =========================
// EVENT DATA
// =========================

let eventId = null;
let eventDate = null;
let eventEndTime = null;
let guestbookEnabled = false;
let rsvpEnabled = false;


// =========================
// PAGE NAVIGATION
// =========================

function showHub() {

  hubSection.classList.remove(
    "hidden"
  );

  uploadSection.classList.remove(
    "active"
  );

  galleryRequestSection.classList.remove(
    "active"
  );

}


function showUpload() {

  hubSection.classList.add(
    "hidden"
  );

  uploadSection.classList.add(
    "active"
  );

  galleryRequestSection.classList.remove(
    "active"
  );

}


function showGalleryRequest() {

  hubSection.classList.add(
    "hidden"
  );

  uploadSection.classList.remove(
    "active"
  );

  galleryRequestSection.classList.add(
    "active"
  );

}


// =========================
// EVENT LOAD
// =========================

async function loadEvent() {

  if (!code) {

    eventName.textContent =
      "Event not found.";

    hubStatus.textContent =
      "No event code was provided.";

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "get_public_event",
        {
          p_code: code
        }
      );


    if (error) {
      throw error;
    }


    const event =
      Array.isArray(data)
        ? data[0]
        : data;


    if (!event) {
      throw new Error(
        "Event not found."
      );
    }


    eventId =
      event.id;

    eventDate =
      event.event_date;

    eventEndTime =
      event.end_time;

    guestbookEnabled =
      event.guestbook_enabled === true;

    rsvpEnabled =
      event.rsvp_enabled === true;


    eventName.textContent =
      event.event_name;


    // Show Guestbook only when enabled

    if (
      guestbookEnabled
    ) {

      guestbookButton.classList.remove(
        "hidden"
      );

    }


    // Show RSVP only when enabled

    if (
      rsvpEnabled
    ) {

      rsvpButton.classList.remove(
        "hidden"
      );

    }


    checkEventEnded();


  } catch (error) {

    console.error(
      "EVENT LOAD ERROR:",
      error
    );

    eventName.textContent =
      "Event not found.";

    hubStatus.textContent =
      "We could not find this event.";

  }

}


// =========================
// EVENT END CHECK
// =========================

function checkEventEnded() {

  if (
    !eventDate ||
    !eventEndTime
  ) {

    return false;

  }


  const [
    hours,
    minutes,
    seconds = 0
  ] =
    eventEndTime
      .split(":")
      .map(Number);


  const eventEnd =
    new Date(
      `${eventDate}T00:00:00`
    );


  eventEnd.setHours(
    hours,
    minutes,
    seconds,
    0
  );


  const now =
    new Date();


  if (
    now >= eventEnd
  ) {

    input.disabled =
      true;

    button.disabled =
      true;

    label.textContent =
      "📷 Photo uploads closed";

    status.textContent =
      "This event has ended. Photo uploads are closed.";

    return true;

  }


  return false;

}


// =========================
// UPLOAD BUTTON
// =========================

uploadPhotosButton.addEventListener(
  "click",
  () => {

    showUpload();

  }
);


// =========================
// GUESTBOOK BUTTON
// =========================

guestbookButton.addEventListener(
  "click",
  () => {

    window.location.href =
      `guestbook.html?code=${encodeURIComponent(
        code
      )}`;

  }
);


// =========================
// RSVP BUTTON
// =========================

rsvpButton.addEventListener(
  "click",
  () => {

    window.location.href =
      `rsvp.html?code=${encodeURIComponent(
        code
      )}`;

  }
);


// =========================
// GALLERY BUTTON
// =========================

galleryButton.addEventListener(
  "click",
  () => {

    window.location.href =
      `gallery.html?code=${encodeURIComponent(
        code
      )}`;

  }
);


// =========================
// GALLERY REQUEST
// =========================

galleryRequestButton.addEventListener(
  "click",
  () => {

    showGalleryRequest();

  }
);


// =========================
// BACK BUTTONS
// =========================

backFromUpload.addEventListener(
  "click",
  () => {

    showHub();

  }
);


backFromGalleryRequest.addEventListener(
  "click",
  () => {

    showHub();

  }
);


// =========================
// PHOTO SELECTION
// =========================

input.addEventListener(
  "change",
  () => {

    if (
      checkEventEnded()
    ) {

      return;

    }


    const file =
      input.files?.[0];


    button.disabled =
      !file;


    label.textContent =
      file?.name ||
      "📷 Choose a photo";


    if (
      file &&
      file.size >
      6 * 1024 * 1024
    ) {

      status.textContent =
        "Please choose a photo under 6 MB.";

      button.disabled =
        true;

    } else {

      status.textContent =
        "";

    }

  }
);


// =========================
// PHOTO UPLOAD
// =========================

button.addEventListener(
  "click",
  async () => {

    /*
     * Check immediately before
     * starting the upload.
     */

    if (
      checkEventEnded()
    ) {

      return;

    }


    const file =
      input.files?.[0];


    const mail =
      email.value
        .trim()
        .toLowerCase();


    if (
      !file ||
      !mail.includes("@")
    ) {

      status.textContent =
        "Please choose a photo and enter a valid email.";

      return;

    }


    button.disabled =
      true;

    status.textContent =
      "Uploading…";


    try {

      /*
       * Check again before
       * sending the file to Storage.
       */

      if (
        checkEventEnded()
      ) {

        return;

      }


      const extension =
        file.name
          .split(".")
          .pop()
          .toLowerCase();


      const path =
        `${code}/${crypto.randomUUID()}.${extension}`;


      const upload =
        await supabase.storage
          .from("photos")
          .upload(
            path,
            file,
            {
              contentType:
                file.type,

              upsert:
                false
            }
          );


      if (upload.error) {
        throw upload.error;
      }


      const {
        data: publicUrl
      } =
        supabase.storage
          .from("photos")
          .getPublicUrl(
            path
          );


      /*
       * Check again before
       * creating the permanent
       * photo record.
       */

      if (
        checkEventEnded()
      ) {

        return;

      }


      const photoData = {

        session_code:
          code,

        url:
          publicUrl.publicUrl,

        path,

        email:
          mail,

        event_id:
          eventId

      };


      const photoInsert =
        await supabase
          .from("photos")
          .insert(
            photoData
          );


      if (photoInsert.error) {
        throw photoInsert.error;
      }


      const emailData = {

        session_code:
          code,

        email:
          mail,

        event_id:
          eventId

      };


      const emailInsert =
        await supabase
          .from("emails")
          .upsert(
            emailData,
            {
              onConflict:
                "session_code,email"
            }
          );


      if (emailInsert.error) {
        throw emailInsert.error;
      }


      status.textContent =
        "✓ Photo sent! Check the TV.";


      input.value =
        "";

      label.textContent =
        "📷 Choose another photo";


    } catch (error) {

      console.error(
        "UPLOAD ERROR:",
        error
      );

      status.textContent =
        `Upload failed: ${
          error.message ||
          "Unknown error"
        } | ${
          error.details ||
          ""
        }`;

    } finally {

      if (
        !checkEventEnded()
      ) {

        button.disabled =
          false;

      }

    }

  }
);


// =========================
// GALLERY REQUEST SUBMIT
// =========================

galleryRequestSubmit.addEventListener(
  "click",
  async () => {

    const mail =
      galleryEmailInput.value
        .trim()
        .toLowerCase();


    if (
      !mail ||
      !mail.includes("@")
    ) {

      galleryRequestStatus.textContent =
        "Please enter a valid email address.";

      return;

    }


    galleryRequestSubmit.disabled =
      true;

    galleryRequestStatus.textContent =
      "Saving your email…";


    try {

      const emailData = {

        session_code:
          code,

        email:
          mail,

        event_id:
          eventId

      };


      const emailInsert =
        await supabase
          .from("emails")
          .upsert(
            emailData,
            {
              onConflict:
                "session_code,email"
            }
          );


      if (emailInsert.error) {
        throw emailInsert.error;
      }


      galleryRequestStatus.textContent =
        "✓ You're on the gallery list! We'll send the gallery link when the event is over.";

      galleryEmailInput.value =
        "";


    } catch (error) {

      console.error(
        "GALLERY REQUEST ERROR:",
        error
      );

      galleryRequestStatus.textContent =
        `We couldn't save your email: ${
          error.message ||
          "Unknown error"
        } | ${
          error.details ||
          ""
        }`;

    } finally {

      galleryRequestSubmit.disabled =
        false;

    }

  }
);


// =========================
// START
// =========================

loadEvent();
