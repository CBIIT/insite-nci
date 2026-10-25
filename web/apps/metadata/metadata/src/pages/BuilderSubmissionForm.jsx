import React from "react";
import { builder, Builder, BuilderComponent } from '@builder.io/react';
import '../FormBuilder/Registration';
import { useLocation, useParams } from 'react-router-dom';

builder.init('1eed2d0adfaa4a0084581b5b0c9efced');

export default function BuilderPage({ model = 'page' }) {
  const { pathname } = useLocation();
  const params = useParams();
  const [content, setContent] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;

    // Build user attributes that you target in Builder (URL, route params, etc.)
    const userAttributes = { urlPath: pathname, ...params };

    builder
      .get(model, { userAttributes })
      .toPromise()
      .then((res) => {
        if (!cancelled) setContent(res || null);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[Builder] load error:', err);
          setContent(null);
        }
      });

    return () => {
      cancelled = true;
    };
    // stringify params to update on route param changes
  }, [model, pathname, JSON.stringify(params)]);

  if (!content && !Builder.isEditing && !Builder.isPreviewing) {
    return (
      <div style={{ padding: 16 }}>
        App running — no Builder content for <code>{pathname}</code> yet.
      </div>
    );
  }

  return (
    <>
      <h3>Build Form</h3>
      <BuilderComponent model={model} content={content} />
    </>
  );
}

