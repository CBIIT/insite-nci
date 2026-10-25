import { safeClone } from "../../utils";

/**
 * 
 * @param {*} data 
 * @param {*} omeroObjType 
 * @returns objects matching to specific objects
 */
export function getOmeroObjectCount (data, omeroObjType) {
    const objType = `${omeroObjType}`.toLowerCase();
    // avoid 
    const exploredObjIds = [];
    const filterByObjType = data.filter(item => {
        const keys = Object.keys(item);
        const matches = keys
            .filter(key => {
                const keyLC = `${key}`.toLowerCase();
                if (!exploredObjIds.includes(keyLC)) {
                    if (keyLC.includes(objType)) {
                        exploredObjIds.push(keyLC);
                        return true;
                    }
                }
                return false;
            });
        return matches.length > 0;
    }) || [];
    return filterByObjType;
};

// Normalize a key string for comparison (case/space/underscore/punct insensitive)
const normalizeKey = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, "");

// Depth-first search for the *first* occurrence of any alias key; stops as soon as it finds one.
export function findFirstAliasValue(root, aliasSet) {
  if (root == null) return undefined;

  const stack = [root];
  const seen = new Set();

  while (stack.length) {
    const node = stack.pop();
    if (node && typeof node === "object") {
      if (seen.has(node)) continue;
      seen.add(node);

      // Check keys at this level
      for (const [k, v] of Object.entries(node)) {
        if (aliasSet.has(normalizeKey(k))) {
          return v; // first match wins
        }
      }

      // Continue search: push children (objects/arrays)
      for (const v of Object.values(node)) {
        if (v && typeof v === "object") stack.push(v);
      }
    }
  }
  return undefined;
}

/**
 * Build chart-ready counts for a nested key with aliases.
 *
 * @param {Array<object>} items
 * @param {Object} targetSpec - e.g. { imagingMethod: ["imagingMethod", "imaging method", ...] }
 * @param {Object} [opts]
 * @param {'none'|'asc'|'desc'} [opts.sort='desc']  Sort by value count
 * @param {boolean} [opts.unknownLast=true]         Place "Unknown" at the end
 * @param {string}  [opts.unknownLabel='Unknown']   Label for unknown bucket
 * @returns {{ data: Array<{name: string, value: number}>, groups: Record<string,object[]> }}
 */
export function countsForChart(items, targetSpec, opts = {}) {
  const {
    sort = "desc",
    unknownLast = true,
    unknownLabel = "Unknown",
  } = opts;

  const [canonicalKey, aliases] = Object.entries(targetSpec)[0] || [];
  if (!canonicalKey || !Array.isArray(aliases)) {
    throw new Error("targetSpec must look like: { imagingMethod: [ ...aliases ] }");
  }

  // alias set (include canonical too)
  const aliasSet = new Set(aliases.concat([canonicalKey]).map(normalizeKey));

  // Group items
  const groups = { unknown: [] };
  for (const item of items || []) {
    const raw = findFirstAliasValue(item, aliasSet);
    const isEmpty =
      raw === undefined ||
      raw === null ||
      (typeof raw === "string" && raw.trim() === "");
    const key = isEmpty ? "unknown" : String(raw);
    (groups[key] ||= []).push(item);
  }

  // Counts to [{name,value}]
  let rows = Object.entries(groups).map(([k, arr]) => ({
    name: k === "unknown" ? unknownLabel : k,
    value: arr.length,
  }));

  // Optional sort
  if (sort !== "none") {
    rows.sort((a, b) =>
      sort === "asc" ? a.value - b.value : b.value - a.value
    );
  }

  // Unknown last
  if (unknownLast) {
    const known = rows.filter((r) => r.name !== unknownLabel);
    const unk = rows.filter((r) => r.name === unknownLabel);
    rows = [...known, ...unk];
  }

  return { counts: rows, groups };
}

/**
 * Group items by the value of a target field that may appear under multiple alias keys,
 * anywhere within each (possibly nested) item.
 *
 * @param {Array<object>} items
 * @param {Object} targetSpec - single-key object, e.g. { imagingMethod: [ "imagingMethod", "imaging method", ... ] }
 * @returns {{ key: string, groups: Record<string, object[]>, counts: Record<string, number> }}
 */
