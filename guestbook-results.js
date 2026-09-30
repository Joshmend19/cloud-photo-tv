import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "./config.js";

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

const params =
  new URLSearchParams(
    window.location.search
  );

const eventCode =
  params.get("code");

const eventName =
  document.getElementById(
    "eventName"
  );

const eventDate =
  document.getElementById(
    "eventDate"
  );

const messageCount =
  document.getElementById(
    "messageCount"
  );

const guestbookStatus =
  document.getElementById(
    "guestbookStatus"
  );

const status =
  document.getElementById(
    "status"
  );

const messages =
  document.getElementById(
    "messages"
  );

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEventDate(dateString) {

  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateString;
  }

  return date.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );
}

function formatMessageDate(dateString) {

  if (!dateString) {
    return "";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    undefined,
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

async function loadGuestbook() {

  if (!eventCode) {

    eventName.textContent =
      "Event Not Found";

    eventDate.textContent =
      "No event code was provided.";

    status.textContent =
      "Unable to load the Guestbook.";

    return;
  }

  const {
    data: {
      session
    }
  } =
    await supabase.auth.getSession();

  if (!session) {

    window.location.href =
      "login.html";

    return;
  }

  const {
    data: event,
    error: eventError
  } =
    await supabase
      .from("events")
      .select(
        "id, event_name, event_date, guestbook_enabled, owner_id"
      )
      .eq(
        "code",
        eventCode
      )
      .eq(
        "owner_id",
        session.user.id
      )
      .maybeSingle();

  if (eventError) {

    console.error(
      "Event loading error:",
      eventError
    );

    status.textContent =
      "Unable to load this event.";

    return;
  }

  if (!event) {

    eventName.textContent =
      "Event Not Found";

    eventDate.textContent =
      "This event does not belong to your account.";

    status.textContent =
      "You do not have access to this event.";

    return;
  }

  eventName.textContent =
    event.event_name ||
    "Your Event";

  eventDate.textContent =
    formatEventDate(
      event.event_date
    );

  if (
    event.guestbook_enabled !== true
  ) {

    guestbookStatus.textContent =
      "Disabled";

    status.textContent =
      "The Guestbook is not enabled for this event.";

    return;
  }

  const {
    data: guestbook,
    error: guestbookError
  } =
    await supabase
      .from("guestbook")
      .select(
        "id, name, message, created_at"
      )
      .eq(
        "event_id",
        event.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (guestbookError) {

    console.error(
      "Guestbook loading error:",
      guestbookError
    );

    status.textContent =
      "Unable to load Guestbook messages.";

    return;
  }

  const messageList =
    guestbook || [];

  messageCount.textContent =
    messageList.length;

  if (
    messageList.length === 0
  ) {

    status.textContent = "";

    messages.innerHTML = `
      <div class="empty-state">
        No Guestbook messages yet.
      </div>
    `;

    return;
  }

  status.textContent = "";

  messages.innerHTML =
    messageList
      .map(
        (item) => `
          <div class="message-card">

            <div class="message-name">
              ${escapeHtml(item.name)}
            </div>

            <div class="message-text">
              ${escapeHtml(item.message)}
            </div>

            <div class="message-date">
              ${escapeHtml(
                formatMessageDate(
                  item.created_at
                )
              )}
            </div>

          </div>
        `
      )
      .join("");
}

loadGuestbook();
