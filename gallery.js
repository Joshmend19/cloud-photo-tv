import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const code = (new URLSearchParams(location.search).get("code") || "").toUpperCase();

const status = document.getElementById("galleryStatus");
const grid = document.getElementById("grid");

if (!code) {
  status.textContent = "No gallery code was provided.";
} else {
  const { data, error } = await supabase
    .from("photos")
    .select("url,created_at")
    .eq("session_code", code)
    .order("created_at", { ascending: true });

  if (error) {
    status.textContent = "Could not load the gallery.";
    console.error(error);
  } else {
    status.textContent = `${data.length} photo${data.length === 1 ? "" : "s"}`;

    if (!data.length) {
      grid.innerHTML = '<div class="empty">No photos have been uploaded yet.</div>';
    } else {
      data.forEach(p => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <a href="${p.url}" target="_blank" rel="noopener">
            <img src="${p.url}" alt="Event photo">
          </a>
        `;
        grid.appendChild(card);
      });
    }
  }
}
