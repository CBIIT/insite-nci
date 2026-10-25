import { z } from "zod";

// typed component props and validate form field
export const fieldSchema = z.object({
  inputType: z.string(),
  fieldName: z.string(),
  fieldId: z.string(),
  placeholder: z.string().optional(),
  fieldValue: z.any().optional(),
  handleChange: z.custom((val) => typeof val === "function", {
    message: "provide input change functions",
  }),
});
