function Settings() {
  const menu = ["Profile", "Notifications", "System", "Security"];

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          Settings
        </h1>
        <p
          style={{
            color: "#a3aac4",
            marginTop: 8,
            maxWidth: 640,
            lineHeight: 1.6,
          }}
        >
          Refine the digital environment of LuxeStay. Manage your identity,
          security protocols, and notification layers.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 28,
          alignItems: "start",
        }}
      >
        <aside
          style={{
            background: "rgba(25,37,64,0.45)",
            border: "1px solid rgba(64,72,93,0.3)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <p
            style={{
              color: "#9fa7ff",
              fontSize: 12,
              letterSpacing: "0.2em",
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            CONFIGURATION
          </p>

          {menu.map((item) => (
            <button
              key={item}
              style={{
                width: "100%",
                padding: "13px 14px",
                border: "none",
                borderRadius: 10,
                background:
                  item === "Profile"
                    ? "rgba(159,167,255,0.12)"
                    : "transparent",
                color: item === "Profile" ? "#9fa7ff" : "#a3aac4",
                textAlign: "left",
                cursor: "pointer",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              {item}
            </button>
          ))}
        </aside>

        <section>
          <div
            style={{
              background: "rgba(25,37,64,0.6)",
              border: "1px solid rgba(64,72,93,0.3)",
              borderRadius: 18,
              padding: 28,
              marginBottom: 28,
            }}
          >
            <h2 style={{ margin: "0 0 24px", color: "#fff" }}>
              Profile Information
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: 28,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 24,
                    background: "#9fa7ff",
                    color: "#060e20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 34,
                    fontWeight: 800,
                    margin: "0 auto 14px",
                  }}
                >
                  AD
                </div>
                <button
                  style={{
                    background: "transparent",
                    color: "#9fa7ff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Change Photo
                </button>
              </div>

              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                    marginBottom: 18,
                  }}
                >
                  <Field label="Full Name" value="Admin" />
                  <Field label="Email Address" value="admin@gmail.com" />
                </div>

                <label
                  style={{
                    display: "block",
                    color: "#a3aac4",
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Bio
                </label>

                <textarea
                  defaultValue="Lead Curator at LuxeStay. Managing high-end booking operations and user services."
                  style={{
                    width: "100%",
                    minHeight: 110,
                    background: "#20283a",
                    border: "1px solid rgba(64,72,93,0.5)",
                    borderRadius: 12,
                    color: "#dee5ff",
                    padding: 14,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    marginTop: 20,
                  }}
                >
                  <button
                    style={{
                      padding: "11px 20px",
                      borderRadius: 10,
                      background: "transparent",
                      border: "1px solid rgba(64,72,93,0.5)",
                      color: "#dee5ff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    style={{
                      padding: "11px 22px",
                      borderRadius: 10,
                      background: "#9fa7ff",
                      color: "#060e20",
                      border: "none",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h2 style={{ color: "#fff", marginBottom: 18 }}>
            Notification Preferences
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {[
              "Email Digest",
              "Real-time Alerts",
              "Security Logs",
              "Marketing Updates",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "rgba(25,37,64,0.6)",
                  border: "1px solid rgba(64,72,93,0.3)",
                  borderRadius: 16,
                  padding: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 16 }}>
                    {item}
                  </h3>
                  <p style={{ margin: "6px 0 0", color: "#7b849e" }}>
                    Manage {item.toLowerCase()}
                  </p>
                </div>

                <div
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 20,
                    background: "#9fa7ff",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      right: 3,
                      top: 3,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#fff",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          color: "#a3aac4",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <input
        defaultValue={value}
        style={{
          width: "100%",
          background: "#20283a",
          border: "1px solid rgba(64,72,93,0.5)",
          borderRadius: 12,
          color: "#dee5ff",
          padding: "13px 14px",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export default Settings;