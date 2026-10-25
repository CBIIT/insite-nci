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

- **Screen**
- **Plate**
- **Well**

Your metadata may apply to one or more of these levels, depending on the **template configuration**.  
Click the **View Template** button to refer to the template.

---

## 📝 How the App Helps

### ✅ 1. Fill Out a Form

Use the form (in the app or an Excel sheet) to enter details such as:
- **Study**
- **Multiplate**
  - **Channel(s)**
- **Biosample** & **Specimen** (associated with Multiplate)

### ✅ 2. Filling Out the Form

1. Select your **Image Facility** in **Study Information** section before starting to fill the form.

![Select Facility](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_2/imageFacility.png)

2. Fill out rest of the field in the **Study Information** section.


3. Click the **Add Multiple** button to add a new **Multiplate** section.
    - Add **Channel(s)** to provide **Signal**, **Stain**, and **Molecular Entity** information.
    - Associate **biosample** from biosample dropdown.

![Multiplate](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_2/Multiplate.png)
    
4. Click the **Add Biosample** button to add a **Biosample**. Complete the section, add **Specimen** to biosample (optional), and associate the **Biosample** with one or more **Multiplates**.

![Biosample](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_2/Biosample.png)


### 3. 📦 Saving Form and Uploading Excel

**1.** To Save a Form, use **Download** dropdown and select **Excel** or **All** at the bottom of the form


![Download](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_2/Download.png)

**2.** To Save section of the form, click **Download Multiwell Data Template** 

**3.** To upload excel file (**from step 1**) use **Import Excel File** button on top left cornor of the from

**4.** To upload excel file (**from step 2**) use **Upload Multiwell Data** button

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

###### 4. **Multiplate Sheets**  
  - These are the final sheets in the file, representing one sheet per **plate**.  
  - Enter or update well-specific information, ensuring each rowcorrectly matches a **Well location**.


![Multiplate](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_2/excel.png)


### 📝 5. Updating Form using Excel
The submission form applies the same values to **all wells** and does **not** support editing individual **Well** locations. To update values for specific wells, use the Excel file:

#### Steps:
1. 📥 **Download** the Excel file from the form.
2. 📝 **Edit only the necessary fields** in the file — especially in the **Multiplate** sheet.
3. ✅ Ensure values are correctly matched to the intended **Well locations** (based on row and column).
4. 💾 **Save** the updated Excel file.
5. 📤 **Upload** it through the application.

> ⚠️ **Important:**
> - Do **not** change sheet names, headers, or file structure.  
> - Only existing **Well** locations in OMERO will receive metadata.

Use this approach whenever precise **Well-level metadata updates** are required.

⚠️ **IMPORTANT:** Metadata will **only** be appended to a **Well** if a corresponding **Well object** exists in OMERO **for that particular location**.

---

### 🔄 3. Map Metadata to OMERO

Each form section (Study, Biosample, Multiplate) maps to the appropriate OMERO level(s):

Click the **View Template** button to view the mapping.

- **Study** → Screen / Plate  
- **Multiplate** → Plate / Well  
- **Biosample** → Plate / Well  

The template maps form values to the correct OMERO level.

---

### 🆔 OMERO Object IDs

- The form includes input fields for the **OMERO Project or Screen ID** and the **Plate ID (OMERO Plate ID)**, which are required to correctly target metadata attachment.
- These IDs identify the **Screen** and **Plate** where metadata will be applied.
- You do **not** need to provide Well IDs manually — **Well objects are automatically detected as children of the Plate object**.

🔍 **Suggestions List**  
- When entering the Screen or Plate ID, the form provides a dropdown list of valid **OMERO Screens and Plates** available under your currently selected **OMERO Group**.  
  This helps avoid manual lookup and ensures you select from existing, accessible objects.
- Selecting from the suggested list will also prepopulate the correct **Screen name** or **Plate name**.

![Suggestion](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_2/screenIdSuggestion.png)
---

## Batch Import Multiplate variables
App also supports batch import of the variables
Inorder to use this feature, the import file should be either txt =.


![RawData](https://raw.githubusercontent.com/rana22/icon-assets/refs/heads/main/facilityId_2/batchImport.png)

⚠️ **IMPORTANT:**
1. **First column** should be the plate name 
2. **Second column** should be well location 
3. Other column should match the Camel Case of the Variable name 
example of valid column name for each of the variables
  - Intrinsic Variables -> IntrinsicVariable 
  - Other Preparation Details -> OtherPreparationDetails
  - Extrinsic Variables - ExperimentalTreatment

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
