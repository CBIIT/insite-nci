# 📚 OMERO Metadata App

The OMERO Metadata App (also referred to as the *submission form*) is designed to help you append metadata to your projects in a structured and user-friendly way.

---

## 🧠 What is Metadata?

Metadata is information **about** your scientific images — such as the study they belong to, the biosample used, or the imaging channel captured.

**Example metadata:**
- **Study Name**: "Lung Cancer Biomarkers"
- **Biosample**: "Patient A – Lung Tissue"
- **Channel**: DAPI, FITC, etc.

---

## 🗂️ Where Does Metadata Go?

In OMERO, metadata is linked to specific **levels** of the image hierarchy:

- **Project**
- **Dataset**
- **Image**

Your metadata may apply to one or more of these levels, depending on the **template configuration**.  
Click the **View Template** button to refer to the template.

---

## 📝 How the App Helps

### ✅ 1. Fill Out a Form

Use the form (in the app or an Excel sheet) to enter details such as:
- **Study**
- **Biosample**
  - **Specimen**
    - **Channel(s)**
- **Image Information & Layer Information** 

### ✅ 2. Filling Out the Form

1. Select your **Image Facility** in **Study Information** section before starting to fill the form.

![Select Facility](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_1/imageFacility.png)

2. Fill out rest of the field in the **Study Information** section.
    
3. Click the **Add Biosample** button to add a **Biosample**. Complete the section, add **Specimen** to biosample (optional), and associate the **Biosample** with one **Dataset** (with omero dataset id).

![Biosample](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_1/Biosample.png)


### 3. 📦 Saving Form and Uploading Excel - History Page

**1.** To Save a Form, use **Save** button and the save or submitted form will be present in history page.
**2.** In history page, Click **Upload** button of the row to upload the form data 
**3.** use **Download** dropdown and select **Excel** or **All** at the bottom of the form to download the form as excel file

![Download](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_1/Download.png)

### 4 📊 Excel Template Structure and Updating Value

The downloaded Excel file is organized into multiple sheets (tabs), each serving a specific purpose. Here's a quick guide to help you understand the layout:

###### 1. **Lookup Tables (First Sheet)**  
  - The first sheet contains reference data (lookup tables) that areused throughout the rest of the file.  
  - Please **do not modify** this sheet.
  

###### 2. **Study Information (Second Sheet)**  
  - This sheet captures details related to your study, such as projectname, description, and related metadata.  
  - Update any values on **B1 column**
  - Please **do not modify A1** column of this sheet.

###### 3. **Biosample Sheets**  
  - One or more sheets will follow, each corresponding to a **Biosample**.  
  - Include sample-specific details and make sure to associate each with the appropriate study.
  - Update any values on **B1 column**
  - Please **do not modify A1** column of this sheet.

###### 4. **Image Information Sheets**  
  - Image information sheet, representing one sheet per**Image**. 

###### 5. **Layer Information Sheets**  
  - Layer Information Sheet, representing one sheet per**Layer**.

### 🔄 3. Map Metadata to OMERO

Each form section (Study, Biosample, Multiplate) maps to the appropriate OMERO level(s):

Click the **View Template** button to view the mapping.

The template maps form values to the correct OMERO level.

---


### 🆔 OMERO Object IDs

- The form includes input fields for the **OMERO Project ID** and the **Plate ID (OMERO Plate ID)**, which are required to correctly target metadata attachment.
- These IDs identify the **Project**, **Dataset** and **Images** where metadata will be applied.
- **Image ID suggestions - Requires selecting a Dataset or Project from suggestion list**.

🔍 **Suggestions List**  
- When entering the Project or Dataset ID, the form provides a dropdown list of valid **OMERO Project and Dataset** available under your currently selected **OMERO Group**.  
  This helps avoid manual lookup and ensures you select from existing, accessible objects.

![Suggestion](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_1/ProjectSuggestion.png)

![Suggestion](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_1/suggestionListDataset.png)
---

## 🧪 Tagging and Namespaces

- Tags help with **search and filtering**.
- Metadata is organized under **unique namespaces** based on the form section.

---




## 🔒 Error Prevention

The app checks:
- Are required fields filled in?
- Are OMERO IDs valid?

Helpful error messages are shown if anything is missing.

---

## 🧑‍🔬 Why It Matters

Clean, complete metadata:
- Makes your dataset searchable  
- Enables reproducibility  
- Helps collaborators understand your data  

Let’s make metadata easier for everyone!
