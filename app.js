import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";

/*
  1. Create a Firebase project.
  2. Register a Web App.
  3. Copy its config into firebaseConfig below.
*/
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, "us-central1");

const $ = (id) => document.getElementById(id);

function show(view) {
  ["loading", "tvView", "uploadView", "errorView"].forEach(id => $(id).classList.add("hidden"));
  $(view).classList.remove("hidden");
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function ensureAuth() {
  if (!auth.currentUser) await signInAnonymously(auth);
}

async function createTvSession() {
  const code = makeCode();
  await setDoc(doc(db, "sessions", code), {
    createdAt: serverTimestamp(),
    active: true
  });
  return code;
}

function tvUrl(code) {
  return `${location.origin}${location.pathname}?send=${encodeURIComponent(code)}`;
}

async function renderQr(code) {
  const dataUrl = await QRCode.toDataURL(tvUrl(code), {
    width: 420,
    margin: 1,
    errorCorrectionLevel: "M"
  });
  $("tvQr").innerHTML = `<img src="${dataUrl}" alt="QR code for this TV">`;
}

async function startTv() {
  show("tvView");
  let code = sessionStorage.getItem("cloudPhotoTvCode");
  if (!code) {
    code = await createTvSession();
    sessionStorage.setItem("cloudPhotoTvCode", code);
  }

  $("tvCode").textContent = code;
  await renderQr(code);

  const emailBtn = document.createElement("button");
  emailBtn.className = "smallBtn";
  emailBtn.textContent = "Email Gallery";
  emailBtn.title = "Send the gallery link to everyone who entered an email";
  emailBtn.addEventListener("click", async () => {
    if (!confirm("Send the photo gallery link to everyone who entered an email?")) return;
    emailBtn.disabled = true;
    emailBtn.textContent = "Sending…";
    try {
      const sendGalleryEmails = httpsCallable(functions, "sendGalleryEmails");
      const result = await sendGalleryEmails({ code });
      alert(`Sent the gallery email to ${result.data.sent} people.`);
    } catch (e) {
      console.error(e);
      alert("The gallery email could not be sent. Finish the email-service setup in SETUP.md.");
    } finally {
      emailBtn.disabled = false;
      emailBtn.textContent = "Email Gallery";
    }
  });
  $("newTvBtn").before(emailBtn);

  const photos = collection(db, "sessions", code, "photos");
  const q = query(photos, orderBy("createdAt", "asc"));

  let first = true;
  onSnapshot(q, snapshot => {
    if (snapshot.empty) {
      $("emptyTv").classList.remove("hidden");
      $("currentPhoto").classList.add("hidden");
      $("tvStatus").textContent = "Ready for photos";
      return;
    }

    const latest = snapshot.docs[snapshot.docs.length - 1].data();
    $("emptyTv").classList.add("hidden");
    $("currentPhoto").classList.remove("hidden");
    $("currentPhoto").src = latest.url;
    $("tvStatus").textContent = `${snapshot.size} photo${snapshot.size === 1 ? "" : "s"} received`;

    if (!first) {
      $("currentPhoto").animate(
        [{ opacity: 0.15 }, { opacity: 1 }],
        { duration: 500, easing: "ease-out" }
      );
    }
    first = false;
  }, err => {
    console.error(err);
    $("tvStatus").textContent = "Connection error";
  });
}

async function startUpload(code) {
  show("uploadView");

  const sessionSnap = await getDoc(doc(db, "sessions", code));
  if (!sessionSnap.exists() || sessionSnap.data().active !== true) {
    $("uploadDescription").textContent = "This TV session is no longer active.";
    return;
  }

  $("uploadDescription").textContent = `Send a photo to TV ${code}.`;
  const input = $("photoInput");
  const emailInput = $("emailInput");
  const button = $("uploadBtn");
  const label = $("fileLabel");
  const status = $("uploadStatus");

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) {
      button.disabled = true;
      label.textContent = "Choose a photo";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      button.disabled = true;
      label.textContent = "Unsupported image type";
      status.textContent = "Please choose a JPG, PNG, or WEBP image.";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      button.disabled = true;
      label.textContent = "Photo is too large";
      status.textContent = "Please choose an image smaller than 10 MB.";
      return;
    }
    button.disabled = false;
    label.textContent = file.name;
    status.textContent = "";
  });

  button.addEventListener("click", async () => {
    const file = input.files?.[0];
    const email = emailInput.value.trim();

    if (!file) return;
    if (!email || !email.includes("@")) {
      status.textContent = "Please enter a valid email address.";
      emailInput.focus();
      return;
    }

    button.disabled = true;
    status.textContent = "Uploading…";

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `sessions/${code}/${crypto.randomUUID()}-${safeName}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "sessions", code, "photos"), {
        url,
        path,
        email,
        createdAt: serverTimestamp()
      });

      // Register the email for the end-of-event gallery email.
      await setDoc(
        doc(db, "sessions", code, "emails", email.toLowerCase()),
        { email: email.toLowerCase(), createdAt: serverTimestamp() },
        { merge: true }
      );

      status.textContent = "✓ Sent! Your photo is on the TV, and this email will receive the gallery link.";
      input.value = "";
      label.textContent = "Choose another photo";
    } catch (err) {
      console.error(err);
      status.textContent = "Upload failed. Check the Firebase setup and try again.";
    } finally {
      button.disabled = false;
    }
  });
}

$("newTvBtn").addEventListener("click", async () => {
  sessionStorage.removeItem("cloudPhotoTvCode");
  location.reload();
});

(async () => {
  try {
    await ensureAuth();
    const params = new URLSearchParams(location.search);
    const sendCode = params.get("send");

    if (sendCode) {
      await startUpload(sendCode.toUpperCase());
    } else {
      await startTv();
    }
  } catch (err) {
    console.error(err);
    show("errorView");
    $("errorText").textContent =
      "Firebase is not configured yet. Follow the SETUP.md instructions in the project.";
  }
})();
