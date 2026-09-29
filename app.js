import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


const $ = id =>
  document.getElementById(id);


function show(id) {

  ["loading", "tvView", "uploadView"]
    .forEach(x => {
      $(x).classList.add("hidden");
    });

  $(id).classList.remove("hidden");
}


/*
  Get the event/session code from the URL.
*/

const params =
  new URLSearchParams(
    location.search
  );


const urlCode =
  (
    params.get("code") ||
    params.get("send") ||
    ""
  ).toUpperCase();


/*
  Create a temporary TV code for the
  original prototype if no event code
  is provided.
*/

const codeChars =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


function makeCode() {

  return Array.from(
    { length: 6 },
    () =>
      codeChars[
        Math.floor(
          Math.random() *
          codeChars.length
        )
      ]
  ).join("");

}


function uploadUrl(code) {

  return `${location.origin}${location.pathname}?send=${encodeURIComponent(code)}`;

}


/*
  Create an old-style session only when
  someone opens the TV page without an
  event code.
*/

async function createSession() {

  for (let i = 0; i < 8; i++) {

    const code =
      makeCode();


    const { data } =
      await supabase
        .from("sessions")
        .select("code")
        .eq("code", code)
        .maybeSingle();


    if (!data) {

      const { error } =
        await supabase
          .from("sessions")
          .insert({
            code,
            active: true
          });


      if (!error) {
        return code;
      }

    }

  }


  throw new Error(
    "Could not create a TV code."
  );

}


/*
  Generate the guest upload QR code.
*/

async function makeQR(code) {

  const dataUrl =
    await QRCode.toDataURL(
      uploadUrl(code),
      {
        width: 420,
        margin: 1
      }
    );


  if ($("tvQr")) {

    $("tvQr").innerHTML =
      `<img src="${dataUrl}" alt="QR code">`;

  }

}


/*
  Start the TV display.
*/

async function startTV() {

  show("tvView");


  let code =
    urlCode ||
    sessionStorage.getItem(
      "cptv_code"
    );


  /*
    If this is an event-created TV page,
    use the event code from the URL.

    Otherwise create/use the old
    prototype session.
  */

  if (!code) {

    code =
      await createSession();

    sessionStorage.setItem(
      "cptv_code",
      code
    );

  }


  /*
    Make sure the session exists.
  */

  const {
    data: session,
    error: sessionError
  } =
    await supabase
      .from("sessions")
      .select("*")
      .eq("code", code)
      .maybeSingle();


  if (sessionError) {
    throw sessionError;
  }


  if (!session) {

    throw new Error(
      "This event session could not be found."
    );

  }


  const eventId =
    session.event_id || null;


  /*
    Display the event/session code.
  */

  if ($("tvCode")) {

    $("tvCode").textContent =
      code;

  }


  /*
    Generate the guest QR code.
  */

  await makeQR(code);


  /*
    Store all photos for this TV.
  */

  let photos = [];


  let currentIndex = 0;


  let slideshowTimer = null;


  function showPhoto(photo) {

    $("emptyTv").classList.add(
      "hidden"
    );

    $("currentPhoto").classList.remove(
      "hidden"
    );

    $("currentPhoto").src =
      photo.url;

  }


  function startSlideshow() {

    if (slideshowTimer) {

      clearInterval(
        slideshowTimer
      );

      slideshowTimer = null;

    }


    if (photos.length === 0) {

      return;

    }


    /*
      Show the current photo immediately.
    */

    showPhoto(
      photos[currentIndex]
    );


    /*
      If there is only one photo,
      leave it displayed.
    */

    if (photos.length === 1) {

      return;

    }


    /*
      Cycle through photos every 5 seconds.
    */

    slideshowTimer =
      setInterval(() => {

        currentIndex =
          (
            currentIndex + 1
          ) %
          photos.length;


        showPhoto(
          photos[currentIndex]
        );

      }, 5000);

  }


  function addPhoto(photo) {

    /*
      Prevent duplicate photos.
    */

    if (
      photos.some(
        existing =>
          existing.id === photo.id
      )
    ) {

      return;

    }


    photos.push(photo);


    /*
      Include the new photo
      in the slideshow.
    */

    startSlideshow();


    if ($("tvStatus")) {

      $("tvStatus").textContent =
        `${photos.length} photo${photos.length === 1 ? "" : "s"} received`;

    }

  }


  /*
    Listen for new photos in real time.
  */

  const channel =
    supabase
      .channel(
        "photos-" + code
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter:
            `session_code=eq.${code}`
        },
        payload => {

          console.log(
            "REALTIME PHOTO RECEIVED:",
            payload.new
          );


          /*
            If this event has an event_id,
            only accept photos belonging
            to this event.
          */

          if (
            eventId &&
            payload.new.event_id &&
            payload.new.event_id !== eventId
          ) {

            return;

          }


          addPhoto(
            payload.new
          );

        }
      )
      .subscribe(status => {

        console.log(
          "REALTIME STATUS:",
          status
        );

      });


  /*
    Load existing photos.
  */

  let photoQuery =
    supabase
      .from("photos")
      .select("*")
      .eq(
        "session_code",
        code
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  /*
    If this is a new event,
    make sure we only load photos
    belonging to that event.
  */

  if (eventId) {

    photoQuery =
      photoQuery.eq(
        "event_id",
        eventId
      );

  }


  const {
    data,
    error
  } =
    await photoQuery;


  if (error) {

    throw error;

  }


  photos =
    data || [];


  if (photos.length) {

    startSlideshow();

  }


  if ($("tvStatus")) {

    $("tvStatus").textContent =
      photos.length
        ? `${photos.length} photo${photos.length === 1 ? "" : "s"} received`
        : "Ready for photos";

  }


  /*
    The old "New TV" button is no longer
    needed for event-created TVs.
  */

  if ($("newTvBtn")) {

    $("newTvBtn").style.display =
      "none";

  }

}


