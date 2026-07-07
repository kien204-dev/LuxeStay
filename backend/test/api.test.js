const assert = require("node:assert/strict");
const { after, before, describe, it } = require("node:test");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "test-secret";

function makeState() {
  return {
    nextUserId: 3,
    nextRoomId: 3,
    nextBookingId: 3,
    users: [
      {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", 10),
        role: "admin",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        name: "Normal User",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", 10),
        role: "user",
        created_at: "2026-01-02T00:00:00.000Z",
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
  const { password, ...safeUser } = user;
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
      return { rows: user ? [user] : [] };
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

    if (text.includes("from users") && text.includes("where id = $1")) {
      const user = state.users.find((item) => item.id === Number(params[0]));
      return { rows: user ? [publicUser(user)] : [] };
    }

    if (text.includes("insert into users")) {
      const role = text.includes("'user'") ? "user" : params[3];
      const user = {
        id: state.nextUserId++,
        name: params[0],
        email: params[1],
        password: params[2],
        role,
        created_at: new Date().toISOString(),
      };
      state.users.push(user);
      return { rows: [publicUser(user)] };
    }

    if (text.includes("update users")) {
      const hasPassword = text.includes("password=$4");
      const id = Number(hasPassword ? params[4] : params[3]);
      const user = state.users.find((item) => item.id === id);
      if (!user) return { rows: [] };

      user.name = params[0];
      user.email = params[1];
      user.role = params[2];
      if (hasPassword) user.password = params[3];
      return { rows: [publicUser(user)] };
    }

    if (text.includes("delete from users")) {
      const index = state.users.findIndex((item) => item.id === Number(params[0]));
      if (index === -1) return { rows: [] };
      const [deleted] = state.users.splice(index, 1);
      return { rows: [{ id: deleted.id }] };
    }

    if (text.includes('as "totalrooms"')) {
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

  before(async () => {
    const dbPath = require.resolve("../src/db/db.js");
    require.cache[dbPath] = {
      id: dbPath,
      filename: dbPath,
      loaded: true,
      exports: makeFakePool(makeState()),
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

  it("scopes bookings by role and validates booking payloads", async () => {
    const noToken = await request(baseUrl, "/api/bookings");
    assert.equal(noToken.response.status, 401);

    const userBookings = await request(baseUrl, "/api/bookings", {
      headers: authHeader(userToken),
    });
    assert.equal(userBookings.response.status, 200);
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
