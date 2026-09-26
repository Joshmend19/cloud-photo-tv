import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const code =
  (new URLSearchParams(location.search).get("code") || "")
    .toUpperCase();

const status = document.getElementById("galleryStatus");
const grid = document.getElementById("grid");
const downloadAll = document.getElementById("downloadAll");

let photos = [];

function getFileExtension(url) {
  const cleanUrl = url.split("?")[0];
  const extension = cleanUrl.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

async function downloadPhoto(url, filename) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not download photo.");
  }

  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(blobUrl);
}

async function downloadAllPhotos() {
  if (!photos.length) return;

  downloadAll.disabled = true;
  downloadAll.textContent = "Preparing photos…";

  try {
    const zip = new JSZip();

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      downloadAll.textContent =
        `Preparing photo ${i + 1} of ${photos.length}…`;

      const response = await fetch(photo.url);

      if (!response.ok) {
        throw new Error("Could not download one of the photos.");
      }

      const blob = await response.blob();

      const extension = getFileExtension(photo.url);

      zip.file(
        `Donna-60th-Birthday-${i + 1}.${extension}`,
        blob
      );
    }

    downloadAll.textContent = "Creating ZIP…";

    const zipBlob = await zip.generateAsync({
      type: "blob"
    });

    const zipUrl = URL.createObjectURL(zipBlob);

    const link = document.createElement("a");
    link.href = zipUrl;
    link.download = "Donna-60th-Birthday-Photos.zip";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(zipUrl);

    downloadAll.textContent = "✓ Photos Downloaded";
  } catch (error) {
    console.error(error);

    downloadAll.textContent =
      "Download failed — try again";

  } finally {
    setTimeout(() => {
      downloadAll.disabled = false;
      downloadAll.textContent = "↓ Download All Photos";
    }, 2500);
  }
}

downloadAll.addEventListener(
  "click",
  downloadAllPhotos
);

if (!code) {
  status.textContent =
    "No gallery code was provided.";

  downloadAll.style.display = "none";

} else {

  const { data, error } = await supabase
    .from("photos")
    .select("url,created_at")
    .eq("session_code", code)
    .order("created_at", {
      ascending: true
    });

  if (error) {

    status.textContent =
      "Could not load the gallery.";

    console.error(error);

    downloadAll.style.display = "none";

  } else {

    photos = data || [];

    status.textContent =
      `${photos.length} photo${photos.length === 1 ? "" : "s"}`;

    if (!photos.length) {

      grid.innerHTML =
        '<div class="empty">No photos have been uploaded yet.</div>';

      downloadAll.style.display = "none";

    } else {

      photos.forEach((photo, index) => {

        const card =
          document.createElement("article");

        card.className = "card";

        const extension =
          getFileExtension(photo.url);

        card.innerHTML = `
          <a
            class="photoLink"
            href="${photo.url}"
            target="_blank"
            rel="noopener"
          >
            <img
              src="${photo.url}"
              alt="Donna's 60th Birthday photo"
              loading="lazy"
            >
          </a>

          <div class="photoActions">

            <a
              class="viewBtn"
              href="${photo.url}"
              target="_blank"
              rel="noopener"
            >
              View
            </a>

            <button
              class="downloadBtn"
              type="button"
            >
              ↓ Save
            </button>

          </div>
        `;

        const saveButton =
          card.querySelector(".downloadBtn");

        saveButton.addEventListener(
          "click",
          async () => {

            saveButton.disabled = true;
            saveButton.textContent = "Saving…";

            try {

              await downloadPhoto(
                photo.url,
                `Donna-60th-Birthday-${index + 1}.${extension}`
              );

              saveButton.textContent = "✓ Saved";

            } catch (error) {

              console.error(error);

              saveButton.textContent =
                "Try Again";
            }

            setTimeout(() => {
              saveButton.disabled = false;
              saveButton.textContent = "↓ Save";
            }, 2000);
          }
        );

        grid.appendChild(card);
      });
    }
  }
}
