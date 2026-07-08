import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRooms } from "../services/roomService";
import { createBooking } from "../services/bookingService";
import { normalizeImageUrl, useFallbackImage } from "../utils/imageUrl";

function mapRoomForDisplay(room) {
  return {
    id: room.id,
    name: room.room_name,
    location: room.room_type,
    price: Number(room.price),
    desc:
      room.description ||
      `${room.room_type} — tối đa ${room.capacity || 2} khách`,
    img: normalizeImageUrl(room.image),
    type: room.room_type,
    icons: ["restaurant", "spa", "pool"],
    status: room.status,
    capacity: Number(room.capacity) || 1,
  };
}

// Load Material Symbols font
const materialIconsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Manrope:wght@400;500;600;700&display=swap');

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }

  .font-headline { font-family: 'Noto Serif', serif; }
  .font-body { font-family: 'Manrope', sans-serif; }
  .font-label { font-family: 'Manrope', sans-serif; }

  .glass-nav {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* Responsive nav links */
  @media (max-width: 768px) {
    .nav-links { display: none !important; }
    .hero-title { font-size: 2.5rem !important; }
    .search-bar { flex-direction: column !important; }
    .search-bar > * { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.1) !important; }
    .search-bar > *:last-child { border-bottom: none !important; }
    .destinations-grid { grid-template-columns: 1fr !important; }
    .suite-grid { grid-template-columns: 1fr !important; }
    .why-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
    .footer-grid { grid-template-columns: 1fr !important; }
    .booking-modal-panel { grid-template-columns: 1fr !important; max-height: 92vh !important; overflow-y: auto !important; }
    .booking-modal-image { min-height: 240px !important; }
    .booking-modal-form { padding: 24px !important; }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .destinations-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .suite-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .why-grid { grid-template-columns: repeat(3, 1fr) !important; }
  }

  /* Amenities row fix */
  .amenity-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 16px 0;
    border-top: 1px solid rgba(0,0,0,0.06);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    margin-bottom: 2rem;
  }
  .amenity-item {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    color: #6b7280;
    font-size: 14px;
  }
  .amenity-item .material-symbols-outlined {
    font-size: 18px;
    color: #002366;
  }
