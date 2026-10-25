
export const lookUpTableKeyValue = {
  imagingFacility: [`=INDIRECT("LookupImagingFacility[Imaging Facilities]")`],
  principalInvestigator: [`=INDIRECT("LookupPrincipalInvestigator[Principal Investigators]")`],
  imagingMethod: [`=INDIRECT("LookupImagingMethod[Imaging Methods]")`],
  organism: [`=INDIRECT("LookupOrganism[Organisms]")`],
  biosampleType: [`=INDIRECT("LookupSampleType[Biosample Types]")`],
  experimentalStatus: [`=INDIRECT("LookupExperimentalStatus[Experimental Statuses]")`],
  preparationMethod: [`=INDIRECT("LookupPreparationMethod[Preparation Methods]")`],
  specimenLocationMethod: [`=INDIRECT("LookupSpecimenLocationMethod[Specimen Location Methods]")`],
  sampleType: [`=INDIRECT("LookupSampleType[biosampleType]")`]
}

export const lookupTables = [
  {
    name: "LookupImagingFacility",
    header: "Imaging Facilities",
    key: "Imaging Facilities",
    width: 60,
    property: "imagingFacility",
    columns: [
      {
        name: "Imaging Facilities",
        field: "label",
      }
    ],
  },
  {
    name: "LookupPrincipalInvestigator",
    header: "Principal Investigators",
    key: "Principal Investigators",
    width: 40,
    property: "principalInvestigators",
    columns: [
      {
        name: "Principal Investigators",
        field: "label",
      }
    ],
  },
  {
    name: "LookupImagingMethod",
    header: "Imaging Methods",
    key: "Imaging Methods",
    width: 40,
    property: "imagingFacilities",
    columns: [
      {
        name: "Imaging Methods",
        field: "label",
      },
      {
        name: "Imaging Facilities",
        field: "label",
      }
    ],
  },
  {
    name: "LookupOrganism",
    header: "Organisms",
    key: "Organisms",
    width: 40,
    property: "organisms",
    columns: [
      {
        name: "Organisms",
        field: "label",
      }
    ],
  },
  {
    name: "LookupSampleType",
    header: "Biosample Types",
    key: "Biosample Types",
    width: 20,
    property: "sampleTypes",
    columns: [
      {
        name: "Biosample Types",
        field: "label",
      }
    ],
  },
  {
    name: "LookupTissueType",
    header: "GEM Tissue Types",
    key: "GEM Tissue Types",
    width: 20,
    property: "tissueTypes",
    columns: [
      {
        name: "GEM Tissue Types",
        field: "label",
      }
    ],
  },
  {
    name: "LookupTissueSite",
    header: "Tissue Sites",
    key: "Tissue Sites",
    width: 80,
    property: "tissueSites",
    columns: [
      {
        name: "Tissue Sites",
        field: "label",
      }
    ],
  },
  {
    name: "LookupTissueSubsite",
    header: "Tissue Sites",
    key: "Tissue Sites",
    width: 80,
    property: "tissueSubsites",
    columns: [
      {
        name: "Tissue Sites",
        field: "siteLabel",
      },
      {
        name: "Tissue Subsites",
        field: "label",
      }
    ],
  },
  {
    name: "LookupTissueHealthStatus",
    header: "Tissue Health Statuses",
    key: "Tissue Health Statuses",
    width: 30,
    property: "tissueHealthStatuses",
    columns: [
      {
        name: "Tissue Health Statuses",
        field: "label",
      }
    ],
  },
  {
    name: "LookupTissueHistology",
    header: "Tissue Histology",
    key: "Tissue Histology",
    width: 50,
    property: "tissueHistologyBehaviors",
    columns: [
      {
        name: "Tissue Sites",
        field: "tissueSiteLabel",
      },
      {
        name: "Tissue Histologies",
        field: "tissueHistologyLabel",
      },
      {
        name: "Tissue Histology Behaviors",
        field: "label",
      }
    ],
  },
  {
    name: "LookupOrganTissueLesion",
    header: "Organ Tissue Lesion",
    key: "Organ Tissue Lesion",
    width: 50,
    property: "nonHumanTissueHistologies",
    columns: [
      {
        name: "Organ Groups",
        field: "tissueSite",
      },
      {
        name: "Organs/Tissues",
        field: "tissueSubsite",
      },
      {
        name: "Lesions",
        field: "label",
      }
    ],
  },
  {
    name: "LookupSpecimenLocationMethod",
    header: "Specimen Location Method",
    key: "Specimen Location Method",
    width: 30,
    property: "specimenLocationMethods",
    columns: [
      {
        name: "Specimen Location Methods",
        field: "label",
      }
    ],
  },
  {
    name: "LookupExperimentalStatus",
    header: "Experimental Status",
    key: "Experimental Status",
    width: 20,
    property: "specimenTypes",
    columns: [
      {
        name: "Experimental Statuses",
        field: "label",
      }
    ],
  },
  {
    name: "LookupPreparationMethod",
    header: "Preparation Method",
    key: "Preparation Method",
    width: 40,
    property: "specimenPreparationMethods",
    columns: [
      {
        name: "Preparation Methods",
      },
      {
        name: "Imaging Facilities",
      }
    ],
  },
  {
    name: "LookupChannelSignalContrastMechanism",
    header: "Channel Signal ContrastMechanism",
    key: "Channel Signal ContrastMechanism",
    width: 40,
    property: "channelSignalContrastMechanisms",
    columns: [
      {
        name: "Signal or Contrast Mechanisms",
      },
      {
        name: "Imaging Facilities",
      }
    ],
  },
  {
    name: "LookupChannelStain",
    header: "Channel Signal",
    key: "Channel Signal",
    width: 40,
    property: "channelStains",
    columns: [
      {
        name: "Channel Stains",
      },
      {
        name: "Imaging Facilities",
      }
    ],
  },
];
