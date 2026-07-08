const assert = require("node:assert/strict");
const { after, before, describe, it } = require("node:test");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "test-secret";

function makeState() {
  return {
    nextUserId: 3,
    nextRoomId: 3,
    nextBookingId: 3,
    nextResetTokenId: 1,
    passwordResetTokens: [],
    sentPasswordResetEmails: [],
    users: [
      {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", 10),
        role: "admin",
        phone: "0900000001",
        bio: "System administrator",
        avatar_url: "https://example.com/admin.png",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        name: "Normal User",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", 10),
        role: "user",
        phone: null,
        bio: null,
        avatar_url: null,
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ],
    rooms: [
      {
        id: 1,
        room_name: "Deluxe Room",
        room_type: "Deluxe",
        price: 100,
        description: "City view",
        capacity: 2,
        image: "room.jpg",
        status: "available",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        room_name: "Suite Room",
        room_type: "Suite",
        price: 200,
        description: "Ocean view",
        capacity: 4,
        image: "suite.jpg",
        status: "booked",
        created_at: "2026-01-02T00:00:00.000Z",
      },
    ],
    bookings: [
      {
        id: 1,
        user_id: 2,
        room_id: 2,
        check_in: "2099-01-10",
        check_out: "2099-01-12",
        total_price: 400,
        status: "confirmed",
        created_at: "2026-01-05T00:00:00.000Z",
      },
      {
        id: 2,
        user_id: 1,
        room_id: 1,
        check_in: "2099-02-10",
        check_out: "2099-02-11",
        total_price: 100,
        status: "pending",
        created_at: "2026-01-06T00:00:00.000Z",
      },
    ],
  };
}

function normalizeSql(sql) {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function publicUser(user) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function joinBooking(state, booking) {
  const user = state.users.find((item) => item.id === booking.user_id);
  const room = state.rooms.find((item) => item.id === booking.room_id);

  return {
    ...booking,
    user_name: user?.name,
    user_email: user?.email,
    room_name: room?.room_name,
    room_type: room?.room_type,
    room_capacity: room?.capacity,
    room_price: room?.price,
    room_image: room?.image,
  };
}

function hasOverlap(booking, roomId, checkIn, checkOut, activeStatuses) {
  return (
    booking.room_id === roomId &&
    activeStatuses.includes(booking.status) &&
    booking.check_in < checkOut &&
    booking.check_out > checkIn
  );
}

function makeFakePool(state) {
  async function query(sql, params = []) {
    const text = normalizeSql(sql);

    if (text === "begin" || text === "commit" || text === "rollback") {
      return { rows: [] };
    }

    if (text.includes("from users") && text.includes("where email=$1")) {
      const user = state.users.find((item) => item.email === params[0]);
      return { rows: user ? [text.includes("password") ? user : publicUser(user)] : [] };
    }

    if (text.includes("select id from users where email = $1 and id != $2")) {
      const user = state.users.find(
        (item) => item.email === params[0] && item.id !== Number(params[1])
      );
      return { rows: user ? [{ id: user.id }] : [] };
    }

    if (text.includes("select id from users where email = $1")) {
      const user = state.users.find((item) => item.email === params[0]);
      return { rows: user ? [{ id: user.id }] : [] };
    }

    if (text.includes("from users") && text.includes("order by id asc")) {
      return {
        rows: state.users
          .slice()
          .sort((a, b) => a.id - b.id)
          .map(publicUser),
      };
    }

    if (text.includes("select id, password from users where id = $1")) {
      const user = state.users.find((item) => item.id === Number(params[0]));
      return { rows: user ? [{ id: user.id, password: user.password }] : [] };
    }

    if (text.includes("from users") && text.includes("where id = $1")) {
      const user = state.users.find((item) => item.id === Number(params[0]));
      return { rows: user ? [publicUser(user)] : [] };
    }

    if (
      text.includes("update users set password=$1 where id=$2") ||
      text.includes("update users set password=$1, updated_at=current_timestamp where id=$2")
    ) {
      const user = state.users.find((item) => item.id === Number(params[1]));
      if (!user) return { rows: [] };
      user.password = params[0];
      user.updated_at = new Date().toISOString();
      return { rows: [] };
    }

    if (text.includes("insert into users")) {
      const role = text.includes("'user'") ? "user" : params[3];
      const user = {
        id: state.nextUserId++,
        name: params[0],
        email: params[1],
        password: params[2],
        role,
        phone: params[4] || null,
        bio: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.users.push(user);
      return { rows: [publicUser(user)] };
    }

    if (text.includes("update users")) {
      const hasPassword = text.includes("password=$4");
      const isSelfProfileUpdate = text.includes("avatar_url=$5");
      const id = Number(
        isSelfProfileUpdate ? params[5] : hasPassword ? params[5] : params[4]
      );
      const user = state.users.find((item) => item.id === id);
      if (!user) return { rows: [] };

      user.name = params[0];
      user.email = params[1];
      if (isSelfProfileUpdate) {
        user.phone = params[2] || null;
        user.bio = params[3] || null;
        user.avatar_url = params[4] || null;
      } else {
        user.role = params[2];
        if (hasPassword) {
          user.password = params[3];
          user.phone = params[4] || null;
        } else {
          user.phone = params[3] || null;
        }
      }
      user.updated_at = new Date().toISOString();
      return { rows: [publicUser(user)] };
    }

    if (text.includes("delete from users")) {
      const index = state.users.findIndex((item) => item.id === Number(params[0]));
      if (index === -1) return { rows: [] };
      const [deleted] = state.users.splice(index, 1);
      return { rows: [{ id: deleted.id }] };
    }

    if (text.includes("insert into password_reset_tokens")) {
      const token = {
        id: state.nextResetTokenId++,
        user_id: Number(params[0]),
        token_hash: params[1],
        expires_at: params[2],
        used_at: null,
        created_at: new Date().toISOString(),
      };
      state.passwordResetTokens.push(token);
      return { rows: [{ id: token.id }] };
    }

    if (text.includes("from password_reset_tokens")) {
      const token = state.passwordResetTokens
        .slice()
        .reverse()
        .find((item) => {
          const expiresAt = new Date(item.expires_at);
          return (
            item.token_hash === params[0] &&
            !item.used_at &&
            expiresAt.getTime() > Date.now()
          );
        });

      return {
        rows: token ? [{ id: token.id, user_id: token.user_id }] : [],
      };
    }

    if (text.includes("update password_reset_tokens set used_at")) {
      const token = state.passwordResetTokens.find((item) => item.id === Number(params[0]));
      if (token) token.used_at = new Date().toISOString();
      return { rows: [] };
    }

    if (text.includes('as "totalrooms"') && text.includes('as "totalusers"')) {
      const revenue = state.bookings
        .filter((item) => ["confirmed", "completed"].includes(item.status))
        .reduce((sum, item) => sum + Number(item.total_price), 0);
      return {
        rows: [
          {
            totalRooms: state.rooms.length,
            availableRooms: state.rooms.filter((item) => item.status === "available").length,
            bookedRooms: state.rooms.filter((item) => item.status === "booked").length,
            totalUsers: state.users.length,
            totalBookings: state.bookings.length,
            revenue,
          },
        ],
      };
    }

    if (text.includes("extract(month") && text.includes("sum(total_price)")) {
      const rowsByMonth = new Map();

      state.bookings
        .filter((item) => ["confirmed", "completed"].includes(item.status))
        .forEach((booking) => {
          const date = new Date(booking.created_at || booking.check_in);
          const month = date.getMonth() + 1;
          rowsByMonth.set(
            month,
            (rowsByMonth.get(month) || 0) + Number(booking.total_price)
          );
        });

      return {
        rows: Array.from(rowsByMonth.entries()).map(([month, revenue]) => ({
          month,
          revenue,
        })),
      };
    }

    if (text.includes("extract(month") && text.includes("count(*)::int as bookings")) {
      const rowsByMonth = new Map();

      state.bookings.forEach((booking) => {
        const date = new Date(booking.created_at || booking.check_in);
        const month = date.getMonth() + 1;
        rowsByMonth.set(month, (rowsByMonth.get(month) || 0) + 1);
      });

      return {
        rows: Array.from(rowsByMonth.entries()).map(([month, bookings]) => ({
          month,
          bookings,
        })),
      };
    }

    if (text.includes("from bookings") && text.includes("group by status")) {
      const counts = state.bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {});

      return {
        rows: Object.entries(counts).map(([status, count]) => ({
          status,
          count,
        })),
      };
    }

    if (text.includes("from rooms r") && text.includes("join bookings b")) {
      const rows = state.rooms
        .map((room) => {
          const bookings = state.bookings.filter((booking) => booking.room_id === room.id);
          const revenue = bookings
            .filter((booking) => ["confirmed", "completed"].includes(booking.status))
            .reduce((sum, booking) => sum + Number(booking.total_price), 0);

          return {
            room_id: room.id,
            room_name: room.room_name,
            room_type: room.room_type,
            booking_count: bookings.length,
            revenue,
          };
        })
        .filter((room) => room.booking_count > 0)
        .sort((a, b) => b.booking_count - a.booking_count || b.revenue - a.revenue)
        .slice(0, 5);

      return { rows };
    }

    if (text.includes("from rooms") && text.includes("filter (where status = 'booked')")) {
      return {
        rows: [
          {
            totalRooms: state.rooms.length,
            bookedRooms: state.rooms.filter((item) => item.status === "booked").length,
            availableRooms: state.rooms.filter((item) => item.status === "available").length,
            maintenanceRooms: state.rooms.filter((item) => item.status === "maintenance").length,
          },
        ],
      };
    }

    if (text.includes("from rooms") && text.includes("order by id asc")) {
      return {
        rows: state.rooms.slice().sort((a, b) => a.id - b.id),
      };
    }

    if (text.includes("select id, price, status, capacity from rooms")) {
      const room = state.rooms.find((item) => item.id === Number(params[0]));
      return { rows: room ? [room] : [] };
    }

    if (text.includes("select status from rooms where id = $1")) {
      const room = state.rooms.find((item) => item.id === Number(params[0]));
      return { rows: room ? [{ status: room.status }] : [] };
    }

    if (text.includes("from rooms") && text.includes("where id = $1")) {
      const room = state.rooms.find((item) => item.id === Number(params[0]));
      return { rows: room ? [room] : [] };
    }

    if (text.includes("insert into rooms")) {
      const room = {
        id: state.nextRoomId++,
        room_name: params[0],
        room_type: params[1],
        price: params[2],
        description: params[3],
        capacity: params[4],
        image: params[5],
        status: params[6],
        created_at: new Date().toISOString(),
      };
      state.rooms.push(room);
      return { rows: [room] };
    }

    if (text.includes("update rooms set status = $1 where id = $2")) {
      const room = state.rooms.find((item) => item.id === Number(params[1]));
      if (room) room.status = params[0];
      return { rows: [] };
    }

    if (text.includes("update rooms")) {
      const room = state.rooms.find((item) => item.id === Number(params[7]));
      if (!room) return { rows: [] };
      Object.assign(room, {
        room_name: params[0],
        room_type: params[1],
        price: params[2],
        description: params[3],
        capacity: params[4],
        image: params[5],
        status: params[6],
      });
      return { rows: [room] };
    }

    if (text.includes("select id from bookings where room_id = $1 limit 1")) {
      const booking = state.bookings.find((item) => item.room_id === Number(params[0]));
      return { rows: booking ? [{ id: booking.id }] : [] };
    }

    if (text.includes("delete from rooms")) {
      const index = state.rooms.findIndex((item) => item.id === Number(params[0]));
      if (index === -1) return { rows: [] };
      const [deleted] = state.rooms.splice(index, 1);
      return { rows: [{ id: deleted.id }] };
    }

    if (text.includes("from bookings b")) {
      let rows = state.bookings.map((item) => joinBooking(state, item));

      if (text.includes("where b.user_id = $1")) {
        rows = rows.filter((item) => item.user_id === Number(params[0]));
      }

      if (text.includes("where b.id = $1")) {
        rows = rows.filter((item) => item.id === Number(params[0]));
      }

      return { rows: rows.sort((a, b) => b.id - a.id) };
    }

    if (text.includes("select id from bookings") && text.includes("status = any")) {
      const roomId = Number(params[0]);
      const activeStatuses = params[3] || params[1] || [];
      const rows = state.bookings
        .filter((item) => {
          if (params.length >= 4) {
            return hasOverlap(item, roomId, params[1], params[2], activeStatuses);
          }

          return item.room_id === roomId && activeStatuses.includes(item.status);
        })
        .map((item) => ({ id: item.id }));
      return { rows };
    }

    if (text.includes("insert into bookings")) {
      const booking = {
        id: state.nextBookingId++,
        user_id: Number(params[0]),
        room_id: Number(params[1]),
        check_in: params[2],
        check_out: params[3],
        total_price: Number(params[4]),
        status: "pending",
        created_at: new Date().toISOString(),
      };
      state.bookings.push(booking);
      return { rows: [booking] };
    }

    if (text.includes("update bookings set status = $1")) {
      const booking = state.bookings.find((item) => item.id === Number(params[1]));
      if (!booking) return { rows: [] };
      booking.status = params[0];
      return { rows: [booking] };
    }

    if (text.includes("select * from bookings where id = $1")) {
      const booking = state.bookings.find((item) => item.id === Number(params[0]));
      return { rows: booking ? [booking] : [] };
    }

    if (text.includes("update bookings set status = 'cancelled'")) {
      const booking = state.bookings.find((item) => item.id === Number(params[0]));
      if (!booking) return { rows: [] };
      booking.status = "cancelled";
      return { rows: [booking] };
    }

    if (text.includes("delete from bookings")) {
      const index = state.bookings.findIndex((item) => item.id === Number(params[0]));
      if (index === -1) return { rows: [] };
      const [deleted] = state.bookings.splice(index, 1);
      return { rows: [deleted] };
    }

    throw new Error(`Unhandled SQL in test fake pool: ${sql}`);
  }

  return {
    query,
    async connect() {
      return {
        query,
        release() {},
      };
    },
  };
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe("hotel booking API", () => {
  let server;
  let baseUrl;
  let adminToken;
  let userToken;
  let state;

  before(async () => {
    state = makeState();
    const dbPath = require.resolve("../src/db/db.js");
    require.cache[dbPath] = {
      id: dbPath,
      filename: dbPath,
      loaded: true,
      exports: makeFakePool(state),
    };

    const emailPath = require.resolve("../src/services/emailService.js");
    require.cache[emailPath] = {
      id: emailPath,
      filename: emailPath,
      loaded: true,
      exports: {
        assertEmailConfigured() {},
        async sendPasswordResetEmail(payload) {
          state.sentPasswordResetEmails.push(payload);
        },
      },
    };

    const serverPath = require.resolve("../server.js");
    delete require.cache[serverPath];
    const app = require("../server.js");

    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", resolve);
    });

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;

    const adminLogin = await request(baseUrl, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123",
      }),
    });
    adminToken = adminLogin.body.token;

    const userLogin = await request(baseUrl, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "user123",
      }),
    });
    userToken = userLogin.body.token;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("authenticates valid users and rejects invalid login", async () => {
    const ok = await request(baseUrl, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123",
      }),
    });

    assert.equal(ok.response.status, 200);
    assert.equal(ok.body.user.role, "admin");
    assert.equal(ok.body.user.password, undefined);
    assert.ok(ok.body.token);

    const bad = await request(baseUrl, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@example.com",
        password: "wrong-password",
      }),
    });

    assert.equal(bad.response.status, 401);
  });

  it("registers a new user without exposing password", async () => {
    const result = await request(baseUrl, "/api/register", {
      method: "POST",
      body: JSON.stringify({
        name: "New Guest",
        email: "guest@example.com",
        password: "guest123",
      }),
    });

    assert.equal(result.response.status, 201);
    assert.equal(result.body.user.email, "guest@example.com");
    assert.equal(result.body.user.role, "user");
    assert.equal(result.body.user.password, undefined);
  });

  it("sends password reset email and resets password with a hashed token", async () => {
    const forgot = await request(baseUrl, "/api/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
      }),
    });

    assert.equal(forgot.response.status, 200);
    assert.equal(state.sentPasswordResetEmails.length, 1);
    assert.equal(state.passwordResetTokens.length, 1);

    const email = state.sentPasswordResetEmails[0];
    const resetUrl = new URL(email.resetUrl);
    const rawToken = resetUrl.searchParams.get("token");

    assert.ok(rawToken);
    assert.notEqual(state.passwordResetTokens[0].token_hash, rawToken);

    const reset = await request(baseUrl, "/api/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: rawToken,
        password: "newpass123",
      }),
    });

    assert.equal(reset.response.status, 200);
    assert.ok(state.passwordResetTokens[0].used_at);

    const oldLogin = await request(baseUrl, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "user123",
      }),
    });
    assert.equal(oldLogin.response.status, 401);

    const newLogin = await request(baseUrl, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "newpass123",
      }),
    });
    assert.equal(newLogin.response.status, 200);
  });

  it("returns rooms publicly and protects room writes", async () => {
    const list = await request(baseUrl, "/api/rooms");
    assert.equal(list.response.status, 200);
    assert.equal(list.body.length, 2);

    const unauthorized = await request(baseUrl, "/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        room_name: "Garden Room",
        room_type: "Standard",
        price: 80,
      }),
    });
    assert.equal(unauthorized.response.status, 401);

    const created = await request(baseUrl, "/api/rooms", {
      method: "POST",
      headers: authHeader(adminToken),
      body: JSON.stringify({
        room_name: "Garden Room",
        room_type: "Standard",
        price: 80,
        capacity: 2,
        status: "available",
      }),
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.room.room_name, "Garden Room");

    const invalidPrice = await request(baseUrl, "/api/rooms", {
      method: "POST",
      headers: authHeader(adminToken),
      body: JSON.stringify({
        room_name: "Bad Price Room",
        room_type: "Standard",
        price: -1,
        capacity: 2,
      }),
    });
    assert.equal(invalidPrice.response.status, 400);

    const invalidCapacity = await request(baseUrl, "/api/rooms", {
      method: "POST",
      headers: authHeader(adminToken),
      body: JSON.stringify({
        room_name: "Bad Capacity Room",
        room_type: "Standard",
        price: 80,
        capacity: 0,
      }),
    });
    assert.equal(invalidCapacity.response.status, 400);
  });

  it("allows admin user management and rejects normal users", async () => {
    const forbidden = await request(baseUrl, "/api/users", {
      headers: authHeader(userToken),
    });
    assert.equal(forbidden.response.status, 403);

    const users = await request(baseUrl, "/api/users", {
      headers: authHeader(adminToken),
    });
    assert.equal(users.response.status, 200);
    assert.ok(users.body.length >= 3);

    const invalid = await request(baseUrl, "/api/users", {
      method: "POST",
      headers: authHeader(adminToken),
      body: JSON.stringify({
        name: "Bad Email",
        email: "bad-email",
        password: "123456",
        role: "user",
      }),
    });
    assert.equal(invalid.response.status, 400);
  });

  it("lets authenticated users manage their own profile and password", async () => {
    const profile = await request(baseUrl, "/api/users/me", {
      headers: authHeader(userToken),
    });

    assert.equal(profile.response.status, 200);
    assert.equal(profile.body.email, "user@example.com");
    assert.equal(profile.body.password, undefined);

    const duplicateEmail = await request(baseUrl, "/api/users/me", {
      method: "PUT",
      headers: authHeader(userToken),
      body: JSON.stringify({
        name: "Normal User",
        email: "admin@example.com",
      }),
    });

    assert.equal(duplicateEmail.response.status, 400);

    const updated = await request(baseUrl, "/api/users/me", {
      method: "PUT",
      headers: authHeader(userToken),
      body: JSON.stringify({
        name: "Profile User",
        email: "profile@example.com",
        role: "admin",
        phone: "0912345678",
        bio: "Booking guest",
        avatar_url: "https://example.com/avatar.png",
      }),
    });

    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.user.name, "Profile User");
    assert.equal(updated.body.user.email, "profile@example.com");
    assert.equal(updated.body.user.role, "user");
    assert.equal(updated.body.user.phone, "0912345678");
    assert.equal(updated.body.user.password, undefined);

    const wrongPassword = await request(baseUrl, "/api/users/me/password", {
      method: "PUT",
      headers: authHeader(userToken),
      body: JSON.stringify({
        currentPassword: "wrong-password",
        newPassword: "profilepass123",
      }),
    });

    assert.equal(wrongPassword.response.status, 400);

    const changedPassword = await request(baseUrl, "/api/users/me/password", {
      method: "PUT",
      headers: authHeader(userToken),
      body: JSON.stringify({
        currentPassword: "newpass123",
        newPassword: "profilepass123",
      }),
    });

    assert.equal(changedPassword.response.status, 200);

    const oldLogin = await request(baseUrl, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: "profile@example.com",
        password: "newpass123",
      }),
    });
    assert.equal(oldLogin.response.status, 401);

    const newLogin = await request(baseUrl, "/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: "profile@example.com",
        password: "profilepass123",
      }),
    });
    assert.equal(newLogin.response.status, 200);
    assert.equal(newLogin.body.user.password, undefined);
  });

  it("returns dashboard stats for admin only", async () => {
    const forbidden = await request(baseUrl, "/api/dashboard/stats", {
      headers: authHeader(userToken),
    });
    assert.equal(forbidden.response.status, 403);

    const stats = await request(baseUrl, "/api/dashboard/stats", {
      headers: authHeader(adminToken),
    });
    assert.equal(stats.response.status, 200);
    assert.equal(stats.body.totalRooms, 3);
    assert.ok(stats.body.totalUsers >= 3);
    assert.ok(stats.body.totalBookings >= 2);
  });

  it("returns dashboard analytics for admin only", async () => {
    const forbidden = await request(baseUrl, "/api/dashboard/analytics", {
      headers: authHeader(userToken),
    });
    assert.equal(forbidden.response.status, 403);

    const analytics = await request(baseUrl, "/api/dashboard/analytics", {
      headers: authHeader(adminToken),
    });

    assert.equal(analytics.response.status, 200);
    assert.equal(analytics.body.revenueByMonth.length, 12);
    assert.equal(analytics.body.bookingsByMonth.length, 12);
    assert.ok(
      analytics.body.bookingsByStatus.some((item) => item.status === "confirmed")
    );
    assert.ok(analytics.body.topRooms.length > 0);
    assert.equal(analytics.body.occupancy.totalRooms, state.rooms.length);
    assert.equal(typeof analytics.body.occupancy.occupancyRate, "number");
    assert.ok(Array.isArray(analytics.body.recentBookings));
  });

  it("scopes bookings by role and validates booking payloads", async () => {
    const noToken = await request(baseUrl, "/api/bookings");
    assert.equal(noToken.response.status, 401);

    const userBookings = await request(baseUrl, "/api/bookings", {
      headers: authHeader(userToken),
    });
    assert.equal(userBookings.response.status, 200);
    assert.equal(userBookings.body[0].room_capacity, 4);
    assert.equal(userBookings.body[0].room_price, 200);
    assert.deepEqual(
      userBookings.body.map((item) => item.user_id),
      [2]
    );

    const invalid = await request(baseUrl, "/api/bookings", {
      method: "POST",
      headers: authHeader(userToken),
      body: JSON.stringify({
        room_id: 1,
      }),
    });
    assert.equal(invalid.response.status, 400);

    const created = await request(baseUrl, "/api/bookings", {
      method: "POST",
      headers: authHeader(userToken),
      body: JSON.stringify({
        room_id: 1,
        check_in: "2099-03-01",
        check_out: "2099-03-03",
        guests: 2,
      }),
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.nights, 2);
    assert.equal(created.body.total_price, 200);
  });

  it("lets admins update booking status and users cancel own bookings", async () => {
    const updated = await request(baseUrl, "/api/bookings/1", {
      method: "PUT",
      headers: authHeader(adminToken),
      body: JSON.stringify({ status: "completed" }),
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.booking.status, "completed");

    const cancelled = await request(baseUrl, "/api/bookings/3/cancel", {
      method: "PATCH",
      headers: authHeader(userToken),
    });
    assert.equal(cancelled.response.status, 200);
    assert.equal(cancelled.body.booking.status, "cancelled");
  });
});
