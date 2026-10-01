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
let eventEndTime = null;


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
      data,
      error
    } = await supabase.rpc(
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

    eventEndTime =
      event.end_time;

    eventName.textContent =
      event.event_name;


    checkEventEnded();


  } catch (error) {

    console.error(error);

    eventName.textContent =
      "Event not found.";

    status.textContent =
      "We could not find this event.";

  }

}


function checkEventEnded() {

  if (!eventEndTime) {
    return false;
  }


  const now =
    new Date();

  const [hours, minutes, seconds = 0] =
    eventEndTime
      .split(":")
      .map(Number);


  const eventEnd =
    new Date();

  eventEnd.setHours(
    hours,
    minutes,
    seconds,
    0
  );


  if (now >= eventEnd) {

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


input.addEventListener(
  "change",
  () => {

    if (checkEventEnded()) {
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


button.addEventListener(
  "click",
  async () => {

    if (checkEventEnded()) {
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

      if (!checkEventEnded()) {
        button.disabled =
          false;
      }

    }

  }
);


loadEvent();
