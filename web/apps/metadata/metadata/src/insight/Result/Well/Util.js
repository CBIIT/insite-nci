// Return { id, name, description, plate } or null if not present
export function getWellPlateInfo(rec) {
  if (!rec || typeof rec !== "object") return null;

  // 1) Try explicit parent_plate_id first
  let plateId = rec.parent_plate_id ?? rec.plate_id ?? null;
  let plateObj = plateId != null ? rec[`Plate_${plateId}`] : undefined;

  // 2) Fallback: scan for any Plate_<digits> key
  if (!plateObj) {
    const plateKey = Object.keys(rec).find(
      (k) => /^Plate_\d+$/.test(k) && rec[k] && typeof rec[k] === "object"
    );
    if (plateKey) {
      plateObj = rec[plateKey];
      const m = plateKey.match(/^Plate_(\d+)$/);
      if (m) plateId = Number(m[1]);
    }
  }

  if (!plateObj) return null;

  const id = Number(plateObj.id ?? plateId);
  const name = typeof plateObj.name === "string" ? plateObj.name : "";
  const description =
    typeof plateObj.description === "string" ? plateObj.description : "";

  return { id, name, description, plate: plateObj };
};
