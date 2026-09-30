import { supabase } from "./config.js";

const params = new URLSearchParams(window.location.search);
const eventCode = params.get("code");

const eventName = document.getElementById("eventName");
const eventDate = document.getElementById("eventDate");

const guestbookFormSection = document.getElementById(
  "guestbookFormSection"
);

const guestbookForm = document.getElementById("guestbookForm");
const guestName = document.getElementById("guestName");
const guestMessage = document.getElementById("guestMessage");

const submitGuestbookBtn = document.getElementById(
  "submitGuestbookBtn"
);

const guestbookStatus = document.getElementById(
  "guestbookStatus"
);

const successMessage = document.getElementById(
  "successMessage"
);

const successText = document.getElementById(
  "successText"
);

let currentEvent = null;

function formatEventDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

async function loadEvent() {
  if (!eventCode) {
    eventName.textContent = "Event Not Found";
    eventDate.textContent = "No event code was provided.";
    guestbookFormSection.style.display = "none";
    return;
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("code", eventCode)
    .maybeSingle();

  if (error) {
    console.error("Error loading event:", error);

    eventName.textContent = "Unable to Load Event";
    eventDate.textContent = "Please try again later.";
    guestbookFormSection.style.display = "none";

    return;
  }

  if (!data) {
    eventName.textContent = "Event Not Found";
    eventDate.textContent =
      "This guestbook link may be invalid or expired.";

    guestbookFormSection.style.display = "none";

    return;
  }

  currentEvent = data;

  if (data.guestbook_enabled !== true) {
    eventName.textContent = data.event_name || "Event";
    eventDate.textContent =
      "The guestbook is not available for this event.";

    guestbookFormSection.style.display = "none";

    return;
  }

  eventName.textContent = data.event_name || "Event";
  eventDate.textContent = formatEventDate(data.event_date);
}

guestbookForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentEvent) {
    guestbookStatus.textContent =
      "Event information is not available.";
    guestbookStatus.className = "status error";
    return;
  }

  const name = guestName.value.trim();
  const message = guestMessage.value.trim();

  if (!name) {
    guestbookStatus.textContent =
      "Please enter your name.";
    guestbookStatus.className = "status error";
    return;
  }

  if (!message) {
    guestbookStatus.textContent =
      "Please enter a message.";
    guestbookStatus.className = "status error";
    return;
  }

  submitGuestbookBtn.disabled = true;
  submitGuestbookBtn.textContent = "Submitting...";
  guestbookStatus.textContent = "";

  const { error } = await supabase
    .from("guestbook")
    .insert({
      event_id: currentEvent.id,
      name,
      message
    });

  if (error) {
    console.error("Guestbook submission error:", error);

    submitGuestbookBtn.disabled = false;
    submitGuestbookBtn.textContent =
      "Sign the Guestbook";

    guestbookStatus.textContent =
      "Couldn't submit your message. Please try again.";

    guestbookStatus.className = "status error";

    return;
  }

  guestbookFormSection.style.display = "none";
  successMessage.style.display = "block";

  successText.textContent =
    `Thank you, ${name}! Your message has been added to the guestbook.`;
});

loadEvent();
