import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
const params = new URLSearchParams(location.search);
const code = (params.get("code") || "").toUpperCase();

if (!code) {
  document.getElementById("galleryStatus").textContent = "No gallery code was provided.";
} else {
  await signInAnonymously(auth);
  const q = query(
    collection(db, "sessions", code, "photos"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snap => {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    document.getElementById("galleryStatus").textContent =
      `${snap.size} photo${snap.size === 1 ? "" : "s"}`;

    if (snap.empty) {
      grid.innerHTML = '<div class="empty">No photos have been uploaded yet.</div>';
      return;
    }

    snap.forEach(doc => {
      const photo = doc.data();
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `<a href="${photo.url}" target="_blank" rel="noopener"><img src="${photo.url}" alt="Event photo"></a>`;
      grid.appendChild(card);
    });
  });
}
