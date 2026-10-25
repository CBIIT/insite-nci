import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge, IconButton } from "@mui/material";
import { Tooltip } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { useOutletContext } from "react-router-dom";
import { safeClone } from "../sections/utils2";
import { Modal } from "react-bootstrap";

const STORAGE_KEY = "nife_email_recipients_v2";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export default function EmailRecipientsPanel({
  form,
  updateRecipients,
  onChange,
  defaultRecipients: suppliedDefaultRecipients = [],
  groupId,
  projectIds = [],
  submitReviewOpen = false,
  onConfirmSubmit,
  onCancelSubmit,
  onSubmitReviewExited,
}) {


  // get login user emial
  const { userInfo } = useOutletContext();
  const userEmail = userInfo.email;
  const [groupRecipients, setGroupRecipients] = useState([]);
  const [resolvedGroup, setResolvedGroup] = useState(null);
  const [recipientConfigError, setRecipientConfigError] = useState("");
  const defaultRecipients = useMemo(() => Array.from(new Set([
    ...(userEmail ? [userEmail] : []),
    ...suppliedDefaultRecipients,
    ...groupRecipients,
  ].map(normalizeEmail).filter(isValidEmail))), [userEmail, suppliedDefaultRecipients, groupRecipients]);

  const [showRecipients, setShowRecipients] = useState(false);
  const activeRecipients = (form?.recipients || []).filter((r) => r?.enabled).map((r) => r.email);
  
  // keep latest onChange without making effects re-run when parent recreates it
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [sendEmail, setSendEmail] = useState(true);

  // ✅ load once using lazy initializer
  const [recipients, setRecipients] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((recipient) => isValidEmail(recipient?.email));
        }
      }
    } catch {
      // ignore
    }
    return defaultRecipients.map((e) => ({ email: normalizeEmail(e), enabled: true }));
  });

  const [newRecipient, setNewRecipient] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (Number(form?.imagingFacility?.value) !== 9) {
      setGroupRecipients([]);
      setResolvedGroup(null);
      return;
    }

    let cancelled = false;
    const projectId = projectIds
      .map((value) => String(value || "").trim())
      .find((value) => /^\d+$/.test(value));

    async function loadGroupRecipients() {
      try {
        const configResponse = await fetch(
          "/static/metadata/config/email-recipients.json?v=20260821-3",
          { cache: "no-store" },
        );
        if (!configResponse.ok) throw new Error("Unable to load email recipient configuration.");
        const config = await configResponse.json();

        let recipientGroup = groupId ? { groupId, groupName: null } : null;
        if (projectId) {
          const groupResponse = await fetch("api/project-group", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          if (!groupResponse.ok) throw new Error("Unable to resolve the Project's OMERO group.");
          recipientGroup = await groupResponse.json();
        }

        if (cancelled) return;
        const facilityConfig = config?.facilities?.[String(form.imagingFacility.value)] || {};
        const configuredGroup = facilityConfig.groupRecipients?.[String(recipientGroup?.groupId)];
        const configuredGroupRecipients = Array.isArray(configuredGroup)
          ? configuredGroup
          : configuredGroup?.recipients || [];
        setRecipientConfigError("");
        setResolvedGroup(recipientGroup);
        setGroupRecipients([
          ...(facilityConfig.defaultRecipients || []),
          ...configuredGroupRecipients,
        ]);
      } catch (configError) {
        console.error(configError);
        if (!cancelled) {
          setRecipientConfigError(configError.message);
          setResolvedGroup(null);
          setGroupRecipients([]);
        }
      }
    }

    loadGroupRecipients();

    return () => {
      cancelled = true;
    };
  }, [form?.imagingFacility?.value, groupId, JSON.stringify(projectIds)]);

  // ✅ persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipients));
      updateRecipients({ recipients });
    } catch {
      // ignore storage errors
    }
  }, [recipients]);

  function handleSendEmailToggle(checked) {
    setSendEmail(checked);

    if (!checked) {
      // ❌ user opted out → remove all recipients
      const updateRecipients = safeClone(recipients).map(item => ({
        ...item,
        enabled: false,
      }));
      setRecipients(updateRecipients);
    }
  }

  useEffect(() => {
  if (!Array.isArray(defaultRecipients) || defaultRecipients.length === 0) return;

  setRecipients((prev) => {
    const validPreviousRecipients = prev.filter((recipient) => isValidEmail(recipient?.email));
    const existing = new Set(validPreviousRecipients.map((r) => normalizeEmail(r.email)));

    let changed = validPreviousRecipients.length !== prev.length;
    const merged = [...validPreviousRecipients];

    defaultRecipients.forEach((email) => {
      const norm = normalizeEmail(email);
      if (isValidEmail(email) && !existing.has(norm)) {
        merged.push({ email: norm, enabled: true });
        changed = true;
      }
    });

    // 🔑 Important: return prev if nothing changed (prevents render loop)
    return changed ? merged : prev;
  });
}, [defaultRecipients]);

  const enabledRecipients = useMemo(
    () => recipients.filter((r) => r.enabled).map((r) => r.email),
    [recipients]
  );

  // ✅ notify parent without depending on inline onChange function identity
  useEffect(() => {
    if (typeof onChangeRef.current === "function") {
      onChangeRef.current({ sendEmail, recipients, enabledRecipients });
    }
  }, [sendEmail, recipients, enabledRecipients]);

  function addRecipient() {
    setError("");
    const email = normalizeEmail(newRecipient);
    if (!isValidEmail(email)) return;
    if (!email) return;

    if (!isValidEmail(email)) {
      setError("Invalid email address.");
      return;
    }

    if (recipients.some((r) => r.email === email)) {
      setError("Recipient already exists.");
      return;
    }

    setRecipients((prev) => [...prev, { email, enabled: true }]);
    setNewRecipient("");
  }

  function toggleRecipient(email) {
    setRecipients((prev) =>
      prev.map((r) => (r.email === email ? { ...r, enabled: !r.enabled } : r))
    );
  }

  function removeRecipient(email) {
    setRecipients((prev) => prev.filter((r) => r.email !== email));
  }

  function restoreDefault() {
    setRecipients(defaultRecipients.map((e) => ({ email: normalizeEmail(e), enabled: true })));
  }

  function clearAll() {
    setRecipients([]);
  }
  // to do
  // send email
  // const [sending, setSending] = useState(false);
  const [emailInfo, setInfo] = useState({
    subject: "",
    content: ""
  })

  function setEmailInfo(value) {
    const updateEmailInfo = safeClone(emailInfo);
    setInfo({
      ...updateEmailInfo,
      ...value
    });
  };

  useEffect(() => {
    console.log(emailInfo);
    updateRecipients({ emailInfo });
  }, [emailInfo]);

  const EmailIconComponent = () => (
    <>
      <Tooltip
        title={`On Submit, an email will be sent with the attached Excel and JSON metadata to ${activeRecipients?.length || 0} recipient(s). Click to manage recipients or to opt out`}
        arrow
      >
        <IconButton
          color="primary"
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": {
              bgcolor: "primary.dark",
            },
            boxShadow: "0 0 0 3px rgba(25,118,210,0.35)", // soft highlight ring
          }}
          onClick={() => setShowRecipients(true)}
          aria-label="Email recipients (email will be sent on submission)"
        > 
          <Badge badgeContent={activeRecipients?.length || 0} color="error">
            <EmailIcon />
          </Badge>
        </IconButton>
      </Tooltip>
    </>
  );

  function closeRecipients() {
    if (submitReviewOpen) {
      onCancelSubmit?.();
    } else {
      setShowRecipients(false);
    }
  }

  function confirmSubmit() {
    onConfirmSubmit?.({ sendEmail, recipients, enabledRecipients, emailInfo });
  }

  //user info 
  return (
    <>
      <EmailIconComponent />
      <Modal
        show={showRecipients || submitReviewOpen}
        size="xl"
        onHide={closeRecipients}
        onExited={onSubmitReviewExited}
      >
        <Modal.Header closeButton>
          <h4>Send email notification on submission to recipients</h4>
        </Modal.Header>
        <div className="card shadow-sm">
          <div className="card-body">
            {/* Global toggle */}
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => handleSendEmailToggle(e.target.checked)}
                id="sendEmailToggle"
              />
              <label className="form-check-label" htmlFor="sendEmailToggle">
                Send email notification
              </label>
            </div>
            <fieldset disabled={!sendEmail} className={!sendEmail ? "opacity-50" : ""}>
              {/* Add recipient */}
              <div className="input-group mb-2">
                <input
                  type="email"
                  className={`form-control ${error ? "is-invalid" : ""}`}
                  placeholder="Add recipient email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                />
                <button className="btn btn-primary" type="button" onClick={addRecipient}>
                  Add
                </button>
                {error && <div className="invalid-feedback">{error}</div>}
              </div>
                
              {/* Recipient list */}
              {recipients.length === 0 ? (
                <div className="alert alert-warning">No recipients added.</div>
              ) : (
                <ul className="list-group mb-2">
                  {recipients.map(({ email, enabled }) => (
                    <li
                      key={email}
                      className="list-group-item d-flex align-items-center justify-content-between"
                    >
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleRecipient(email)}
                          id={`chk-${email}`}
                        />
                        <label className="form-check-label ms-2" htmlFor={`chk-${email}`}>
                          {email}
                        </label>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeRecipient(email)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="d-flex gap-2 flex-wrap">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearAll}>
                  Clear list
                </button>
              </div>
            </fieldset>
            {/* Preview */}
            <div className="mt-3 small text-muted">
              {recipientConfigError && (
                <div className="alert alert-warning">
                  Recipient configuration could not be loaded: {recipientConfigError}
                </div>
              )}
              {resolvedGroup && (
                <div>
                  <strong>OMERO group:</strong>{" "}
                  {resolvedGroup.groupName || "Unknown"} ({resolvedGroup.groupId})
                </div>
              )}
              <div>
                <strong>Send email:</strong> {sendEmail ? "Yes" : "No"}
              </div>
              <div>
                <strong>Enabled recipients:</strong>{" "}
                {sendEmail ? enabledRecipients.join(", ") || "(none)" : "(opted out)"}
              </div>
            </div>
          </div>
          <hr />
          <div className="form-check mb-3">
            <h4>
              Change Email subject and content
            </h4>
            <span>Subject</span>
            <input
              type="text"
              value={emailInfo?.subject}
              className={`form-control`}
              placeholder="Enter subject"
              onChange={(e) => setEmailInfo({ subject: e.target.value })}
            />
          </div>
          <div className="form-check mb-3">
            <span>Content</span>
            <input
              type="text"
              className={`form-control`}
              placeholder="Type metadata content"
              onChange={(e) => setEmailInfo({ content: e.target.value })}
            />
          </div>
        </div>
        {submitReviewOpen && (
          <Modal.Footer>
            <button type="button" className="btn btn-outline-secondary" onClick={closeRecipients}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={sendEmail && enabledRecipients.length === 0}
              onClick={confirmSubmit}
            >
              Confirm &amp; Submit
            </button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
}
