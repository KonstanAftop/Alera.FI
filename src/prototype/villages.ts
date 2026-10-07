export const initialVillages = [
  ...["Cikitu", "Sukarame", "Resmi", "Cihawuk", "Caksana", "Dukuh", "Pangguh", "Cikawito", "Loa", "Drawati", "Cipaku"].map((name) => `hulu/${name}`),
  ...["Majalaya", "Majasetra", "Majakerta", "Sukamaju", "Tanggaling", "Sukamantri", "Bojong", "Panyadap"].map((name) => `hilir/${name}`),
];

export function normalizeVillage(name: string) {
  return initialVillages.find((v) => v.split("/")[1].toLowerCase() === name.trim().toLowerCase()
    || v.toLowerCase() === name.trim().toLowerCase()) ?? name.trim();
}

// Seed the new list once; subsequent removals remain effective on reload.
export function migrateVillages(saved: string[]) {
  return [...new Set([...initialVillages, ...saved.map(normalizeVillage)])];
}