`;


const destinations = [
    { city: "Tokyo", count: "86", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsgL36oT6Tm2fqJq21_KxoLa1nG5If3TR9Z9RlOKvOBqxRtul2E2aKOX27KJ70tn5GwSjegpv2Y1yC5RWHKfc5Z1IZ_A7uXYOfJDNf_5HmCWorYTAK1SzQ-Z9fNvx7WUkogQ-mJviJXBRkleyALAGwP7H8M3fzM0AeWI_xi7cbvZgKZ7taJSaeSO_tu7riSa9Uk0m8bXK26J3lh7ILswSTxOAR0EW6f1I4TIICRgvBu7ATibv0a3JJUwXbW-xEZMOZEeR0L3VwQjY" },
    { city: "Amalfi Coast", count: "54", img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=600&fit=crop" },
    { city: "Santorini", count: "38", img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop" },
    { city: "Paris", count: "124", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_lf0xCLfQo1_bWb4BF4m-h5lKNxlKMqxJB6EHuXoY017Az0FQ_bYT5tmjLSarQ3b_rPlj531VlKXpRbfbdmOdKiDT_0mb34sIaC5XlDh07a6EL-J4-zTBp1uUnnQ0NPBGVO0_j1EhgIkV2cA5-MYCTqGjMLTkgE6gEDYSo-gb81csM4a1bfrlD_XoLe0gxY0ZEUB53OFSMgYkLf4rD4eIxconJ0JJQ6gPz0gcBrZqq0vmLY0ePvTTQ9oz0_QYESvi4DCB6rh9KCY" },
    { city: "Maldives", count: "42", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0lxva9nZICQHeckeawx44sgAuNmK2RBA9D0Cjc_S7vTz9nJB6919qigsPi2Gdx1X4fpjbMPG0FglKC1jza_DX3bP7Yvo490NpsPb5mlBr4dMukv3eNabaGWUmfqo05vIgO_OM6g8_GEh5osQ3hLL0AYP_F7EZf3svHIvTKLwKzpFcqfBsuM3XdRalEBtciRjMAvL0-S9sTe4fXDhQ2R81YPGFr9Db7kuyBMB6_N8Tcyh0_jbmo837e6odf3XPVoOpUP9BUBqKgs8" },
    { city: "Bali", count: "67", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop" },
    { city: "New York", count: "210", img: "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800&h=600&fit=crop" },
    { city: "Dubai", count: "95", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop" },
    { city: "Kyoto", count: "73", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop" },
];
function Booking() {
    const { user, logout } = useAuth();

    const menuStyle = {
        cursor: "pointer",
        padding: "8px 0",
        fontSize: 14,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.8)",
    };

    const navigate = useNavigate();
    const [openSidebar, setOpenSidebar] = useState(false);
    const [page, setPage] = useState(0);
    const [vnPage, setVnPage] = useState(0);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);

    useEffect(() => {
      getRooms()
        .then((data) => {
          const available = data.filter((r) => r.status !== "maintenance");
          setRooms(available.map(mapRoomForDisplay));
        })
        .catch(() => setRooms([]))
        .finally(() => setRoomsLoading(false));
    }, []);

    // Modal booking room
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        checkIn: "",
        checkOut: "",
        guests: 1,
    });
    const [bookingError, setBookingError] = useState("");

    const openBookingModal = (room) => {
        if (!room?.id) {
            alert("This showcase room is for viewing only. Please choose a room from the live room list.");
            return;
        }

        setSelectedRoom(room);
        setBookingForm({
            checkIn: "",
            checkOut: "",
            guests: 1,
        });
        setBookingError("");
    };

    const closeBookingModal = () => {
        setSelectedRoom(null);
        setBookingError("");
    };

    const calculateTotal = () => {
        if (!selectedRoom || !bookingForm.checkIn || !bookingForm.checkOut) {
            return 0;
        }

        const checkInDate = new Date(bookingForm.checkIn);
        const checkOutDate = new Date(bookingForm.checkOut);
        const diffTime = checkOutDate - checkInDate;
        const nights = diffTime / (1000 * 60 * 60 * 24);

        if (nights <= 0) return 0;

        const priceNumber = Number(selectedRoom.price);

        return nights * priceNumber;
    };

    const handleBookRoom = async (e) => {
        e.preventDefault();
        setBookingError("");

        const guests = Number(bookingForm.guests);
        const capacity = Number(selectedRoom?.capacity) || 1;

        if (!selectedRoom?.id) {
            setBookingError("Phong khong hop le. Vui long chon phong tu danh sach.");
            return;
        }

        if (!bookingForm.checkIn || !bookingForm.checkOut) {
            setBookingError("Vui long chon ngay check-in va check-out.");
            return;
        }

        if (bookingForm.checkIn < todayStr) {
            setBookingError("Ngay check-in khong duoc o qua khu.");
            return;
        }

        if (bookingForm.checkOut <= bookingForm.checkIn || calculateTotal() <= 0) {
            setBookingError("Ngay check-out phai sau ngay check-in.");
            return;
        }

        if (!Number.isInteger(guests) || guests <= 0) {
            setBookingError("So khach phai lon hon 0.");
            return;
        }

        if (guests > capacity) {
            setBookingError(`So khach khong duoc vuot qua suc chua phong (${capacity} khach).`);
            return;
        }

        if (!selectedRoom?.id) {
            alert("Phòng không hợp lệ. Vui lòng chọn phòng từ danh sách.");
            return;
        }

        if (!bookingForm.checkIn || !bookingForm.checkOut) {
            alert("Vui lòng chọn ngày.");
            return;
        }

        if (calculateTotal() <= 0) {
            alert("Ngày không hợp lệ.");
            return;
        }

        try {
            setBookingSubmitting(true);

            const res = await createBooking({
                room_id: selectedRoom.id,
                check_in: bookingForm.checkIn,
                check_out: bookingForm.checkOut,
                guests,
            });

            alert(res.data.message);
            closeBookingModal();
            navigate("/my-bookings");
        } catch (err) {
            setBookingError(
                err.response?.data?.message ||
                "Đặt phòng thất bại"
            );
        } finally {
            setBookingSubmitting(false);
        }
    };

    const itemsPerPage = 3;
    const totalPages = Math.ceil(destinations.length / itemsPerPage);
    const visibleItems = destinations.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage);
    const next = () => setPage((p) => (p === totalPages - 1 ? 0 : p + 1));
    const prev = () => setPage((p) => (p === 0 ? totalPages - 1 : p - 1));

    const vnPerPage = 3;
    const vnTotalPages = Math.max(1, Math.ceil(rooms.length / vnPerPage));
    const vnVisible = rooms.slice(vnPage * vnPerPage, vnPage * vnPerPage + vnPerPage);

    const todayStr = new Date().toISOString().split("T")[0];

    return (
        <div className="font-body" style={{ minHeight: "max(884px, 100dvh)", background: "#fafafa", color: "#1A1C1E" }}>
            <style>{materialIconsStyle}</style>

            {/* Sidebar */}
            <div style={{
                position: "fixed", top: 0, left: openSidebar ? 0 : "-260px",
                width: "250px", height: "100vh", background: "#0b0e14", color: "#fff",
                padding: "20px", transition: "left 0.3s ease", zIndex: 1000,
            }}>
                <h3 style={{ marginBottom: 20, fontFamily: "Noto Serif, serif" }}>Menu</h3>
                {user?.role === "admin" && (
                    <>
                        <p
                            onClick={() => {
                                navigate("/dashboard");
                                setOpenSidebar(false);
                            }}
                            style={menuStyle}
                        >
                            Dashboard
                        </p>

                        <p
                            onClick={() => {
                                navigate("/users");
                                setOpenSidebar(false);
                            }}
                            style={menuStyle}
                        >
                            Users
                        </p>

                        <p
                            onClick={() => {
                                navigate("/orders");
                                setOpenSidebar(false);
                            }}
                            style={menuStyle}
                        >
                            Orders
                        </p>

                        <p
                            onClick={() => {
                                navigate("/settings");
                                setOpenSidebar(false);
                            }}
                            style={menuStyle}
                        >
                            Settings
                        </p>
                    </>
                )}

                <p
                    onClick={() => {
                        navigate("/my-bookings");
                        setOpenSidebar(false);
                    }}
                    style={menuStyle}
                >
                    My Bookings
                </p>

                <p
                    onClick={() => {
                        navigate("/booking");
                        setOpenSidebar(false);
                    }}
                    style={menuStyle}
                >
                    Booking
                </p>
                <button onClick={() => setOpenSidebar(false)}
                    style={{ marginTop: 20, padding: "8px 12px", background: "#C5A059", color: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Close
                </button>
            </div>
            {openSidebar && (
                <div onClick={() => setOpenSidebar(false)}
                    style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", zIndex: 999 }} />
            )}

            {/* Header */}
            <header className="glass-nav" style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, boxShadow: "0 1px 20px rgba(0,0,0,0.08)" }}>
                <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span className="material-symbols-outlined" onClick={() => setOpenSidebar(true)}
                            style={{ color: "#002366", cursor: "pointer", fontSize: 24 }}>menu</span>
                        <span className="font-headline" style={{ fontSize: 22, fontWeight: "bold", color: "#002366", letterSpacing: "-0.5px" }}>LuxeStay</span>
                    </div>
                    <div className="nav-links" style={{ display: "flex", gap: 40, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b" }}>
                        {["Destinations", "Experiences", "Offers", "Concierge"].map((item, i) => (
                            <a key={item} href="#" style={{ color: i === 0 ? "#002366" : undefined, fontWeight: i === 0 ? 600 : undefined, textDecoration: "none", transition: "color 0.2s" }}
                                onMouseEnter={e => e.target.style.color = "#C5A059"}
                                onMouseLeave={e => e.target.style.color = i === 0 ? "#002366" : "#64748b"}>
                                {item}
                            </a>
                        ))}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <span
                            style={{
                                color: "#002366",
                                fontWeight: 600,
                            }}
                        >
                            {user?.name}
                        </span>

                        <button
                            onClick={() => navigate("/my-bookings")}
                            style={{
                                padding: "8px 14px",
                                border: "1px solid #002366",
                                background: "transparent",
                                color: "#002366",
                                cursor: "pointer",
                                borderRadius: 6,
                                fontSize: 13,
                            }}
                        >
                            My Bookings
                        </button>

                        <button
                            onClick={() => {
                                logout();
                                navigate("/login");
                            }}
                            style={{
                                padding: "8px 14px",
                                border: "none",
                                background: "#002366",
                                color: "#fff",
                                cursor: "pointer",
                                borderRadius: 6,
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </nav>
            </header>

            <main>
                {/* Hero */}
                <section style={{ position: "relative", height: "795px", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                        <img alt="Luxury Hotel Lobby" onError={useFallbackImage} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe1eIrCHeHTRnMBMHnCSsRPwJt2r7uVIHNSbs8Y4L_JSF-yCK1ezkKDT2tQ0KBlDM7zKc5PvQMc1BB4rQIbRwR2gT6ArIp9bdggjM8xyhs5yVepCrRWoCLQzAaqGjFSiIh63y8UHCTixjtjtTE5QZ_1dzRvTQTY0qwqSsrr8OQXCEJlv5S9HOD8H5Gdx_niCODZXMsZBOs3QGZ_ZIIKxNaIlPT9TNPRAzc7EceXWHBKhvbbe0VRgb9Xl_J0PoLqWhMD8UalNr9UXc" />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,17,58,0.4) 0%, rgba(0,17,58,0.1) 50%, rgba(249,249,252,1) 100%)" }} />
                    </div>
                    <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1100, padding: "0 32px 48px", textAlign: "center" }}>
                        <h1 className="hero-title font-headline" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "#002366", marginBottom: 24, letterSpacing: "-1px" }}>The Art of Refined Living</h1>
                        <p className="font-label" style={{ color: "#C5A059", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 48, fontWeight: 600, fontSize: 13 }}>Exclusively Curated Global Sanctuaries</p>
                        {/* Search Bar */}
                        <div className="search-bar" style={{ background: "#fff", boxShadow: "0 4px 30px rgba(0,0,0,0.12)", padding: "8px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0, borderRadius: 6 }}>
                            {[
                                { label: "Destination", placeholder: "Where to next?" },
                                { label: "Check-in/out", placeholder: "Select dates" },
                                { label: "Guests", placeholder: "2 Adults, 1 Room" },
                            ].map(({ label, placeholder }, i) => (
                                <div key={label} style={{ flex: 1, minWidth: 160, padding: "12px 20px", borderRight: i < 2 ? "1px solid rgba(0,0,0,0.08)" : "none" }}>
                                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>{label}</div>
                                    <input style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: "#002366", fontWeight: 500, fontSize: 14 }} placeholder={placeholder} />
                                </div>
                            ))}
                            <button style={{ padding: "14px 32px", background: "#002366", color: "#fff", border: "none", borderRadius: 4, fontFamily: "Manrope, sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", whiteSpace: "nowrap" }}>
                                Search
                            </button>
                        </div>
                    </div>
                </section>

                {/* Signature Destinations */}
                <section style={{ padding: "96px 0", background: "#fff" }}>
                    <div style={{ padding: "0 32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
                            <div>
                                <span style={{ color: "#C5A059", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, display: "block", marginBottom: 8 }}>Curated Journeys</span>
                                <h2 className="font-headline" style={{ fontSize: 36, color: "#002366", margin: 0 }}>Signature Destinations</h2>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                {[prev, next].map((fn, i) => (
                                    <button key={i} onClick={fn} style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {i === 0 ? "‹" : "›"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="destinations-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                            {visibleItems.map(({ city, count, img }) => (
                                <div key={city} style={{ cursor: "pointer" }}
                                    onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.08)"}
                                    onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
                                    <div style={{ borderRadius: 12, aspectRatio: "3/4", overflow: "hidden", position: "relative" }}>
                                        <img src={normalizeImageUrl(img)} alt={city} onError={useFallbackImage} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s ease" }} />
                                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,35,102,0.6) 0%, transparent 50%)" }} />
                                        <div style={{ position: "absolute", bottom: 24, left: 24 }}>
                                            <h3 className="font-headline" style={{ color: "#fff", fontSize: 28, margin: 0 }}>{city}</h3>
                                            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", margin: "4px 0 0" }}>{count} Properties</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button key={i} onClick={() => setPage(i)}
                                style={{ height: 8, width: page === i ? 24 : 8, borderRadius: 4, background: page === i ? "#002366" : "#cbd5e1", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
                        ))}
                    </div>
                </section>

                {/* Exquisite Vietnam */}
                <section style={{ padding: "96px 0", background: "#f8f8f8", overflow: "hidden" }}>
                    <div style={{ padding: "0 32px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, gap: 16 }}>
                            <div>
                                <span style={{ color: "#C5A059", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, display: "block", marginBottom: 8 }}>Heritage &amp; Elegance</span>
                                <h2 className="font-headline" style={{ fontSize: 36, color: "#002366", margin: 0 }}>Featured Rooms</h2>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                                <p style={{ color: "#6b7280", maxWidth: 380, fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                                    Chọn phòng từ hệ thống LuxeStay — giá và tình trạng được cập nhật theo thời gian thực.
                                </p>
                                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                                    {[-1, 1].map((dir, i) => (
                                        <button key={i} onClick={() => setVnPage(p => {
                                            return dir === -1 ? (p === 0 ? vnTotalPages - 1 : p - 1) : (p === vnTotalPages - 1 ? 0 : p + 1);
                                        })}
                                            style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "#002366"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#002366"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                                            {dir === -1 ? "‹" : "›"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {roomsLoading ? (
                            <p style={{ textAlign: "center", color: "#64748b", padding: "40px 0" }}>
                                Đang tải danh sách phòng...
                            </p>
                        ) : rooms.length === 0 ? (
                            <p style={{ textAlign: "center", color: "#64748b", padding: "40px 0" }}>
                                Chưa có phòng nào. Admin vui lòng thêm phòng trong trang Rooms.
                            </p>
                        ) : (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
                                    {vnVisible.map(({ id, name, location, desc, icons, img, price, type, capacity }) => (
                                        <div key={id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", transition: "transform 0.3s, box-shadow 0.3s" }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.14)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)"; }}>
                                            <div
                                                onClick={() =>
                                                    openBookingModal({
                                                        id,
                                                        name,
                                                        location,
                                                        desc,
                                                        img,
                                                        price,
                                                        capacity,
                                                        type: type || "Luxury Room",
                                                    })
                                                }
                                                style={{
                                                    height: 260,
                                                    overflow: "hidden",
                                                    position: "relative",
                                                    cursor: "pointer",
                                                }}
                                                onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.06)"}
                                                onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}
                                            >
                                                <img
                                                    alt={name}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        transition: "transform 1s ease"
                                                    }}
                                                    src={normalizeImageUrl(img)}
                                                    onError={useFallbackImage}
                                                />
                                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 50%)" }} />
                                                <div style={{ position: "absolute", top: 14, right: 14, background: "#C5A059", color: "#000", padding: "4px 12px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>{Number(price).toLocaleString("vi-VN")} đ/đêm</div>
                                            </div>
                                            <div style={{ padding: 28 }}>
                                                <h3 className="font-headline" style={{ fontSize: 20, color: "#002366", marginBottom: 10, marginTop: 0, lineHeight: 1.3 }}>{name}</h3>
                                                <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>{desc}</p>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 20 }}>
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        {icons.map((icon) => (
                                                            <div key={icon} style={{ width: 40, height: 40, borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s" }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = "#C5A059"; e.currentTarget.querySelector("span").style.color = "#fff"; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.querySelector("span").style.color = "#002366"; }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#002366" }}>{icon}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openBookingModal({
                                                                id,
                                                                name,
                                                                location,
                                                                desc,
                                                                img,
                                                                price,
                                                                capacity,
                                                                type: type || "Luxury Room",
                                                            })
                                                        }
                                                        style={{ color: "#002366", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                                                    >
                                                        Book now →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {vnTotalPages > 1 && (
                                    <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 36 }}>
                                        {Array.from({ length: vnTotalPages }).map((_, i) => (
                                            <button key={i} onClick={() => setVnPage(i)}
                                                style={{ height: 8, width: vnPage === i ? 28 : 8, borderRadius: 4, background: vnPage === i ? "#002366" : "#cbd5e1", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Suite Collection */}
                <section style={{ padding: "96px 0", background: "#f8f8f8" }}>
                    <div style={{ padding: "0 32px" }}>
                        <div style={{ textAlign: "center", marginBottom: 64 }}>
                            <span style={{ color: "#C5A059", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, display: "block", marginBottom: 8 }}>Our Selection</span>
                            <h2 className="font-headline" style={{ fontSize: 36, color: "#002366", margin: 0 }}>The Suite Collection</h2>
                        </div>
                        <div className="suite-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
                            {[
                                { name: "The Royal Heritage", location: "Lake Como, Italy", price: "€1,250", amenities: [["spa", "Spa"], ["pool", "Infinity Pool"], ["restaurant", "Michelin Star"]], img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYN5w-_7gAhweJe8N6tWrBo3cRg2J4JIFXUCMvzMXuZh_eLgTSg9VncSjFY22Dd-kg9Mj_1emiC4wdb4FbcflklVTz6wRQsgMVVREqVRfxtCXAm0nt_rJSM845zVtXyhKxUXKjE2AWwHaDFNjQF8GmzPvYyR7FYjpP7iAnmZUeB-NN0lEHJjyBSZrV5OuX98KZ-xe3P_14VFSg1YPAZQodNDyEJ8Aie9uSGswJWI8BbYzi0CiCa2MYc6e7o-kDJYKaUWg_gVzKQ1U" },
                                { name: "Aman Zenith", location: "Kyoto, Japan", price: "¥240,000", amenities: [["mode", "Zen Garden"], ["hot_tub", "Onsen"], ["concierge", "Private Butler"]], img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAl5hm6dd_3xwJdHDGs4CX0GNWvMqTb0q-eTttwfL1aN1Uy1BPiWnPUlg3_CEU-OUCW3PdYfrySmSLX63VYd1gmyhqkqHeEXGyS7B6Xgr2mMj_i43yFwhfitA7babphjGnBrRT_kweSSDrqPYlaFzLN-pZqI6fDSv_sfQduGKHfgwJ5DZvY5If7ZZ8mQs62x8XePDEJCl4Cg6M0-M01AY9Y9BebuUt8K2QGEczRI6NIchfyv7ks82pd4lVXLssuPGGSEA3oz1pViPE" },
                                { name: "Azure Bay Resort", location: "Bora Bora", price: "$3,400", amenities: [["waves", "Private Beach"], ["sailing", "Yacht Access"], ["scuba_diving", "Diving"]], img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRgQpVx28Yubn_M3-wWZVRpuixG91q_izclCliw81aah5sMT8o1RZyq_ZZv5rnWbwtQhaHof756HtF-zVCEDc4OOP9pdTwTHDwVQHT0j9Yfz7XO2bYkNJik1anS_NKiCQmKlU7WPSLMQvHyrROENFT6lgpbixmtxWIeDVx_uaHxQOwypYUjPkJVMiMQwfh-ywAw9BLAogsrVSrcxQFKsDYttnkcks1S-lvwfAih2HovGzukkOTLRdpgcBg7IhTIXpfOC3bdn2hZ4s" },
                            ].map(({ name, location, price, amenities, img }) => (
                                <div key={name} style={{ background: "#fff", overflow: "hidden" }}>
                                    <div
                                        onClick={() =>
                                            openBookingModal({
                                                name,
                                                location,
                                                price,
                                                img,
                                                type: "Suite Room",
                                                desc: "Luxury suite room with premium services and elegant design.",
                                            })
                                        }
                                        style={{
                                            aspectRatio: "4/3",
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            position: "relative",
                                        }}
                                    >
                                        <img
                                            alt={name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                transition: "transform 0.5s ease",
                                            }}
                                            src={normalizeImageUrl(img)}
                                            onError={useFallbackImage}
                                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                        />

                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: 12,
                                                left: 12,
                                                background: "rgba(0, 35, 102, 0.85)",
                                                color: "#fff",
                                                padding: "6px 12px",
                                                fontSize: 11,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.12em",
                                                borderRadius: 4,
                                            }}
                                        >
                                            Click to book
                                        </div>
                                    </div>
                                    <div style={{ padding: 32 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                            <div>
                                                <h3 className="font-headline" style={{ fontSize: 22, color: "#002366", margin: "0 0 6px" }}>{name}</h3>
                                                <p style={{ color: "#6b7280", fontSize: 13, display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                                                    {location}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <p className="font-headline" style={{ fontSize: 22, color: "#C5A059", margin: 0 }}>{price}</p>
                                                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", margin: "2px 0 0" }}>Per Night</p>
                                            </div>
                                        </div>
                                        {/* Fixed amenities row */}
                                        <div className="amenity-row">
                                            {amenities.map(([icon, label]) => (
                                                <span key={label} className="amenity-item">
                                                    <span className="material-symbols-outlined">{icon}</span>
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                        <button
                                            style={{ width: "100%", padding: "16px", border: "1px solid #002366", background: "transparent", color: "#002366", fontFamily: "Manrope, sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.3s" }}
                                            onMouseEnter={e => { e.target.style.background = "#002366"; e.target.style.color = "#fff"; }}
                                            onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#002366"; }}>
                                            View Sanctuary
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why LuxeStay */}
                <section style={{ padding: "112px 0", background: "#f7f7f7" }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
                        <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 60, textAlign: "center" }}>
                            {[
                                { icon: "verified", title: "Handpicked Selection", desc: "Every property in our collection is personally inspected to meet our rigorous 200-point standard of excellence." },
                                { icon: "support_agent", title: "24/7 Concierge", desc: "Your personal travel artisan is available around the clock to handle everything from reservations to private charters." },
                                { icon: "payments", title: "Best Price Guarantee", desc: "Luxury shouldn't be overpaid. We guarantee the most competitive rates for the world's most prestigious suites." },
                            ].map(({ icon, title, desc }) => (
                                <div key={title} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
                                        <span className="material-symbols-outlined" style={{ color: "#C5A059", fontSize: 26 }}>{icon}</span>
                                    </div>
                                    <h4 className="font-headline" style={{ color: "#001B5E", fontSize: 22, marginBottom: 20, marginTop: 0 }}>{title}</h4>
                                    <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.8, maxWidth: 280, margin: 0 }}>{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Quote */}
                <section style={{ background: "#001B5E", padding: "128px 0", overflow: "hidden" }}>
                    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
                        <div style={{ color: "#C5A059", fontSize: 72, fontFamily: "Noto Serif, serif", marginBottom: 32, lineHeight: 1 }}>"</div>
                        <h2 className="font-headline" style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.4, fontStyle: "italic", margin: "0 0 56px" }}>
                            "The level of detail and personal attention provided by LuxeStay transformed our honeymoon into a masterpiece of memories. Simply unparalleled service."
                        </h2>
                        <p style={{ color: "#C5A059", textTransform: "uppercase", letterSpacing: "0.3em", fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>Eleanor Vanderbilt</p>
                        <p style={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.25em", fontSize: 11, margin: 0 }}>New York, NY</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 48 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C5A059" }} />
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section style={{ position: "relative", padding: "128px 0", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                        <img alt="Poolside Luxury" onError={useFallbackImage} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5LXgNktzMjgk6YMo0A545hrJ2H-FzYcOmqRul-Gzz_EMbi37IwO8wC0iuAvwI6_bwROKlsZCObpIF5DOK2g9i42TxFmQ1psUpcMFotaUHR6T-V1qaOelvGnl9jdJB7t4QFjHvAed8J_CIwPa82lV_K4sS4f6klKhO290e3JxQDMaXQJP7R_bKLmn1VKs4AfRkj_04QSLFBAAEvow10SJfR7MPCVHMHWKxAGFEXwcDxJTXecwgXL9y-WoHg9rX4GHY-B3ayjTX3K0" />
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,35,102,0.45)", backdropFilter: "blur(2px)" }} />
                    </div>
                    <div style={{ position: "relative", zIndex: 10, padding: "0 32px", textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
                        <h2 className="font-headline" style={{ color: "#fff", fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: 32 }}>Elevate Your Travel Identity</h2>
                        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, lineHeight: 1.7, marginBottom: 48 }}>
                            Join the LuxeStay Circle and unlock private member rates, room upgrades, and complimentary chauffeur services at over 2,000 locations worldwide.
                        </p>
                        <button style={{ padding: "20px 48px", background: "#C5A059", color: "#000", border: "none", fontFamily: "Manrope, sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}
                            onMouseEnter={e => e.target.style.opacity = "0.85"}
                            onMouseLeave={e => e.target.style.opacity = "1"}>
                            Join The Membership
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer style={{ background: "#f8fafc" }}>
                <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1fr repeat(3, auto)", gap: 32, padding: "64px 48px" }}>
                    <div>
                        <span className="font-headline" style={{ fontSize: 20, color: "#002366", display: "block", marginBottom: 20 }}>LuxeStay</span>
                        <p style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", lineHeight: 1.8, maxWidth: 220 }}>Redefining the standards of global hospitality and travel curation since 2012.</p>
                    </div>
                    {[
                        { title: "Discover", links: ["Destinations", "Experiences", "Collections"] },
                        { title: "About", links: ["Our Story", "Concierge Services", "Press"] },
                        { title: "Legal", links: ["Terms of Service", "Privacy Policy"] },
                    ].map(({ title, links }) => (
                        <div key={title}>
                            <h5 style={{ color: "#002366", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 24, marginTop: 0, fontWeight: 700 }}>{title}</h5>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                                {links.map(link => (
                                    <li key={link}>
                                        <a href="#" style={{ color: "#64748b", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", textDecoration: "none" }}
                                            onMouseEnter={e => e.target.style.textDecoration = "underline"}
                                            onMouseLeave={e => e.target.style.textDecoration = "none"}>
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div style={{ padding: "24px 48px", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <p style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>© 2024 LuxeStay International. All rights reserved.</p>
                    <div style={{ display: "flex", gap: 20 }}>
                        <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>public</span>
                        <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>share</span>
                    </div>
                </div>
            </footer>
            {/* Booking Room Modal */}
            {selectedRoom && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.65)",
                        zIndex: 3000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                    }}
                    onClick={closeBookingModal}
                >
                    <div
                        className="booking-modal-panel"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 920,
                            background: "#fff",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            borderRadius: 18,
                            overflow: "hidden",
                            boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
                        }}
                    >
                        {/* Left image */}
                        <div
                            className="booking-modal-image"
                            style={{
                                minHeight: 520,
                                backgroundImage: `url(${normalizeImageUrl(selectedRoom.img)})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                position: "relative",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(to top, rgba(0,35,102,0.7), transparent)",
                                }}
                            />

                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 32,
                                    left: 32,
                                    right: 32,
                                    color: "#fff",
                                }}
                            >
                                <p
                                    style={{
                                        color: "#C5A059",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.18em",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        marginBottom: 8,
                                    }}
                                >
                                    {selectedRoom.type}
                                </p>

                                <h2
                                    className="font-headline"
                                    style={{
                                        fontSize: 32,
                                        margin: "0 0 8px",
                                    }}
                                >
                                    {selectedRoom.name}
                                </h2>

                                <p style={{ margin: 0, color: "rgba(255,255,255,0.85)" }}>
                                    {selectedRoom.location}
                                </p>
                            </div>
                        </div>

                        {/* Right form */}
                        <form
                            className="booking-modal-form"
                            onSubmit={handleBookRoom}
                            style={{
                                padding: 40,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >
                            <button
                                type="button"
                                onClick={closeBookingModal}
                                style={{
                                    alignSelf: "flex-end",
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    border: "1px solid #e5e7eb",
                                    background: "#fff",
                                    cursor: "pointer",
                                    fontSize: 18,
                                    marginBottom: 12,
                                }}
                            >
                                ×
                            </button>

                            <span
                                style={{
                                    color: "#C5A059",
                                    fontSize: 12,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.2em",
                                    fontWeight: 700,
                                    marginBottom: 8,
                                }}
                            >
                                Book your stay
                            </span>

                            <h2
                                className="font-headline"
                                style={{
                                    color: "#002366",
                                    fontSize: 34,
                                    margin: "0 0 12px",
                                }}
                            >
                                Reserve Room
                            </h2>

                            <p
                                style={{
                                    color: "#6b7280",
                                    lineHeight: 1.7,
                                    fontSize: 14,
                                    marginBottom: 24,
                                }}
                            >
                                {selectedRoom.desc}
                            </p>

                            <div style={{ marginBottom: 18 }}>
                                <label style={bookingLabelStyle}>Check-in</label>
                                <input
                                    type="date"
                                    min={todayStr}
                                    value={bookingForm.checkIn}
                                    onChange={(e) =>
                                        setBookingForm({
                                            ...bookingForm,
                                            checkIn: e.target.value,
                                        })
                                    }
                                    style={bookingInputStyle}
                                />
                            </div>

                            <div style={{ marginBottom: 18 }}>
                                <label style={bookingLabelStyle}>Check-out</label>
                                <input
                                    type="date"
                                    min={bookingForm.checkIn || todayStr}
                                    value={bookingForm.checkOut}
                                    onChange={(e) =>
                                        setBookingForm({
                                            ...bookingForm,
                                            checkOut: e.target.value,
                                        })
                                    }
                                    style={bookingInputStyle}
                                />
                            </div>

                            <div style={{ marginBottom: 18 }}>
                                <label style={bookingLabelStyle}>Guests</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedRoom.capacity}
                                    value={bookingForm.guests}
                                    onChange={(e) =>
                                        setBookingForm({
                                            ...bookingForm,
                                            guests: e.target.value,
                                        })
                                    }
                                    style={bookingInputStyle}
                                />
                            </div>

                            <div
                                style={{
                                    background: "#f8fafc",
                                    padding: 18,
                                    borderRadius: 12,
                                    marginBottom: 22,
                                    border: "1px solid #e5e7eb",
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 6px",
                                        color: "#64748b",
                                        fontSize: 13,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                    }}
                                >
                                    Estimated total
                                </p>

                                <h2
                                    style={{
                                        margin: 0,
                                        color: "#C5A059",
                                        fontSize: 28,
                                    }}
                                >
                                    {calculateTotal().toLocaleString("vi-VN")} VNĐ
                                </h2>
                            </div>

                            {bookingError && (
                                <div
                                    style={{
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        borderRadius: 8,
                                        color: "#b91c1c",
                                        fontSize: 13,
                                        lineHeight: 1.5,
                                        marginBottom: 18,
                                        padding: "10px 12px",
                                    }}
                                >
                                    {bookingError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={bookingSubmitting}
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: "none",
                                    background: "#002366",
                                    color: "#fff",
                                    fontSize: 12,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.15em",
                                    fontWeight: 700,
                                    cursor: bookingSubmitting ? "not-allowed" : "pointer",
                                    opacity: bookingSubmitting ? 0.65 : 1,
                                    borderRadius: 6,
                                }}
                            >
                                {bookingSubmitting ? "Booking..." : "Confirm Booking"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
const bookingLabelStyle = {
    display: "block",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: 8,
};

const bookingInputStyle = {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
};
export default Booking;
