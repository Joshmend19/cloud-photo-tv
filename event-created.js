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


const params =
  new URLSearchParams(
    window.location.search
  );


const code =
  (params.get("code") || "")
    .toUpperCase();


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


const status =
  document.getElementById("status");


// Format time like 5:00 PM
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


// Format date like October 1, 2026
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
    } = await supabase
      .from("events")
      .select("*")
      .eq("code", code)
      .single();


    if (error) {

      throw error;

    }


    eventName.textContent =
      event.event_name;


    eventCode.textContent =
      event.code;


    eventDetails.textContent =
      `${formatDate(event.event_ date)} • ${formatTime(event.start_time)} – ${formatTime(event.end_time)}`;


    /*
      Guest page
    */

    const guestUrl =
      `${window.location.origin}/cloud-photo-tv/?code=${event.code}`;


    /*
      TV page
    */

    const tvUrl =
      `${window.location.origin}/cloud-photo-tv/?code=${event.code}`;


    /*
      Gallery page
    */

    const galleryUrl =
      `${window.location.origin}/cloud-photo-tv/gallery.html?code=${event.code}`;


    tvLink.href =
      tvUrl;


    galleryLink.href =
      galleryUrl;


    /*
      Generate QR code
    */

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


    status.textContent =
      "Your event is ready.";


  } catch (error) {

    console.error(error);


    eventName.textContent =
      "Could not load event.";


    status.textContent =
      "There was a problem loading this event.";

  }

}
