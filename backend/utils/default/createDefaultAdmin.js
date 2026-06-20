import Staff from "../../models/staffModel.js";

export async function createDefaultAdminIfNotExists() {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  // First, check if admin already exists
  let admin = await Staff.findOne({ email });

  if (!admin) {
    // If not, create a new admin
    admin = new Staff({
      firstName: "Admin",
      lastName: "User",
      email,
      password,
      role: "admin",
    });

    await admin.save(); // 🔥 This will trigger password encryption
    console.log("✅ Default admin created successfully.");
  } else {
    console.log("✅ Default admin already exists.");
  }

  return admin;
}
