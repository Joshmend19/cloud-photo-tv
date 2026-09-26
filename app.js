import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function startTV() {
  show("tvView");

  let code = sessionStorage.getItem("cptv_code");

  if (!code) {
    code = await createSession();
    sessionStorage.setItem("cptv_code", code);
  }

  $("tvCode").textContent = code;
  await makeQR(code);

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
      payload => displayPhoto(payload.new)
    )
    .subscribe();

  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("session_code", code)
    .order("created_at", { ascending: true });

  if (error) throw error;

  if (data && data.length) {
    displayPhoto(data[data.length - 1]);
  }

  $("tvStatus").textContent = data?.length
    ? `${data.length} photo${data.length === 1 ? "" : "s"} received`
    : "Ready for photos";

  async function displayPhoto(photo) {
    $("emptyTv").classList.add("hidden");
    $("currentPhoto").classList.remove("hidden");
    $("currentPhoto").src = photo.url;

    const { count } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("session_code", code);

    $("tvStatus").textContent =
      `${count || 1} photo${(count || 1) === 1 ? "" : "s"} received`;
  }

 if ($("newTvBtn")) {
  $("newTvBtn").onclick = () => {
    sessionStorage.removeItem("cptv_code");
    location.reload();
  };
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

    label.textContent = file?.name || "Choose a photo";

    if (file && file.size > 6 * 1024 * 1024) {
      status.textContent = "Please choose a photo under 6 MB.";
      button.disabled = true;
    } else {
      status.textContent = "";
    }
  };

  button.onclick = async () => {
    const file = input.files?.[0];
    const mail = email.value.trim().toLowerCase();

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

      if (upload.error) throw upload.error;

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

      if (photoInsert.error) throw photoInsert.error;

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

      if (emailInsert.error) throw emailInsert.error;

      status.textContent =
        "✓ Sent! The photo is on the TV.";

      input.value = "";
      label.textContent = "Choose another photo";

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
      throw new Error("Supabase not configured.");
    }

    const params = new URLSearchParams(location.search);
    const sendCode = params.get("send");

    if (sendCode) {
      await startUpload(sendCode.toUpperCase());
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
