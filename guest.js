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
    "backFromUploadButton"
  );

const backFromGalleryRequestButton =
  document.getElementById(
    "backFromGalleryRequestButton"
  );

let eventId = null;
let eventDate = null;
let eventEndTime = null;
let guestbookEnabled = false;
let rsvpEnabled = false;

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
      error
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

  if (eventName) {
    eventName.textContent =
      event.event_name ||
      "Captured Moments";
  }

  if (
    guestbookButton
  ) {
    guestbookButton.style.display =
      guestbookEnabled
        ? "block"
        : "none";
  }

  if (
    rsvpButton
  ) {
    rsvpButton.style.display =
      rsvpEnabled
        ? "block"
        : "none";
  }

  closeUploadsIfNeeded();
}

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

photoInput?.addEventListener(
  "change",
  () => {

    const file =
      photoInput.files?.[0];

    if (!file) {
      return;
    }

    if (
      fileLabel
    ) {
      fileLabel.textContent =
        file.name;
    }
  }
);

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

      const fileExtension =
        file.name
          .split(".")
          .pop()
          .toLowerCase();

      const fileName =
        `${crypto.randomUUID()}.${fileExtension}`;

      const filePath =
        `${code}/${fileName}`;

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
              upsert: false
            }
          );

      if (storageError) {
        throw storageError;
      }

      if (
        eventHasEnded()
      ) {

        closeUploadsIfNeeded();

        return;
      }

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

      const photoData = {
        session_code: code,
        url: url,
        path: filePath,
        email: email,
        event_id: eventId
      };

      console.log(
        "PHOTO DATA BEING INSERTED:",
        photoData
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

      const {
        error: emailError
      } =
        await supabase
          .from("emails")
          .upsert(
            {
              session_code: code,
              email: email,
              event_id: eventId
            },
            {
              onConflict:
                "session_code,email"
            }
          );

      if (emailError) {
        console.warn(
          "Email save warning:",
          emailError
        );
      }

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
    }

    uploadBtn.disabled =
      false;

    closeUploadsIfNeeded();
  }
);

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

      const {
        error
      } =
        await supabase
          .from("emails")
          .upsert(
            {
              session_code: code,
              email: email,
              event_id: eventId
            },
            {
              onConflict:
                "session_code,email"
            }
          );

      if (error) {
        throw error;
      }

      galleryRequestStatus.textContent =
        "You're all set! You'll receive the gallery link when the event ends.";

      galleryEmailInput.value =
        "";

    } catch (error) {

      console.error(
        "GALLERY REQUEST ERROR:",
        error
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

loadEvent();
