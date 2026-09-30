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

const logoutButton =
  document.getElementById(
    "logoutButton"
  );

const status =
  document.getElementById(
    "status"
  );

const eventsGrid =
  document.getElementById(
    "eventsGrid"
  );

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

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

logoutButton.addEventListener(
  "click",
  async () => {

    await supabase.auth.signOut();

    window.location.href =
      "login.html";

  }
);

async function loadDashboard() {

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

  const user =
    session.user;

  console.log(
    "Logged in user:",
    user
  );

  const {
    data: events,
    error
  } =
    await supabase
      .from("events")
      .select("*")
      .eq(
        "owner_id",
        user.id
      )
      .order(
        "event_date",
        {
          ascending: true
        }
      );

  if (error) {

    console.error(
      "Dashboard event error:",
      error
    );

    status.textContent =
      "Couldn't load your events.";

    status.className =
      "status error";

    return;
  }

  status.textContent = "";

  if (!events || events.length === 0) {

    eventsGrid.innerHTML =
      `
        <div class="empty">
          You don't have any events yet.
        </div>
      `;

    return;
  }

  eventsGrid.innerHTML =
    events
      .map(
        (event) => {

          return `
            <div class="event-card">

              <h3>
                ${escapeHtml(
                  event.event_name ||
                  "Untitled Event"
                )}
              </h3>

              <div class="event-date">
                ${escapeHtml(
                  formatEventDate(
                    event.event_date
                  )
                )}
              </div>

              <div class="event-code">
                Event Code:
                <strong>
                  ${escapeHtml(
                    event.code
                  )}
                </strong>
              </div>

              <div class="event-actions">

                <a
                  href="event-created.html?code=${encodeURIComponent(
                    event.code
                  )}"
                >
                  Manage Event
                </a>

                ${
                  event.rsvp_enabled
                    ? `
                      <a
                        href="rsvp-results.html?code=${encodeURIComponent(
                          event.code
                        )}"
                      >
                        RSVP Results
                      </a>
                    `
                    : ""
                }

                ${
                  event.guestbook_enabled
                    ? `
                      <a
                        href="guestbook-results.html?code=${encodeURIComponent(
                          event.code
                        )}"
                      >
                        Guestbook
                      </a>
                    `
                    : ""
                }

                <a
                  href="gallery.html?code=${encodeURIComponent(
                    event.code
                  )}"
                >
                  Gallery
                </a>

              </div>

            </div>
          `;
        }
      )
      .join("");
}

loadDashboard();
