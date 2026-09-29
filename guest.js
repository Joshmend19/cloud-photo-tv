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

const input =
  document.getElementById("photoInput");

const email =
  document.getElementById("emailInput");

const button =
  document.getElementById("uploadBtn");

const label =
  document.getElementById("fileLabel");

const status =
  document.getElementById("uploadStatus");


let eventId = null;


async function loadEvent() {

  if (!code) {
    eventName.textContent =
      "Event not found.";

    status.textContent =
      "No event code was provided.";

    return;
  }


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


    eventId =
      event.id;

    eventName.textContent =
      event.event_name;


  } catch (error) {

    console.error(error);

    eventName.textContent =
      "Event not found.";

    status.textContent =
      "We could not find this event.";

  }

}


input.addEventListener(
  "change",
  () => {

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


button.addEventListener(
  "click",
  async () => {

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

      console.error(error);

      status.textContent =
        "Upload failed. Please try again.";

    } finally {

      button.disabled =
        false;

    }

  }
);


loadEvent();
