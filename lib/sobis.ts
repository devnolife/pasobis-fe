/**
 * Helper to send data to the SOBIS WhatsApp gateway.
 * The payload interface follows the official API documentation (2025-08 update).
 */
export interface SobisPayload {
  number: string;                 // WhatsApp number, e.g. "6285171079687"
  nama: string;                   // Nama lengkap
  pilihan1: string;               // Pilihan pertama
  pilihan2: string;               // Pilihan kedua
  pilihan3: string;               // Pilihan ketiga
  programStudiDilulusi: string;   // Program studi dilulusi
  bayarPendaftaran: "Y" | "N";    // Sudah bayar? Y/N
  biodata: "Y" | "N";             // Biodata lengkap? Y/N
  uploadBerkas: "Y" | "N";        // Berkas ter-upload? Y/N
  validasi: "Y" | "N";            // Sudah divalidasi? Y/N
  daftarUlang: "Y" | "N";         // Sudah daftar ulang? Y/N
}

export interface SobisResponse {
  status: string;             // "success" | "error" or other message
  message?: string;           // optional human readable message
  [key: string]: unknown;     // allow additional fields
}

/**
 * sendSobis
 * Sends the given payload to https://passobis.if.unismuh.ac.id/sobis/send.
 * Throws if the network request fails or if the server returns a non-2xx status.
 */
export async function sendSobis(payload: SobisPayload): Promise<SobisResponse> {
  const res = await fetch("https://passobis.if.unismuh.ac.id/sobis/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // Try to parse server error response
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    throw new Error(`SOBIS request failed (${res.status}): ${JSON.stringify(detail)}`);
  }

  // Normal, successful response
  return (await res.json()) as SobisResponse;
}
