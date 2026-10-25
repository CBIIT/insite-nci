import os
import re
import base64
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from jinja2 import Environment, FileSystemLoader, select_autoescape


# ---------- Template Rendering ----------

def render_template(template_path: str, data: Dict[str, Any]) -> str:
    """
    Render an HTML template using Jinja2.
    template_path: e.g. "templates/submit.html"
    """
    template_path = template_path.replace("\\", "/")
    template_dir, template_file = os.path.split(template_path)

    env = Environment(
        loader=FileSystemLoader(template_dir or "."),
        autoescape=select_autoescape(["html", "xml"])
    )
    template = env.get_template(template_file)
    return template.render(**data)

# ---------- SMTP Config ----------

@dataclass
class SmtpConfig:
    host: str
    port: int
    user: Optional[str] = None
    password: Optional[str] = None
    use_tls: bool = True  # STARTTLS


def get_smtp_config(env: Dict[str, str] = None) -> SmtpConfig:
    env = env or os.environ

    host = env.get("EMAIL_SMTP_HOST", "")
    port = int(env.get("EMAIL_SMTP_PORT", "25"))

    user = ""
    password = ""

    # Allow forcing TLS off if needed:
    use_tls = env.get("EMAIL_SMTP_USE_TLS", "true").strip().lower() in ("1", "true", "yes", "y")

    if not host:
        raise RuntimeError("Missing EMAIL_SMTP_HOST")

    return SmtpConfig(host=host, port=port, user=user, password=password, use_tls=use_tls)


# ---------- Attachment Helpers ----------

DATA_URL_RE = re.compile(r"^data:(?P<mime>[^;]+);base64,(?P<b64>.+)$", re.DOTALL)

def decode_data_url_base64(data_url: str) -> (bytes, str):
    """
    Takes a 'data:...;base64,...' string (like in your React code)
    and returns (bytes, mime_type).
    """
    m = DATA_URL_RE.match(data_url.strip())
    if not m:
        # Might be raw base64 already (like you do in Node by stripping prefix)
        # Assume XLSX if unknown.
        raw = data_url.strip()
        return base64.b64decode(raw), "application/octet-stream"
    mime = m.group("mime")
    b64 = m.group("b64")
    return base64.b64decode(b64), mime


def add_attachment(msg: EmailMessage, filename: str, content: Union[str, bytes], *,
                   encoding: Optional[str] = None,
                   mime_type: Optional[str] = None) -> None:
    """
    Supports:
      - content as raw bytes
      - content as str
      - content as base64 (encoding="base64")
    """
    if isinstance(content, str):
        if encoding == "base64":
            payload = base64.b64decode(content)
        else:
            payload = content.encode("utf-8")
    else:
        payload = content

    maintype, subtype = ("application", "octet-stream")
    if mime_type and "/" in mime_type:
        maintype, subtype = mime_type.split("/", 1)

    msg.add_attachment(payload, maintype=maintype, subtype=subtype, filename=filename)


# ---------- Send Email ----------

# def send_email(
#     to: Union[str, List[str]],
#     subject: str,
#     template_path: str,
#     data: Dict[str, Any],
#     attachments: List[Dict[str, Any]] = None,
#     env: Dict[str, str] = None
# ) -> Dict[str, Any]:
#     """
#     Rough equivalent of nodemailer sendMail().
#     attachments items can look like:
#       { "filename": "...", "content": "...", "encoding": "base64", "mime_type": "..." }
#     """
#     env = env or os.environ
#     attachments = attachments or []
#     config = get_smtp_config(env)

#     from_addr = env.get("EMAIL_ADMIN")
#     if not from_addr:
#         raise RuntimeError("Missing EMAIL_ADMIN (from address)")

#     # Normalize recipients
#     recipients = [to] if isinstance(to, str) else list(to)
#     recipients = [r for r in recipients if r]

#     html = render_template(template_path, data)

#     msg = EmailMessage()
#     msg["From"] = from_addr
#     msg["To"] = ", ".join(recipients)
#     msg["Subject"] = subject
#     msg.set_content("This email requires an HTML-capable client.")
#     msg.add_alternative(html, subtype="html")

#     for a in attachments:
#         filename = a["filename"]
#         content = a["content"]
#         encoding = a.get("encoding")
#         mime_type = a.get("mime_type")

#         # If the content is a data URL, decode it and set mime automatically
#         if isinstance(content, str) and content.strip().startswith("data:"):
#             blob, detected_mime = decode_data_url_base64(content)
#             add_attachment(msg, filename, blob, mime_type=detected_mime)
#         else:
#             add_attachment(msg, filename, content, encoding=encoding, mime_type=mime_type)

#     with smtplib.SMTP(config.host, config.port, timeout=30) as smtp:
#         if config.use_tls:
#             smtp.starttls()
#         if config.user and config.password:
#             smtp.login(config.user, config.password)
#         smtp.send_message(msg)

#     return {"ok": True, "to": recipients, "subject": subject}


def send_email(
    to: Union[str, List[str]],
    subject: str,
):
    print('send email excel file')