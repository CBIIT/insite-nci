import React, { useState, useContext } from 'react';

export const FormContext = React.createContext({
  context: {},
  setContext: () => {},
});

export const FormContextProvider = ({
  children,
}) => {
  const [context, setContext] = useState({});
  const setContextHandler = (tblContext) => {
    setContext(tblContext);
  };

  return (
    <FormContext.Provider
      value={{
        context,
        setContext: setContextHandler,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

// access form context
export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};
