import { google } from "googleapis";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Load environment variables
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const spreadsheetId = process.env.SHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return res.status(500).json({ error: "Missing Google API credentials" });
    }

    // 2. Authenticate with JWT
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    // 3. Get values and sheetName from request body
    const { values, sheetName } = req.body;

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ error: "Invalid request body, expected { values: [] }" });
    }

    if (!sheetName || typeof sheetName !== "string") {
      return res.status(400).json({ error: "Missing or invalid sheetName in request" });
    }

    // 4. Create timestamp in Lisbon time
    const now = new Date();
    const timestamp = now.toLocaleString("en-GB", { 
      timeZone: "Europe/Lisbon", 
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false 
    });

    const row = [timestamp, ...values]; // timestamp first, then form values

    if (process.env.NODE_ENV !== "production") {
      console.log("Appending to sheet:", { spreadsheetId, sheetName, row });
    }

    // 5. Append row to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`, // allow flexible columns
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return res.status(200).json({ message: "Data added successfully" });

  } catch (err) {
    console.error("Error appending to sheet:", err.errors || err.message);
    return res.status(500).json({
      error: "Failed to add data to sheet",
      details: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
}
