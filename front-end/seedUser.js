import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

const firstNames = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vo", "Dang", "Bui", "Do", "Ngo", "Vu", "Dinh", "Ha", "Duong", "Ly"];
const middleNames = ["Van", "Thi", "Minh", "Thanh", "Hoang", "Quoc", "Tuan", "Phuong", "Thu", "Ngoc"];
const lastNames = ["An", "Bich", "Nam", "Duc", "Ha", "Bao", "Lan", "Long", "Linh", "Kiet", "Hung", "Hoa", "Mai", "Dung", "Trang", "Hieu", "Khoa", "Lam", "Phuc", "Thinh"];

const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  const prefixes = ["090", "091", "092", "093", "094", "096", "097", "098", "099", "070", "079", "077"];
  return randomItem(prefixes) + Math.floor(Math.random() * 10000000).toString().padStart(7, "0");
}

function randomDate() {
  const start = new Date(2022, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function seedUsers() {
  const users = [];

  for (let i = 0; i < 100; i++) {
    const first = randomItem(firstNames);
    const middle = randomItem(middleNames);
    const last = randomItem(lastNames);
    const name = `${first} ${middle} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@${randomItem(domains)}`;
    const phone = randomPhone();

    users.push({ name, email, phone, createdAt: randomDate() });
  }

  for (const user of users) {
    await addDoc(collection(db, "users"), user);
    console.log("✅ Added:", user.name);
  }

  console.log("🎉 Done! 100 users added.");
}