import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Load environment variables (set in Vercel dashboard)
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"); // important: fix line breaks
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 2. Authenticate
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    // 3. Get form data from frontend
    const { values } = req.body; 
    // Example: { values: ["2025-09-12", "Coffee", "2.50", "Food"] }

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // 4. Append to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Penny!A:D", // <-- change to your sheet/tab name & columns
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });

    return res.status(200).json({ message: "Data added successfully" });

  } catch (err) {
    console.error("Error appending to sheet:", err);
    return res.status(500).json({ error: "Failed to add data" });
  }
}
