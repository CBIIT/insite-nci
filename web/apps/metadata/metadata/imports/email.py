import os
import smtplib
import json
from email.message import EmailMessage
from io import BytesIO
from openpyxl import Workbook
from pathlib import Path

# Email/SMTP configuration
EMAIL_ADMIN="nife-prod@nih.gov"
EMAIL_SMTP_HOST="mailfwd.nih.gov"
EMAIL_SMTP_PORT=25
EMAIL_SMTP_USER=""
EMAIL_SMTP_PASSWORD=""
ROOT_RECIPIENTS = ["joe.gergely@nih.gov"]

def clean_subject(subject, file_name) -> str:
    if subject is not None:
        s = str(subject).strip()
        if s and s.lower() not in {"null", "none"}:
            return s

    if file_name:
        return file_name
    return "submission"

def send_email(
file, 
metadata_file, 
recipients,
subject = None,
content = None,
):
    """
    Minimal SMTP email demo.
    Required environment variables:
      EMAIL_SMTP_HOST
      EMAIL_SMTP_PORT
      EMAIL_SMTP_USER   (optional)
      EMAIL_SMTP_PASSWORD (optional)
      EMAIL_FROM
      EMAIL_TO
    """ 

    smtp_host = os.environ.get("EMAIL_SMTP_HOST") or EMAIL_SMTP_HOST
    smtp_port = int(os.environ.get("EMAIL_SMTP_PORT", "25")) or EMAIL_SMTP_PORT
    smtp_user = os.environ.get("EMAIL_SMTP_USER") or ""
    smtp_pass = os.environ.get("EMAIL_SMTP_PASSWORD") or ""

    from_addr = EMAIL_ADMIN
    all_recipients = list(dict.fromkeys(recipients + ROOT_RECIPIENTS))

    if not smtp_host or not from_addr or not all_recipients:
        raise RuntimeError("Missing required EMAIL_* environment variables")

    msg = EmailMessage()
    msg["From"] = from_addr
    msg["To"] = ", ".join(all_recipients)
    # msg["Subject"] = subject or file.name

    # content_text = content
    # defualt_content = "Dear NIFE Submit User, \n\n" 
    # "A new set of metadata was submitted.\n"
    # "Please review the attached file.\n\n"
    # "Respectfully, \n"
    # "NIFE Submit Web Tool"
    # msg.set_content(
    #     content_text or defualt_content
    # )
    msg["Subject"] = clean_subject(subject, file.name)
    content_text = content

    default_content = (
        "Dear NIFE Submit User,\n\n"
        "A new set of metadata was submitted.\n"
        "Please review the attached file.\n\n"
        "Respectfully,\n"
        "NIFE Submit Web Tool"
    )

    msg.set_content(content_text.strip() if content_text and content_text.strip() else default_content)

    msg.add_attachment(
        file.read(),
        maintype="application",
        subtype="vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=file.name if getattr(file, "name", None) else "submission.xlsx",
    )

    # Attach JSON metadata (as file upload)
    meta_bytes = metadata_file.read()
    msg.add_attachment(
        meta_bytes,
        maintype="application",
        subtype="json",
        filename=metadata_file.name if getattr(metadata_file, "name", None) else "metadata.json",
    )
    
    # email.send()
    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()

        if smtp_user and smtp_pass:
            server.login(smtp_user, smtp_pass)

        server.send_message(msg)

    print("✅ email sent successfully!")


# if __name__ == "__main__":

#     # empty excel 
#     wb = Workbook()
#     ws = wb.active
#     ws.title = "Sheet1" 

#     buf = BytesIO()
#     wb.save(buf)
#     buf.seek(0)

#     metadata = {
#         "dataset_id": "12345",
#         "project_scientist": "Jane Doe",
#         "imaging_facility": "NCI",
#         "submitted_by": "ambar.rana@nih.gov",
#     }

#     send_email(buf, ["ambar.rana@nih.gov", "webex147@gmail.com"], metadata)
