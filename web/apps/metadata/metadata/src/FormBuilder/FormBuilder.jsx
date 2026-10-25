import * as React from 'react';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Container } from '@mui/material';

const theme = createTheme({
  // your theme overrides here
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          '& div': {
            "& .builder-block": {
              display: 'contents !important',
            },
          },
          "& div.builder-block": {
            display: 'contents !important',
          },
        },
      },
    },
  },
});


// Helper: turn FormData into plain object, supporting multi-value fields
function formDataToObject(fd) {
  const out = {};
  fd.forEach((value, key) => {
    const v = String(value);
    if (key in out) {
      const curr = out[key];
      out[key] = Array.isArray(curr) ? [...curr, v] : [curr, v];
    } else {
      out[key] = v;
    }
  });
  return out;
}

export const FormContext = React.createContext(null);

export const useFormCtx = () => {
  const ctx = React.useContext(FormContext);
  if (!ctx) throw new Error('Must be used within <BuilderForm>');
  return ctx;
};

const BuilderForm = ({
  actionUrl,
  method = 'POST',
  preventDefault = false,
  successMessage,
  className,
  style,
  gap = 12,
  columns = 1,
  showSubmitButton = true,
  submitLabel = 'Submit',
  children,
}) => {
  const [form, setForm] = React.useState({});

  const handleSubmit = React.useCallback(
    async (e) => {
      e.preventDefault(); 
      const fd = new FormData(e.currentTarget);
      // setForm(values);
      const values = formDataToObject(fd);
      // Always print values
      console.log('[BuilderForm] submitted values: ', values);
      // if (preventDefault) {
      //   e.preventDefault();
      //   if (successMessage) {
      //     alert(`${successMessage}\n\n${JSON.stringify(values, null, 2)}`);
      //   }
      // }
      // If preventDefault is false, the browser will proceed with normal form submit.
      const jsonMetadata = {};
      jsonMetadata['project_tags'] = values;
      console.log(jsonMetadata);
      
      const reqBody = JSON.stringify(jsonMetadata);
      const endpoint = `api/submit`;
      // send and await each request before moving on
      // const response = await fetch(endpoint, reqBody, {
      //   headers: { "Content-Type": "application/json" },
      // });
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: reqBody,
      });

      if (response.ok) {
        success = true;
        alert("append metadata successful !")
      }
      else {
        success = false;
        alert("sbumission error !")
      }
    },
    []
  );

  const setField = React.useCallback(
    (k, v) => setForm((f) => ({ ...f, [k]: v })),
    []
  );

  const handleChange = React.useCallback((e) => {
    setForm(formDataToObject(new FormData(e.currentTarget)));
  }, []);

  return (
    <>
      <FormContext.Provider value={{ form, setField }}>
        <ThemeProvider theme={theme}>
          <Container maxWidth="lg" sx={{ py: 2 }}>
            <div className="row">
                <div className="col">
                  <form
                    action={preventDefault ? undefined : actionUrl}
                    method={preventDefault ? undefined : method}
                    onSubmit={handleSubmit}
                    onChange={handleChange}
                    className={className}
                    style={{
                      display: 'grid',
                      gap,
                      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                      ...style,
                    }}
                  >
                    {children}
                    {showSubmitButton && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <button type="submit">{submitLabel}</button>
                      </div>
                    )}
                  </form>
              </div>
            </div>
          </Container>
        </ThemeProvider>
      </FormContext.Provider>
      <hr />
      <summary>Form state</summary>
      <pre
        style={{
          background: "#f6f8fa",
          padding: "12px",
          borderRadius: "6px",
          fontSize: "13px",
          lineHeight: "1.4",
          overflowX: "auto",
        }}
      >
        {JSON.stringify(form, null, 2)}
      </pre>
    </>
  );
};

export default BuilderForm;