export function groupByAliasValue(items, targetSpec) {
  // Accept a single canonical key in targetSpec
  const [canonicalKey, aliases] = Object.entries(targetSpec)[0] || [];
  if (!canonicalKey || !Array.isArray(aliases)) {
    throw new Error("targetSpec must look like: { imagingMethod: [ ...aliases ] }");
  }

  // Build normalized alias set (include the canonical key too, just in case)
  const aliasSet = new Set(aliases.concat([canonicalKey]).map(normalizeKey));

  const groups = { unknown: [] };

  for (const item of items || []) {
    const raw = findFirstAliasValue(item, aliasSet);

    // Treat undefined/null/empty-string (after trim) as unknown
    const isEmpty =
      raw === undefined ||
      raw === null ||
      (typeof raw === "string" && raw.trim() === "");

    const bucketKey = isEmpty ? "unknown" : String(raw);
    if (!groups[bucketKey]) groups[bucketKey] = [];
    groups[bucketKey].push(item);
  }

  const counts = Object.fromEntries(
    Object.entries(groups).map(([k, arr]) => [k, arr.length])
  );

  return { key: canonicalKey, groups, counts };
}

/* -------- Example --------
const items = [ /* your objects * / ];
const spec = { imagingMethod: ["imagingMethod", "imaging method", "Imaging Method", "imaging_method"] };
const result = groupByAliasValue(items, spec);
// result.groups = { "Spinning Disk Confocal Microscopy": [...], unknown: [...] }
// result.counts = { "Spinning Disk Confocal Microscopy": N, unknown: M }
// result.key = "imagingMethod"
*/

// const DEFAULT_ORGANISM_ALIASES = [
//   "organism", "Organism", "organism.value",
//   "species", "Species", "species.value",
//   "commonName", "scientificName",
//   "ncbiTaxon", "taxon", "taxonId",
//   "specimens[0].organism", "specimens[0].organism.value",
//   "specimens[*].organism", "specimens[*].organism.value"
// ];

// // ---------- default alias lists ----------
// const DEFAULT_SAMPLE_TYPE_ALIASES = [
//   "sampleType","sample type","Sample Type","sample_type","sampletype",
//   "biosampleType","biosample type","Biosample Type","biosample_type","biosampletype",
//   "specimens[0].sampleType","specimens[0].sampleType.value",
//   "specimens[*].sampleType","specimens[*].sampleType.value",
//   "sampleType.value"
// ];

// const DEFAULT_IMAGING_METHOD_ALIASES = [
//   "imagingMethod","imaging method","Imaging Method","imaging_method",
//   "imagingMethod.value","Imaging Method.value"
//   // add more if you see them (e.g., "modality", "Microscopy")
// ];

// const DEFAULT_IMAGING_FACILITY_ALIASES = [
//   "imagingFacility","imaging facility","Imaging Facility","imaging_facility",
//   "imagingFacility.value","Imaging Facility.value"
// ];


// function collectAliasValues(root, aliasSet, out = []) {
//   if (root == null) return out;
//   const stack = [root];
//   const seen = new Set();
//   while (stack.length) {
//     const node = stack.pop();
//     if (!node || typeof node !== "object") continue;
//     if (seen.has(node)) continue;
//     seen.add(node);

//     for (const [k, v] of Object.entries(node)) {
//       if (aliasSet.has(normalizeKey(k))) out.push(v);
//       if (v && typeof v === "object") stack.push(v);
//     }
//   }
//   return out;
// };

// function toStringValues(v) {
//   if (v == null) return [];
//   if (Array.isArray(v)) return v.flatMap(toStringValues);
//   if (typeof v === "object") return [JSON.stringify(v)];
//   return [String(v)];
// };

// export const getFilterData = (data, activeFilters) => {
//   if (!activeFilters) {
//     return data || [];
//   }

