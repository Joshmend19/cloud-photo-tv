import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";
import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  EMAILJS_PUBLIC_KEY,
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID
} from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY
});

const $ = id => document.getElementById(id);

function show(id) {
  ["loading", "tvView", "uploadView"].forEach(x => {
    $(x).classList.add("hidden");
  });

  $(id).classList.remove("hidden");
}

const codeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  return Array.from(
    { length: 6 },
    () => codeChars[Math.floor(Math.random() * codeChars.length)]
  ).join("");
}

function tvUrl(code) {
  return `${location.origin}${location.pathname}?send=${encodeURIComponent(code)}`;
}

async function createSession() {
  for (let i = 0; i < 8; i++) {
    const code = makeCode();

    const { data } = await supabase
      .from("sessions")
      .select("code")
      .eq("code", code)
      .maybeSingle();

    if (!data) {
      const { error } = await supabase
        .from("sessions")
        .insert({ code, active: true });

      if (!error) return code;
    }
  }

  throw new Error("Could not create a TV code.");
}

async function makeQR(code) {
  const dataUrl = await QRCode.toDataURL(tvUrl(code), {
    width: 420,
    margin: 1
  });

  $("tvQr").innerHTML = `<img src="${dataUrl}" alt="QR code">`;
}

async function sendGalleryEmails(code) {
  const { data: emails, error } = await supabase
    .from("emails")
    .select("email")
    .eq("session_code", code);

  if (error) throw error;

  if (!emails || emails.length === 0) {
    return 0;
  }

  const galleryLink =
    `${location.origin}${location.pathname.replace("index.html", "")}gallery.html?code=${encodeURIComponent(code)}`;

  for (const row of emails) {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: row.email,
        gallery_link: galleryLink
      }
    );
  }

  return emails.length;
}

async function startTV() {
  show("tvView");

  let code = sessionStorage.getItem("cptv_code");

  if (!code) {
    code = await createSession();
    sessionStorage.setItem("cptv_code", code);
  }

  $("tvCode").textContent = code;
  await makeQR(code);

  const sendGalleryBtn = $("sendGalleryBtn");
  const emailStatus = $("emailStatus");

  if (sendGalleryBtn) {
    sendGalleryBtn.onclick = async () => {
      sendGalleryBtn.disabled = true;
      emailStatus.textContent = "Sending gallery emails…";

      try {
        const count = await sendGalleryEmails(code);

        if (count === 0) {
          emailStatus.textContent =
            "No guest emails have been collected yet.";
        } else {
          emailStatus.textContent =
            `✓ Gallery sent to ${count} guest${count === 1 ? "" : "s"}.`;
        }
      } catch (error) {
        console.error(error);

        emailStatus.textContent =
          "Could not send the gallery emails.";
      } finally {
        sendGalleryBtn.disabled = false;
      }
    };
  }

  // All photos currently in the session
  let photos = [];

  // Which photo is currently being displayed
  let currentIndex = 0;

  // Timer for cycling through photos
  let slideshowTimer = null;

  function showPhoto(photo) {
    $("emptyTv").classList.add("hidden");
    $("currentPhoto").classList.remove("hidden");

    $("currentPhoto").src = photo.url;
  }

  function startSlideshow() {
    if (slideshowTimer) {
      clearInterval(slideshowTimer);
      slideshowTimer = null;
    }

    if (photos.length <= 1) {
      if (photos.length === 1) {
        currentIndex = 0;
        showPhoto(photos[0]);
      }

      return;
    }

    showPhoto(photos[currentIndex]);

    slideshowTimer = setInterval(() => {
      currentIndex =
        (currentIndex + 1) % photos.length;

      showPhoto(photos[currentIndex]);

    }, 5000);
  }

  function addPhoto(photo) {
    // Avoid adding the same photo twice
    if (photos.some(existing => existing.id === photo.id)) {
      return;
    }

    photos.push(photo);

    // Start/restart the slideshow so the new photo is included
    startSlideshow();

    $("tvStatus").textContent =
      `${photos.length} photo${photos.length === 1 ? "" : "s"} received`;
  }

  // Connect to Supabase Realtime
  const channel = supabase
    .channel("photos-" + code)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "photos",
        filter: `session_code=eq.${code}`
      },
      payload => {
        console.log(
          "REALTIME PHOTO RECEIVED:",
          payload.new
        );

        addPhoto(payload.new);
      }
    )
    .subscribe(status => {
      console.log(
        "REALTIME STATUS:",
        status
      );
    });

  // Load all existing photos
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("session_code", code)
    .order("created_at", {
      ascending: true
    });

  if (error) throw error;

  photos = data || [];

  if (photos.length) {
    startSlideshow();
  }

  $("tvStatus").textContent =
    photos.length
      ? `${photos.length} photo${photos.length === 1 ? "" : "s"} received`
      : "Ready for photos";

  if ($("newTvBtn")) {
    $("newTvBtn").onclick = () => {
      if (slideshowTimer) {
        clearInterval(slideshowTimer);
      }

      sessionStorage.removeItem("cptv_code");
      location.reload();
    };
  }
}

