import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm";

const supabase = createClient(
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

const eventCodeDisplay =
  document.getElementById(
    "eventCode"
  );

const qrCode =
  document.getElementById(
    "qrCode"
  );

const tvLink =
  document.getElementById(
    "tvLink"
  );

const galleryLink =
  document.getElementById(
    "galleryLink"
  );

const rsvpLink =
  document.getElementById(
    "rsvpLink"
  );

const guestbookLink =
  document.getElementById(
    "guestbookLink"
  );

const noTvNotice =
  document.getElementById(
    "noTvNotice"
  );

const editEventLink =
  document.getElementById(
    "editEventLink"
  );

// Stats

const photoCount =
  document.getElementById(
    "photoCount"
  );

const rsvpCount =
  document.getElementById(
    "rsvpCount"
  );

const guestbookCount =
  document.getElementById(
    "guestbookCount"
  );

const tvStatus =
  document.getElementById(
    "tvStatus"
  );

const rsvpStatCard =
  document.getElementById(
    "rsvpStatCard"
  );

const guestbookStatCard =
  document.getElementById(
    "guestbookStatCard"
  );


function formatEventDate(
  dateString
) {

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


/*
--------------------------------
Load Event
--------------------------------
*/

async function loadEvent() {

  if (!eventCode) {

    eventName.textContent =
      "Event Not Found";

    eventDate.textContent =
      "No event code was provided.";

    return;
  }

  const {
    data: event,
    error
  } =
    await supabase
      .from("events")
      .select("*")
      .eq("code", eventCode)
      .single();

  if (
    error ||
    !event
  ) {

    console.error(
      "Error loading event:",
      error
    );

    eventName.textContent =
      "Unable to Load Event";

    eventDate.textContent =
      "Please try again later.";

    return;
  }


  /*
  --------------------------------
  Event Information
  --------------------------------
  */

  eventName.textContent =
    event.event_name ||
    "Your Event";

  eventDate.textContent =
    formatEventDate(
      event.event_date
    );

  eventCodeDisplay.textContent =
    event.code;


  /*
  --------------------------------
  Event URLs
  --------------------------------
  */

  const guestUrl =
    `${window.location.origin}/cloud-photo-tv/guest.html?code=${event.code}`;

  const tvUrl =
    `${window.location.origin}/cloud-photo-tv/tv.html?code=${event.code}`;

  const galleryUrl =
    `${window.location.origin}/cloud-photo-tv/gallery.html?code=${event.code}`;

  const rsvpUrl =
    `${window.location.origin}/cloud-photo-tv/rsvp.html?code=${event.code}`;

  const guestbookUrl =
    `${window.location.origin}/cloud-photo-tv/guestbook.html?code=${event.code}`;


  /*
  --------------------------------
  Gallery
  --------------------------------
  */

  galleryLink.href =
    galleryUrl;

  galleryLink.style.display =
    "block";


  /*
  --------------------------------
  RSVP
  --------------------------------
  */

  const rsvpEnabled =
    event.rsvp_enabled === true;

  if (rsvpEnabled) {

    rsvpLink.href =
      rsvpUrl;

    rsvpLink.style.display =
      "block";

    rsvpStatCard.style.display =
      "block";

  } else {

    rsvpLink.style.display =
      "none";

    rsvpStatCard.style.display =
      "none";
  }


  /*
  --------------------------------
  Guestbook
  --------------------------------
  */

  const guestbookEnabled =
    event.guestbook_enabled === true;

  if (guestbookEnabled) {

    guestbookLink.href =
      guestbookUrl;

    guestbookLink.style.display =
      "block";

    guestbookStatCard.style.display =
      "block";

  } else {

    guestbookLink.style.display =
      "none";

    guestbookStatCard.style.display =
      "none";
  }


  /*
  --------------------------------
  TV Display
  --------------------------------
  */

  const hasTv =
    event.has_tv === true;

  if (hasTv) {

    tvLink.href =
      tvUrl;

    tvLink.style.display =
      "block";

    noTvNotice.style.display =
      "none";

    tvStatus.textContent =
      "Enabled";

  } else {

    tvLink.style.display =
      "none";

    noTvNotice.style.display =
      "block";

    tvStatus.textContent =
      "Off";
  }


  /*
  --------------------------------
  Edit Event
  --------------------------------
  */

  editEventLink.href =
    `create-event.html?edit=${event.code}`;


  /*
  --------------------------------
  QR Code
  --------------------------------
  */

  qrCode.innerHTML =
    "";

  try {

    const canvas =
      document.createElement(
        "canvas"
      );

    await QRCode.toCanvas(
      canvas,
      guestUrl,
      {
        width: 220,
        margin: 2
      }
    );

    qrCode.appendChild(
      canvas
    );

  } catch (error) {

    console.error(
      "QR code error:",
      error
    );
  }


  /*
  --------------------------------
  Load Statistics
  --------------------------------
  */

  await loadEventStats(
    event.id
  );


  console.log(
    "Event loaded:",
    event
  );

  console.log(
    "Guest URL:",
    guestUrl
  );

  console.log(
    "TV URL:",
    tvUrl
  );

  console.log(
    "Gallery URL:",
    galleryUrl
  );

  console.log(
    "RSVP URL:",
    rsvpUrl
  );

  console.log(
    "Guestbook URL:",
    guestbookUrl
  );
}


/*
--------------------------------
Load Event Statistics
--------------------------------
*/

async function loadEventStats(
  eventId
) {

  /*
  --------------------------------
  Photo Count
  --------------------------------
  */

  const {
    count: photos,
    error: photoError
  } =
    await supabase
      .from("photos")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "event_id",
        eventId
      );

  if (photoError) {

    console.error(
      "Photo count error:",
      photoError
    );

    photoCount.textContent =
      "—";

  } else {

    photoCount.textContent =
      photos ?? 0;
  }


  /*
  --------------------------------
  RSVP Count
  --------------------------------
  */

  if (
    rsvpStatCard.style.display !==
    "none"
  ) {

    const {
      count: rsvps,
      error: rsvpError
    } =
      await supabase
        .from("rsvps")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "event_id",
          eventId
        );

    if (rsvpError) {

      console.error(
        "RSVP count error:",
        rsvpError
      );

      rsvpCount.textContent =
        "—";

    } else {

      rsvpCount.textContent =
        rsvps ?? 0;
    }
  }


  /*
  --------------------------------
  Guestbook Count
  --------------------------------
  */

  if (
    guestbookStatCard.style.display !==
    "none"
  ) {

    const {
      count: messages,
      error: guestbookError
    } =
      await supabase
        .from("guestbook")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "event_id",
          eventId
        );

    if (guestbookError) {

      console.error(
        "Guestbook count error:",
        guestbookError
      );

      guestbookCount.textContent =
        "—";

    } else {

      guestbookCount.textContent =
        messages ?? 0;
    }
  }
}


loadEvent();
