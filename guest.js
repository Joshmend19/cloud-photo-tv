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

const code =
  params.get("code");

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

const eventName =
  document.getElementById(
    "eventName"
  );

const photoInput =
  document.getElementById(
    "photoInput"
  );

const emailInput =
  document.getElementById(
    "emailInput"
  );

const uploadBtn =
  document.getElementById(
    "uploadBtn"
  );

const fileLabel =
  document.getElementById(
    "fileLabel"
  );

const status =
  document.getElementById(
    "uploadStatus"
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

const backFromUploadButton =
  document.getElementById(
    "backFromUpload"
  );

const backFromGalleryRequestButton =
  document.getElementById(
    "backFromGalleryRequest"
  );

let eventId = null;
let eventDate = null;
let eventEndTime = null;
let guestbookEnabled = false;
let rsvpEnabled = false;


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showHub() {
  hubSection.style.display =
    "block";

  uploadSection.style.display =
    "none";

  galleryRequestSection.style.display =
    "none";
}


function showUpload() {
  hubSection.style.display =
    "none";

  uploadSection.style.display =
    "block";

  galleryRequestSection.style.display =
    "none";
}


function showGalleryRequest() {
  hubSection.style.display =
    "none";

  uploadSection.style.display =
    "none";

  galleryRequestSection.style.display =
    "block";
}


/* =========================================================
   EVENT TIME
========================================================= */

function eventHasEnded() {
  if (
    !eventDate ||
    !eventEndTime
  ) {
    return false;
  }

  const endDateTime =
    new Date(
      `${eventDate}T${eventEndTime}`
    );

  if (
    Number.isNaN(
      endDateTime.getTime()
    )
  ) {
    return false;
  }

  return new Date() >= endDateTime;
}


function closeUploadsIfNeeded() {
  if (!eventHasEnded()) {
    return false;
  }

  if (photoInput) {
    photoInput.disabled = true;
  }

  if (uploadBtn) {
    uploadBtn.disabled = true;
  }

  if (fileLabel) {
    fileLabel.textContent =
      "Photo uploads are closed";
  }

  if (status) {
    status.textContent =
      "This event has ended. Photo uploads are closed.";
  }

  return true;
}


/* =========================================================
   SAVE GUEST EMAIL
========================================================= */

async function saveGuestEmail(email) {
  if (!eventId) {
    throw new Error(
      "Event information is not available."
    );
  }

  const cleanEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  if (!cleanEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  const emailData = {
    session_code: code,
    email: cleanEmail,
    event_id: eventId
  };

  console.log(
    "SAVING GUEST EMAIL:",
    JSON.stringify(
      emailData,
      null,
      2
    )
  );

  const {
    data,
    error
  } =
    await supabase
      .from("emails")
      .upsert(
        emailData,
        {
          onConflict:
            "session_code,email"
        }
      )
      .select();

  if (error) {
    console.error(
      "EMAIL SAVE ERROR:",
      JSON.stringify(
        error,
        null,
        2
      )
    );

    throw error;
  }

  console.log(
    "GUEST EMAIL SAVED SUCCESSFULLY:",
    JSON.stringify(
      data,
      null,
      2
    )
  );

  return data;
}


/* =========================================================
   LOAD EVENT
========================================================= */

async function loadEvent() {
  if (!code) {
    if (status) {
      status.textContent =
        "Missing event code.";
    }

    return;
  }

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
    console.error(
      "Event loading error:",
      JSON.stringify(
        error,
        null,
        2
      )
    );

    if (status) {
      status.textContent =
        "Could not load this event.";
    }

    return;
  }

  const event =
    Array.isArray(data)
      ? data[0]
      : data;

  if (!event) {
    if (status) {
      status.textContent =
        "Event not found.";
    }

    return;
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

  console.log(
    "EVENT SETTINGS:",
    JSON.stringify(
      {
        event_id:
          event.id,

        event_code:
          code,

        event_date:
          event.event_date,

        end_time:
          event.end_time,

        guestbook_enabled:
          event.guestbook_enabled,

        rsvp_enabled:
          event.rsvp_enabled
      },
      null,
      2
    )
  );

  if (eventName) {
    eventName.textContent =
      event.event_name ||
      "Captured Moments";
  }

  if (guestbookButton) {
    guestbookButton.style.display =
      guestbookEnabled
        ? "flex"
        : "none";
  }

  if (rsvpButton) {
    rsvpButton.style.display =
      rsvpEnabled
        ? "flex"
        : "none";
  }

  closeUploadsIfNeeded();
}


/* =========================================================
   NAVIGATION BUTTONS
========================================================= */

uploadPhotosButton?.addEventListener(
  "click",
  () => {
    if (
      closeUploadsIfNeeded()
    ) {
      return;
    }

    showUpload();
  }
);


guestbookButton?.addEventListener(
  "click",
  () => {
    window.location.href =
      `guestbook.html?code=${encodeURIComponent(
        code
      )}`;
  }
);


rsvpButton?.addEventListener(
  "click",
  () => {
    window.location.href =
      `rsvp.html?code=${encodeURIComponent(
        code
      )}`;
  }
);


galleryButton?.addEventListener(
  "click",
  () => {
    window.location.href =
      `gallery.html?code=${encodeURIComponent(
        code
      )}`;
  }
);


galleryRequestButton?.addEventListener(
  "click",
  () => {
    showGalleryRequest();
  }
);


backFromUploadButton?.addEventListener(
  "click",
  () => {
    showHub();
  }
);


backFromGalleryRequestButton?.addEventListener(
  "click",
  () => {
    showHub();
  }
);


/* =========================================================
   PHOTO FILE DISPLAY
========================================================= */

photoInput?.addEventListener(
  "change",
  () => {
    const file =
      photoInput.files?.[0];

    if (!file) {
      return;
    }

    if (fileLabel) {
      fileLabel.textContent =
        file.name;
    }
  }
);


/* =========================================================
   PHOTO UPLOAD
========================================================= */

uploadBtn?.addEventListener(
  "click",
  async () => {

    if (
      eventHasEnded()
    ) {
      closeUploadsIfNeeded();
      return;
    }

    const file =
      photoInput.files?.[0];

    const email =
      emailInput.value.trim();

    if (!file) {
      status.textContent =
        "Please choose a photo.";

      return;
    }

    if (!email) {
      status.textContent =
        "Please enter your email.";

      return;
    }

    if (
      file.size >
      6 * 1024 * 1024
    ) {
      status.textContent =
        "Photo must be 6 MB or smaller.";

      return;
    }

    if (!eventId) {
      status.textContent =
        "Event information is not available.";

      return;
    }

    uploadBtn.disabled =
      true;

    status.textContent =
      "Uploading photo...";

    try {

      if (
        eventHasEnded()
      ) {
        closeUploadsIfNeeded();
        return;
      }


      /* -----------------------------------------
         FILE NAME
      ----------------------------------------- */

      const fileExtension =
        file.name
          .split(".")
          .pop()
          .toLowerCase();

      const fileName =
        `${crypto.randomUUID()}.${fileExtension}`;

      const filePath =
        `${code}/${fileName}`;


      /* -----------------------------------------
         STORAGE UPLOAD
      ----------------------------------------- */

      const {
        error: storageError
      } =
        await supabase.storage
          .from("photos")
          .upload(
            filePath,
            file,
            {
              contentType:
                file.type,

              upsert:
                false
            }
          );

      if (storageError) {
        throw storageError;
      }


      /* -----------------------------------------
         CHECK EVENT AGAIN
      ----------------------------------------- */

      if (
        eventHasEnded()
      ) {
        closeUploadsIfNeeded();
        return;
      }


      /* -----------------------------------------
         PUBLIC PHOTO URL
      ----------------------------------------- */

      const {
        data: publicUrlData
      } =
        supabase.storage
          .from("photos")
          .getPublicUrl(
            filePath
          );

      const url =
        publicUrlData.publicUrl;


      /* -----------------------------------------
         SAVE PHOTO
      ----------------------------------------- */

      const photoData = {
        session_code:
          code,

        url:
          url,

        path:
          filePath,

        email:
          email,

        event_id:
          eventId
      };

      console.log(
        "PHOTO DATA BEING INSERTED:",
        JSON.stringify(
          photoData,
          null,
          2
        )
      );

      const {
        error: photoError
      } =
        await supabase
          .from("photos")
          .insert(
            photoData
          );

      if (photoError) {
        throw photoError;
      }


      /* -----------------------------------------
         SAVE EMAIL WITH EVENT ID
      ----------------------------------------- */

      await saveGuestEmail(
        email
      );


      /* -----------------------------------------
         SUCCESS
      ----------------------------------------- */

      status.textContent =
        "Photo uploaded successfully!";

      photoInput.value =
        "";

      if (fileLabel) {
        fileLabel.textContent =
          "Choose a photo";
      }

    } catch (error) {

      console.error(
        "UPLOAD ERROR:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      status.textContent =
        `Upload failed: ${
          error.message ||
          "Unknown error"
        } | ${
          error.details ||
          ""
        } | ${
          error.hint ||
          ""
        } | ${
          error.code ||
          ""
        }`;
    }

    uploadBtn.disabled =
      false;

    closeUploadsIfNeeded();
  }
);


/* =========================================================
   GALLERY REQUEST
========================================================= */

galleryRequestSubmit?.addEventListener(
  "click",
  async () => {

    const email =
      galleryEmailInput.value.trim();

    if (!email) {
      galleryRequestStatus.textContent =
        "Please enter your email.";

      return;
    }

    if (!eventId) {
      galleryRequestStatus.textContent =
        "Event information is not available.";

      return;
    }

    galleryRequestSubmit.disabled =
      true;

    galleryRequestStatus.textContent =
      "Saving your request...";

    try {

      await saveGuestEmail(
        email
      );

      galleryRequestStatus.textContent =
        "You're all set! You'll receive the gallery link when the event ends.";

      galleryEmailInput.value =
        "";

    } catch (error) {

      console.error(
        "GALLERY REQUEST ERROR:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      galleryRequestStatus.textContent =
        `Request failed: ${
          error.message ||
          "Unknown error"
        }`;
    }

    galleryRequestSubmit.disabled =
      false;
  }
);


/* =========================================================
   START
========================================================= */

loadEvent();
