import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* ---------------------------------
   Get event code
--------------------------------- */

const params =
  new URLSearchParams(
    window.location.search
  );

const code =
  (params.get("code") || "")
    .toUpperCase();


/* ---------------------------------
   Page elements
--------------------------------- */

const eventName =
  document.getElementById("eventName");

const eventDetails =
  document.getElementById("eventDetails");

const eventCode =
  document.getElementById("eventCode");

const qrCode =
  document.getElementById("qrCode");

const tvLink =
  document.getElementById("tvLink");

const galleryLink =
  document.getElementById("galleryLink");

const tvNotice =
  document.getElementById("tvNotice");

const heroMessage =
  document.getElementById("heroMessage");

const stepTwo =
  document.getElementById("stepTwo");

const stepThree =
  document.getElementById("stepThree");

const status =
  document.getElementById("status");


/* ---------------------------------
   Format time
--------------------------------- */

function formatTime(time) {

  const [hours, minutes] =
    time.split(":");

  const date =
    new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}


/* ---------------------------------
   Format date
--------------------------------- */

function formatDate(dateString) {

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  return date.toLocaleDateString(
    [],
    {
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );
}


/* ---------------------------------
   Load event
--------------------------------- */

if (!code) {

  eventName.textContent =
    "Event not found.";

  status.textContent =
    "No event code was provided.";

} else {

  try {

    const {
      data: event,
      error
    } =
      await supabase
        .from("events")
        .select("*")
        .eq("code", code)
        .single();


    if (error) {

      throw error;

    }


    /* -------------------------------
       Event information
    ------------------------------- */

    eventName.textContent =
      event.event_name;

    eventCode.textContent =
      event.code;

    eventDetails.textContent =
      `${formatDate(event.event_date)} • ${formatTime(event.start_time)} – ${formatTime(event.end_time)}`;


    /* -------------------------------
       Apply saved event colors
    ------------------------------- */

    document.documentElement.style.setProperty(
      "--primary-color",
      event.primary_color || "#2563eb"
    );

    document.documentElement.style.setProperty(
      "--secondary-color",
      event.secondary_color || "#fffdf8"
    );

    document.documentElement.style.setProperty(
      "--accent-color",
      event.accent_color || "#c8a24a"
    );


    /* -------------------------------
       Event URLs
    ------------------------------- */

    const guestUrl =
      `${window.location.origin}/cloud-photo-tv/guest.html?code=${event.code}`;

    const tvUrl =
      `${window.location.origin}/cloud-photo-tv/tv.html?code=${event.code}`;

    const galleryUrl =
      `${window.location.origin}/cloud-photo-tv/gallery.html?code=${event.code}`;


    /* -------------------------------
       Always provide gallery
    ------------------------------- */

    galleryLink.href =
      galleryUrl;


    /* -------------------------------
       TV handling
    ------------------------------- */

    const hasTV =
      event.has_tv === true;


    if (hasTV) {

      /* -----------------------------
         Customer has a TV
      ----------------------------- */

      tvLink.href =
        tvUrl;

      tvLink.style.display =
        "block";

      tvNotice.classList.remove(
        "visible"
      );

      heroMessage.textContent =
        "Everything is set up. Share the QR code with your guests and display their memories live on your TV.";

      stepTwo.textContent =
        "Open the TV Display on the screen you want to use.";

      stepThree.textContent =
        "Guests send photos and they appear live on the TV.";

    } else {

      /* -----------------------------
         Customer does not have a TV
      ----------------------------- */

      tvLink.style.display =
        "none";

      tvNotice.classList.add(
        "visible"
      );

      heroMessage.textContent =
        "Everything is set up. Share the QR code with your guests and start collecting memories.";

      stepTwo.textContent =
        "Guests scan the QR code and upload their photos from their phones.";

      stepThree.textContent =
        "Your event gallery collects the photos so everyone can view and download them.";

    }


    /* -------------------------------
       Generate guest QR code
    ------------------------------- */

    const dataUrl =
      await QRCode.toDataURL(
        guestUrl,
        {
          width: 500,
          margin: 2
        }
      );


    const image =
      document.createElement("img");


    image.src =
      dataUrl;

    image.alt =
      "Guest QR Code";


    qrCode.innerHTML =
      "";

    qrCode.appendChild(
      image
    );


    /* -------------------------------
       Status
    ------------------------------- */

    status.textContent =
      "Your event is ready.";


    /* -------------------------------
       Console information
    ------------------------------- */

    console.log(
      "Guest upload URL:",
      guestUrl
    );

    console.log(
      "TV access:",
      hasTV
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
      "Primary color:",
      event.primary_color
    );

    console.log(
      "Secondary color:",
      event.secondary_color
    );

    console.log(
      "Accent color:",
      event.accent_color
    );


  } catch (error) {

    console.error(
      "EVENT CREATED PAGE ERROR:",
      error
    );


    eventName.textContent =
      "Could not load event.";

    status.textContent =
      "There was a problem loading this event.";

  }

}
