export const programs = [
  "Informatika",
  "Farmasi",
  "Teknik Pengairan",
  "Teknik Sipil",
  "Manajemen",
  "Akuntansi",
  "Hukum",
  "Kedokteran",
  "Psikologi",
  "Arsitektur",
] as const

export type Program = (typeof programs)[number]
