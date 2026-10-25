// Flatten any JSON value into a flat { key: value } map.
// - Objects: keys joined by "_" (customizable via `sep`)
// - Arrays: use "<arrayKey>_indexOf_<i>" for each element

import { inputTypes } from "../FormField/FieldTypes";
import { safeClone } from "../utils2";

// - Ensures unique keys if a collision occurs (adds _2, _3, ...)
export function flattenJson(input, {
  sep = "_",
  arrayIndexLabel = "indexOf",
  normalizeKey = (k) => String(k).replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, ""), // optional
} = {}) {
  const out = {};
  const seen = new WeakSet();

  const uniqueKey = (base) => {
    let k = base, n = 2;
    while (Object.prototype.hasOwnProperty.call(out, k)) k = `${base}${sep}${n++}`;
    return `${k}`.toLowerCase();
  };

  const walk = (val, path = []) => {
    if (val !== null && typeof val === "object") {
      if (seen.has(val)) return;  // guard cycles
      seen.add(val);

      if (Array.isArray(val)) {
        val.forEach((v, i) => walk(v, [...path, `${arrayIndexLabel}${sep}${i}`]));
      } else {
        for (const [k, v] of Object.entries(val)) {
          const nk = normalizeKey ? normalizeKey(k) : k;
          walk(v, [...path, nk]);
        }
      }
    } else {
      const key = path.join(sep) || "value";
      out[uniqueKey(key)] = val;
    }
  };

  walk(input);
  return out;
}

// If the uploaded JSON is an array, flatten each item; else flatten the single object.
export function flattenUploadedJson(data, opts) {
  return Array.isArray(data) ? data.map((d) => flattenJson(d, opts))
                             : flattenJson(data, opts);
};


const updateWithBSSJSON = (flat, form, displayFormFields) => {
    // update for study
    console.log(displayFormFields.study);

}

const stripToDate = (v) => {
  if (v == null) return "";
  const s = String(v).trim();
  // If it already starts with YYYY-MM-DD, take the first 10 chars
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  // Try parsing generic date strings
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
};

function mapBSSJsonToFormValues(flat, fields) {
  const values = {};

  for (const [fieldKey, cfg] of Object.entries(fields || {})) {
    const bssKey = `${(cfg?.bssKey || "").trim()}`.toLowerCase();
    if (!bssKey || bssKey.toUpperCase() === "N/A") continue;

    const targetName = cfg.inputFieldName || cfg.fieldName || fieldKey;
    // if key exists in flat map, use it; else leave empty string
    let raw = Object.prototype.hasOwnProperty.call(flat, bssKey) ? flat[bssKey] : "";
    // values[targetName] = Object.prototype.hasOwnProperty.call(flat, bssKey)
    //   ? flat[bssKey]
    //   : "";
    if (cfg?.inputType === inputTypes.DROPDOWN) {
      const v = String(raw || "").trim();
      values[targetName] = v ? { label: v, value: v } : null;
    } else if (cfg?.inputType === inputTypes.DATE) {
      values[targetName] = stripToDate(raw);
    } else {
      values[targetName] = raw;
    }
  }

  return values;
};

export async function importBSSJSON(event, displayFormFields, form) {
  event?.preventDefault?.();

  try {
    let file;

    // 1) Modern File System Access API (Chrome/Edge)
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      file = await handle.getFile();
    } else {
      // 2) Fallback: create a hidden <input type="file"> and click it
      file = await new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener(
          'change',
          () => {
            const f = input.files?.[0] || null;
            input.remove();
            resolve(f);
          },
          { once: true }
        );
        input.click();
      });
    }

    if (!file) return; // user canceled

    const text = await file.text();
    const data = JSON.parse(text);
    const flat = flattenUploadedJson(data); // 
    // TODO: do something with the loaded JSON (e.g., set state, dispatch, etc.)
    // console.log('BSS JSON loaded:', data);
    // console.log(flat);
    const updateForm = safeClone(form);
    // updateWithBSSJSON(flat, updateForm, displayFormFields);
    const bssStudyValue = mapBSSJsonToFormValues(flat, displayFormFields.study);
    const bssSampleValue = mapBSSJsonToFormValues(flat, displayFormFields.biosample);
    // console.log(bssStudyValue);
    // console.log(bssSampleValue);

    const sampleAt0 = updateForm?.samples[0] || {};
    const updateSample = {
        ...sampleAt0,
        ...bssSampleValue
    };
    const samples = [ ...form.samples, updateSample]
    const bssUpdateForm = {
        ...updateForm,
        ...bssStudyValue,
        samples: samples
    };
    const nofiticationMsg = `BSS uploaded to  biosample ${samples.length || 1}`;
    return { bssUpdateForm, nofiticationMsg };
  } catch (err) {
    console.error('Failed to load JSON:', err);
    alert(`Failed to load JSON: ${err?.message || err}`);
  }
}