async function startUpload(code) {
  show("uploadView");

  const { data: session } = await supabase
    .from("sessions")
    .select("active")
    .eq("code", code)
    .maybeSingle();

  if (!session?.active) {
    $("uploadDescription").textContent =
      "This TV session is no longer active.";

    return;
  }

  $("uploadDescription").textContent =
    `Send a photo to TV ${code}.`;

  const input = $("photoInput");
  const email = $("emailInput");
  const button = $("uploadBtn");
  const label = $("fileLabel");
  const status = $("uploadStatus");

  input.onchange = () => {
    const file = input.files?.[0];

    button.disabled = !file;

    label.textContent =
      file?.name || "Choose a photo";

    if (file && file.size > 6 * 1024 * 1024) {
      status.textContent =
        "Please choose a photo under 6 MB.";

      button.disabled = true;

    } else {
      status.textContent = "";
    }
  };

  button.onclick = async () => {
    const file = input.files?.[0];

    const mail =
      email.value.trim().toLowerCase();

    if (!file || !mail.includes("@")) {
      status.textContent =
        "Please choose a photo and enter a valid email.";

      return;
    }

    button.disabled = true;
    status.textContent = "Uploading…";

    try {
      const extension =
        file.name.split(".").pop().toLowerCase();

      const path =
        `${code}/${crypto.randomUUID()}.${extension}`;

      const upload = await supabase.storage
        .from("photos")
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        });

      if (upload.error) {
        throw upload.error;
      }

      const { data: publicUrl } =
        supabase.storage
          .from("photos")
          .getPublicUrl(path);

      const photoInsert = await supabase
        .from("photos")
        .insert({
          session_code: code,
          url: publicUrl.publicUrl,
          path,
          email: mail
        });

      if (photoInsert.error) {
        throw photoInsert.error;
      }

      const emailInsert = await supabase
        .from("emails")
        .upsert(
          {
            session_code: code,
            email: mail
          },
          {
            onConflict: "session_code,email"
          }
        );

      if (emailInsert.error) {
        throw emailInsert.error;
      }

      status.textContent =
        "✓ Sent! The photo is on the TV.";

      input.value = "";

      label.textContent =
        "Choose another photo";

    } catch (error) {
      console.error(error);

      status.textContent =
        "Upload failed. Check your Supabase setup.";

    } finally {
      button.disabled = false;
    }
  };
}

(async () => {
  try {
    if (SUPABASE_URL.startsWith("PASTE_")) {
      throw new Error(
        "Supabase not configured."
      );
    }

    const params =
      new URLSearchParams(location.search);

    const sendCode =
      params.get("send");

    if (sendCode) {
      await startUpload(
        sendCode.toUpperCase()
      );

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