/*
  Start the guest upload page.
*/

async function startUpload(code) {

  show("uploadView");


  /*
    Find the session and event.
  */

  const {
    data: session,
    error: sessionError
  } =
    await supabase
      .from("sessions")
      .select("*")
      .eq("code", code)
      .maybeSingle();


  if (sessionError) {

    throw sessionError;

  }


  if (!session?.active) {

    $("uploadDescription").textContent =
      "This event is no longer active.";

    return;

  }


  const eventId =
    session.event_id || null;


  /*
    Display the event code.
  */

  $("uploadDescription").textContent =
    `Send a photo to TV ${code}.`;


  const input =
    $("photoInput");


  const email =
    $("emailInput");


  const button =
    $("uploadBtn");


  const label =
    $("fileLabel");


  const status =
    $("uploadStatus");


  input.onchange = () => {

    const file =
      input.files?.[0];


    button.disabled =
      !file;


    label.textContent =
      file?.name ||
      "Choose a photo";


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

  };


  button.onclick =
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

        /*
          Create a unique storage path.
        */

        const extension =
          file.name
            .split(".")
            .pop()
            .toLowerCase();


        const path =
          `${code}/${crypto.randomUUID()}.${extension}`;


        /*
          Upload the image.
        */

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


        /*
          Get the public image URL.
        */

        const {
          data: publicUrl
        } =
          supabase.storage
            .from("photos")
            .getPublicUrl(
              path
            );


        /*
          Save the photo record.
        */

        const photoData = {

          session_code:
            code,

          url:
            publicUrl.publicUrl,

          path,

          email:
            mail

        };


        /*
          Connect the photo to
          the event when available.
        */

        if (eventId) {

          photoData.event_id =
            eventId;

        }


        const photoInsert =
          await supabase
            .from("photos")
            .insert(
              photoData
            );


        if (photoInsert.error) {

          throw photoInsert.error;

        }


        /*
          Save the guest email.
        */

        const emailData = {

          session_code:
            code,

          email:
            mail

        };


        /*
          Connect the email to
          the event when available.
        */

        if (eventId) {

          emailData.event_id =
            eventId;

        }


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
          "✓ Sent! The photo is on the TV.";


        input.value =
          "";


        label.textContent =
          "Choose another photo";


      } catch (error) {

        console.error(error);


        status.textContent =
          "Upload failed. Check your Supabase setup.";

      } finally {

        button.disabled =
          false;

      }

    };

}


/*
  Decide which page to show.
*/

(async () => {

  try {

    if (
      SUPABASE_URL.startsWith(
        "PASTE_"
      )
    ) {

      throw new Error(
        "Supabase not configured."
      );

    }


    /*
      ?send=CODE = guest upload page
      ?code=CODE = TV page
      no code = old prototype TV page
    */

    const sendCode =
      params.get("send");


    const eventCode =
      params.get("code");


    if (sendCode) {

      await startUpload(
        sendCode.toUpperCase()
      );

    } else if (eventCode) {

      await startTV();

    } else {

      await startTV();

    }


  } catch (error) {

    console.error(error);


    show("loading");


    $("loading").innerHTML = `
      <div>
        <h2>Something went wrong</h2>
        <p>Check the browser console for the error.</p>
      </div>
    `;

  }

})();