//   // A. filter databased on omero object type
//   const omeroSelections = (activeFilters.omeroObjectCount || [])
//     .map(item => normalizeKey(item));
  
//   // filter based on omero object type
//   let updateData = safeClone(data);
//   // if (omeroSelections.length > 0) {
//   //   updateData = updateData.filter((item) => {
//   //     const keysLower = Object.keys(item).map((k) => k.toLowerCase());
//   //     // OR within the facet: any selected type may match
//   //     return omeroSelections.some((type) => {
//   //       const prefix = String(type).toLowerCase() + "_";
//   //       return keysLower.some((k) => k.startsWith(prefix));
//   //     });
//   //   })
//   // };

//   // cehck for omero object type match
//   const hasOmeroMatch = (item) => {
//     if (!omeroSelections.length) return true;
//     const keysLower = Object.keys(item).map((k) => k.toLowerCase());
//     return omeroSelections.some((type) => {
//       const prefix = String(type).toLowerCase() + "_";
//       return keysLower.some((k) => k.startsWith(prefix));
//     });
//   };

//   const hasAliasSubstringMatch = (item, aliasSet, needles) => {
//     if (!needles.length) return true;
//     const vals = collectAliasValues(item, aliasSet).flatMap(toStringValues);
//     if (!vals.length) return false;
//     return needles.some((needle) => {
//       const n = needle.toLowerCase();
//       return vals.some((val) => val.toLowerCase().includes(n));
//     });
//   };

//   // filter based on organism
//   const organismSelections  = (activeFilters?.organismCount || []).map(String);
//   const organismAliasSet = new Set(DEFAULT_ORGANISM_ALIASES.map(normalizeKey));
//   // const hasOrganismMatch = (item) =>
//   //   hasAliasSubstringMatch(item, organismAliasSet, organismSelections);
  
//   // filter sample type
//   const sampleAliasSet   = new Set(DEFAULT_SAMPLE_TYPE_ALIASES.map(normalizeKey));
//   const sampleSelections  = (activeFilters?.biosampleTypeCount || []).map(String);
//   // const hasSampleTypeMatch = (item) =>
//   //   hasAliasSubstringMatch(item, sampleAliasSet, sampleSelections);

//   // filter imagingFacilityCount
//   const imagingFacilitySelections  = (activeFilters?.imagingFacilityCount || []).map(String);
//   const imagingFacilityAliasSet   = new Set(DEFAULT_IMAGING_FACILITY_ALIASES.map(normalizeKey));
//   // const hasImagingFacilityMatch= (item) => hasAliasSubstringMatch(item, imagingFacilityAliasSet, imagingFacilitySelections);

//   // filter imagingMethodCount
//   const imagingMethodSelections  = (activeFilters?.imagingMethodCount || []).map(String);
//   const imagingMethodAliasSet   = new Set(DEFAULT_IMAGING_METHOD_ALIASES.map(normalizeKey));
//   // const hasImagingMethodMatch  = (item) => hasAliasSubstringMatch(item, imagingMethodAliasSet,   imagingMethodSelections);

//   // updateData = (updateData || []).filter(
//   //   (it) =>
//   //     hasOmeroMatch(it) || 
//   //     hasSampleTypeMatch(it) || 
//   //     hasOrganismMatch(it) || 
//   //     hasImagingMethodMatch(it) ||
//   //     hasImagingFacilityMatch(it)
//   //   );
//   const facetChecks = [
//     (it) => hasOmeroMatch(it),
//     (it) => hasAliasSubstringMatch(it, sampleAliasSet,   sampleSelections),
//     (it) => hasAliasSubstringMatch(it, organismAliasSet, organismSelections),
//     (it) => hasAliasSubstringMatch(it, imagingMethodAliasSet,   imagingMethodSelections),
//     (it) => hasAliasSubstringMatch(it, imagingFacilityAliasSet, imagingFacilitySelections),
//   ];

//   updateData = (updateData || []).filter((it) => facetChecks.some(fn => fn(it)));
//   console.log(updateData);
//   return updateData;
// }

