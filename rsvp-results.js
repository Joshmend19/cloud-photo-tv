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

const totalRsvps =
  document.getElementById(
    "totalRsvps"
  );

const attendingCount =
  document.getElementById(
    "attendingCount"
  );

const guestCountTotal =
  document.getElementById(
    "guestCountTotal"
  );

const status =
  document.getElementById(
    "status"
  );

const resultsContainer =
  document.getElementById(
    "resultsContainer"
  );

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEventDate(dateString) {
  if (!dateString) return "";

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

function formatResponseDate(dateString) {
  if (!dateString) return "";

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
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

async function loadResults() {

  if (!eventCode) {
    eventName.textContent =
      "Event Not Found";

    eventDate.textContent =
      "No event code was provided.";

    status.textContent =
      "Please open RSVP Results from your Event Ready page.";

    status.className =
      "status error";

    return;
  }

  const {
    data: event,
    error: eventError
  } =
    await supabase
      .from("events")
      .select("*")
      .eq("code", eventCode)
      .maybeSingle();

  if (eventError) {

    console.error(
      "Event loading error:",
      eventError
    );

    eventName.textContent =
      "Unable to Load Event";

    eventDate.textContent =
      "Please try again later.";

    status.textContent =
      "There was a problem loading this event.";

    status.className =
      "status error";

    return;
  }

  if (!event) {

    eventName.textContent =
      "Event Not Found";

    eventDate.textContent =
      "This event code is invalid.";

    status.textContent =
      "No event was found.";

    status.className =
      "status error";

    return;
  }

  eventName.textContent =
    event.event_name ||
    "Your Event";

  eventDate.textContent =
    formatEventDate(
      event.event_date
    );

  if (event.rsvp_enabled !== true) {

    status.textContent =
      "RSVP is not enabled for this event.";

    status.className =
      "status error";

    return;
  }

  const {
    data: rsvps,
    error: rsvpError
  } =
    await supabase
      .from("rsvps")
      .select(
        "id, name, email, attending, guest_count, message, created_at"
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

  if (rsvpError) {

    console.error(
      "RSVP loading error:",
      rsvpError
    );

    status.textContent =
      "Couldn't load the RSVP responses.";

    status.className =
      "status error";

    return;
  }

  const responses =
    rsvps || [];

  const attending =
    responses.filter(
      (rsvp) =>
        rsvp.attending === true
    );

  const totalGuests =
    attending.reduce(
      (total, rsvp) =>
        total +
        Number(
          rsvp.guest_count || 0
        ),
      0
    );

  totalRsvps.textContent =
    responses.length;

  attendingCount.textContent =
    attending.length;

  guestCountTotal.textContent =
    totalGuests;

  if (responses.length === 0) {

    status.textContent =
      "No RSVP responses yet.";

    resultsContainer.innerHTML =
      `
        <div class="empty">
          When guests RSVP, their responses will appear here.
        </div>
      `;

    return;
  }

  status.textContent =
    `${responses.length} RSVP response${
      responses.length === 1
        ? ""
        : "s"
    }`;

  resultsContainer.innerHTML =
    `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Response</th>
            <th>Guests</th>
            <th>Message</th>
            <th>Submitted</th>
          </tr>
        </thead>

        <tbody>

          ${responses
            .map(
              (rsvp) => {

                const responseText =
                  rsvp.attending
                    ? "Attending"
                    : "Not Attending";

                const responseClass =
                  rsvp.attending
                    ? "attending"
                    : "not-attending";

                return `
                  <tr>

                    <td>
                      ${escapeHtml(
                        rsvp.name
                      )}
                    </td>

                    <td>
                      ${
                        rsvp.email
                          ? escapeHtml(
                              rsvp.email
                            )
                          : "—"
                      }
                    </td>

                    <td>
                      <span class="${responseClass}">
                        ${responseText}
                      </span>
                    </td>

                    <td>
                      ${
                        rsvp.attending
                          ? Number(
                              rsvp.guest_count || 0
                            )
                          : "—"
                      }
                    </td>

                    <td>
                      ${
                        rsvp.message
                          ? escapeHtml(
                              rsvp.message
                            )
                          : "—"
                      }
                    </td>

                    <td>
                      ${formatResponseDate(
                        rsvp.created_at
                      )}
                    </td>

                  </tr>
                `;
              }
            )
            .join("")}

        </tbody>
      </table>
    `;

}

loadResults();
