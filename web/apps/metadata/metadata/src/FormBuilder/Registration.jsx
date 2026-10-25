import { Builder, withChildren } from "@builder.io/react";
import BuilderForm from "./FormBuilder";
import TextField from "./TextField";
import AccordianView from "./AccordionView";

// Register the Form (allows dragging children into it)
Builder.registerComponent(withChildren(BuilderForm), {
  name: 'Omero Form Base',
  canHaveChildren: true,           // <- allows dropping child blocks
  noWrap: true,                    // optional; avoids extra wrapper
  inputs: [
    { name: 'actionUrl', type: 'string', helperText: 'Leave blank to handle submit in-app' },
    { name: 'method', type: 'string', enum: ['GET', 'POST'], defaultValue: 'POST' },
    { name: 'preventDefault', type: 'boolean', defaultValue: true },
    { name: 'successMessage', type: 'string' },
    { name: 'gap', type: 'number', defaultValue: 12 },
    { name: 'columns', type: 'number', defaultValue: 1 },
    { name: 'showSubmitButton', type: 'boolean', defaultValue: true },
    { name: 'submitLabel', type: 'string', defaultValue: 'Submit' },
    { name: 'className', type: 'string' },
    { name: 'style', type: 'map' },
  ],
});

Builder.registerComponent(withChildren(AccordianView), {
  name: 'Omero Form Accordian',
  canHaveChildren: true,           // <- allows dropping child blocks
  inputs: [
    {
      name: 'title', 
      type: 'string',
      required: true
    }
  ]
});

// Register child input components so they appear in the editor palette
Builder.registerComponent(TextField, {
  name: 'Submission TextField',
  inputs: [
    { 
      name: 'name',
      type: 'string',
      required: true
    },
    { 
      name: 'label', 
      type: 'string'
    },
    { 
      name: 'placeholder',
      type: 'string'
    },
    { 
      name: 'type', 
      type: 'string', 
      enum: ['text', 'email', 'number', 'password'], 
      defaultValue: 'text' 
    },
    { 
      name: 'required', 
      type: 'boolean' 
    },
  ],
});
