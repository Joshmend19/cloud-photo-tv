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

let photos = [];


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

    // Get the event
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


    eventName.textContent =
      event.event_name;

    eventCode.textContent =
      `EVENT ${event.code}`;


    // Get all photos for this event
    const {
      data,
      error
    } =
      await supabase
        .from("photos")
        .select("*")
        .eq("event_id", event.id)
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
          `instant-moments-${i + 1}.jpg`;

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


loadGallery();