function collectAliasValues(root, aliasSet, out = []) {
  if (root == null) return out;
  const stack = [root], seen = new Set();
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== "object") continue;
    if (seen.has(n)) continue; seen.add(n);
    for (const [k, v] of Object.entries(n)) {
      if (aliasSet.has(normalizeKey(k))) out.push(v);
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return out;
}

const toStringValues = (v) =>
  v == null ? [] :
  Array.isArray(v) ? v.flatMap(toStringValues) :
  typeof v === "object" ? [JSON.stringify(v)] :
  [String(v)];

const hasAliasSubstringMatch = (item, aliasSet, needles) => {
  if (!needles.length) return false;              // inactive facet -> doesn't count toward ANY
  const vals = collectAliasValues(item, aliasSet).flatMap(toStringValues);
  if (!vals.length) return false;
  return needles.some(n => {
    const needle = String(n).toLowerCase();
    return vals.some(val => String(val).toLowerCase().includes(needle));
  });
};

// ---------- alias lists ----------
const SAMPLE_TYPE_ALIASES = [
  "sampleType","sample type","Sample Type","sample_type","sampletype",
  "biosampleType","biosample type","Biosample Type","biosample_type","biosampletype",
  "specimens[0].sampleType","specimens[0].sampleType.value",
  "specimens[*].sampleType","specimens[*].sampleType.value","sampleType.value"
];

const ORGANISM_ALIASES = [
  "organism","Organism","organism.value",
  "specimens[0].organism","specimens[0].organism.value",
  "specimens[*].organism","specimens[*].organism.value"
];

const IMAGING_METHOD_ALIASES = [
  "imagingMethod","imaging method","Imaging Method","imaging_method",
  "imagingMethod.value","Imaging Method.value"
];

const IMAGING_FACILITY_ALIASES = [
  "imagingFacility","imaging facility","Imaging Facility","imaging_facility",
  "imagingFacility.value","Imaging Facility.value"
];

// ---------- ANY (OR) filter ----------
export function getFilterData(
  items,
  activeFilters,
  {
    sampleTypeAliases = SAMPLE_TYPE_ALIASES,
    organismAliases   = ORGANISM_ALIASES,
    imagingMethodAliases = IMAGING_METHOD_ALIASES,
    imagingFacilityAliases = IMAGING_FACILITY_ALIASES,
  } = {}
) {
  const omeroSel     = (activeFilters?.omeroObjectCount || []).map(String);
  const sampleSel    = (activeFilters?.biosampleTypeCount || []).map(String);
  const organismSel  = (activeFilters?.organismCount || []).map(String);
  const methodSel    = (activeFilters?.imagingMethodCount || []).map(String);
  const facilitySel  = (activeFilters?.imagingFacilityCount || []).map(String);

  const sampleSet   = new Set(sampleTypeAliases.map(normalizeKey));
  const orgSet      = new Set(organismAliases.map(normalizeKey));
  const methodSet   = new Set(imagingMethodAliases.map(normalizeKey));
  const facilitySet = new Set(imagingFacilityAliases.map(normalizeKey));

  const hasOmeroMatch = (item) => {
    if (!omeroSel.length) return false; // inactive facet -> doesn't count toward ANY
    const keysLower = Object.keys(item).map(k => k.toLowerCase());
    return omeroSel.some(type => {
      const prefix = String(type).toLowerCase() + "_";   // e.g., "well_", "plate_"
      return keysLower.some(k => k.startsWith(prefix));
    });
  };

  const checks = [
    (it) => hasOmeroMatch(it),
    (it) => hasAliasSubstringMatch(it, sampleSet,   sampleSel),
    (it) => hasAliasSubstringMatch(it, orgSet,      organismSel),
    (it) => hasAliasSubstringMatch(it, methodSet,   methodSel),
    (it) => hasAliasSubstringMatch(it, facilitySet, facilitySel),
  ];

  const anyActive =
    omeroSel.length || sampleSel.length || organismSel.length || methodSel.length || facilitySel.length;

  if (!anyActive) return items || [];                 // no active facets -> return all

  return (items || []).filter(it => checks.some(fn => fn(it))); // OR across facets
}