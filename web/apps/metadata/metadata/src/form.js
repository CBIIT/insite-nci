export const defaultChannel = {
  signalOrContrastMechanism: "",
  stain: "",
  molecularEntity: "",
};

export const defaultSpecimen = {
  specimenLocationMethod: null, // individualSpecimenId, blockIdAndSlideId, multiWellPlateIdAndWellCoordinates
  multiwellPlateType: "", // specimenLocation is multiWellPlateIdAndWellCoordinates, 96 well plate or 384 well plate
  multiwellPlateCount: "", // number of plates
  multiwellPlateChannelCount: "", // number of channels per multiwell plate
  multiwellPlateData: null, // specimenLocation is multiWellPlateIdAndWellCoordinates
  multiwellPlateBarCode: "",
  specimenId: "",
  caseId: "",
  plateId: "", // specimenLocation is multiWellPlateIdAndWellCoordinates
  wellCoordinates: "", // specimenLocation is multiWellPlateIdAndWellCoordinates
  blockId: "", // specimenLocation is blockIdAndSlideId
  slideId: "", // specimenLocation is blockIdAndSlideId
  specimenType: "", // test, control
  preparationMethod: "",
  preparationDetails: "",
  details: "",
  intrinsicVariables: "",
  extrinsicVariables: "",
  intrinsicVariableArray: [],
  additionalNotes: "",
  channels: [],
};

export const defaultSample = {
  sampleId: "",
  sampleDescription: "",
  organism: "",
  organismOther: "",
  gemStrain: "", // organism is GEM
  speciesOrStrain: "", // organism is Bacteria or Yeast
  sampleType: "", // cellLine, tissue
  cellLine: "",
  tissueType: "", // organoid, pdx
  tissueSite: "",
  tissueSubsite: "",
  tissueHealthStatus: "", // normal, neoplasm, otherDiseaseOrCondition, unknownHealthStatus
  tissueHistology: "", // tissueHealthStatus is neoplasm
  tissueHistologyBehavior: "", // tissueHealthStatus is neoplasm and histology is not null
  otherDiseaseOrCondition: "", // tissueHealthStatus is otherDiseaseOrCondition
  embryoStage: "",
  intrinsicVariables: "",
  extrinsicVariables: "",
  experimentalVariables: "",
  specimens: [],
  additionalNotes: "",
};

export const defaultMultiwellPlate = {
  id: "",
  caseId: "",
  barcode: "",
  multiwellPlateType: "",
  biosample: "",
  channels: [],  
  specimenType: "", // test, control
  experimentalTreatment: "",
  preparationMethod: "",
  preparationDetails: "",
  details: "",
  intrinsicVariables: "",
  extrinsicVariables: "",
  additionalNotes: "",
  plateData: [],
};

export const defaultForm = {
  imagingFacility: null,
  dataProvenance: null,
  principalInvestigator: null,
  projectScientist: "",
  datasetId: "",
  imagingMethod: null,
  imagingMethodOther: "",
  studyDescription: "",
  supportingLinks: "",
  email: "",
  samples: [],
  multiwellPlates: [],
  filePaths: [],
};

export const displayType = {
  Required: "Required",
  Add: "Add",
  Drop: "Drop",
  Metadata: "Metadata"
};

export const formSections = {
  studyComponent: "study component",
  study: 'study',
  plate: "plate",
  multiwell: "multiwell",
  Biosample: "biosample",
  Specimen: "specimen",
  Channel: "channel",
  imageAcquisition: "Image acquisition",
  rawData: "Image Raw data",
  image: "image",
  layer: 'layer',
  imageProcessing: "Image Processing",
  imageROIMetadata: "Image or ROI metadata",
  layersROIsDetails: "Layers/ROIs details",
  layersROIsProcessing: "Layers/ROIs Image Processing",
  layersROIsMeta: "Layers/ROIs metadata",
}

// map field name to property to hide/display form fields
export const fieldNameToPropertyMap = {
  study: {
    imagingFacility: "imagingFacility",
    principalInvestigator: "principalInvestigator",
    projectScientist: "projectScientist",
    studyDatasetName: "datasetId",
    imagingMethod: "imagingMethod", 
    imagingMethodOther: "imagingMethodOther",
    studyDescription: "studyDescription",
    supportingLinks: "supportingLinks",
    // facility id 9
    projectName: "projectName",
    studyDatasetId: "datasetId",
    piLabOrBranchInstitute: "piLabOrBranchInstitute",
    piEmail: "piEmail",
    cmmProjectAppliaction: "cmmProjectAppliaction",
    dateBiosampleReceived: "dateBiosampleReceived",
    biosampleDescription: "biosampleDescription",
    biosampleLocation: "biosampleLocation",
    samplePrepDoneAtCMM: "samplePrepDoneAtCMM",
    samplePrepStartDate: "samplePrepStartDate",
    sampleLocation: "sampleLocation",
    studyType: "studyType",
    specimenPrepDate: "specimenPrepDate",
    specimenLocation: "specimenLocation",
  },
  studyComponent: {
    imagingFacility: "imagingFacility",
    principalInvestigator: "principalInvestigator",
    projectScientist: "projectScientist",
    studyDatasetName: "datasetId",
    imagingMethod: "imagingMethod", 
    imagingMethodOther: "imagingMethodOther",
    studyDescription: "studyDescription",
    supportingLinks: "supportingLinks",
    // facility id 9
    projectName: "projectName",
    studyDatasetId: "datasetId",
    piLabOrBranchInstitute: "piLabOrBranchInstitute",
    piEmail: "piEmail",
    biosampleDescription: "biosampleDescription",
    studyType: "studyType",
  },
  biosample: {
    biosampleName: "biosampleName",
    biosampleDescription: "biosampleDescription",
    organism: "organism",
    biosampleType: "sampleType",
    speciesStrain: "speciesStrain",
    cellLine: "cellLine",
    embryoStage: "embryoStage",
    tissueSite: "tissueSite",
    tissueSubSite: "tissueSubSite",
    additionalAttributes: "additionalAttr",
    organismNCBITaxonomy: "organismNCBITaxonomy",
    coarseInformalTaxonomy: "coarseInformalTaxonomy",
    gemTissueType: "tissueType",
    anatomicalOriginNCIThesaurus: "anatomicalOrigin",
    cellType: "cellType",
    intrinsicVariables: "intrinsicVariables",
    extrinsicVariables: "extrinsicVariables",
    extrinsicVariableExperimentalTreatment: "extrVarExpTreatment",
    experimentalVariables: "experimentalVariables",
    imageID: "imageID"
  },
  specimen: {
    specimenLocationMethod: "specimenLocationMethod",
    specimenID: "specimenID",
    fileName: "fileName",
    preparationMethod: "preparationMethod",
    experimentalStatus: "experimentalStatus",
    caseID: "caseID",
    experimentalTreatment: "experimentalTreatment",
    intrinsicVariables: "intrinsicVariables",
    extrinsicVariables: "extrinsicVariables",
    otherKeyDetails: "otherKeyDetails",
    otherPreparationDetails: "otherPrepDetails",
    samplePrepProtocol: "samplePrepProtocol",
    specimenPrepDetails: "specimenPrepDetails",
  },
  channel: {
    signalOrContrastMechanism: "signalOrContrastMechanism",
    stain: "stain",
    molecularEntity: "molecularEntity",
    proteinOfInterest: "proteinOfInterest"
  },
  // image: {
  //   instrumentAttributes: "instrumentAttributes",
  //   imageAcquisitionParameters: "imageAcquisitionParameters",
  //   rawDataLocation: "rawDataLocation",
  //   imageTrimDetails: "imageTrimDetails",
  //   alignmentDetails: "alignmentDetails",
  //   cmmImageProcessing: "cmmImageProcessing",
  //   cmmBinFactorXY: "cmmBinFactorXY",
  //   cmmBinFactorZ: "cmmBinFactorZ",
  //   temLikeContrast: "temLikeContrast",
  //   cmmFileFormat: "cmmFileFormat",
  //   qcInfo: "qcInfo",
  //   chunkCount: "chunkCount",
  //   sourceImageType: "sourceImageType",
  //   sourceImageFileFormat: "sourceImageFileFormat",
  //   sourceImageInformation: "sourceImageInformation",
  //   numPixelsX: "numPixelsX",
  //   numPixelsY: "numPixelsY",
  //   numPixelsZ: "numPixelsZ",
  //   pixelSizeX: "pixelSizeX",
  //   pixelSizeY: "pixelSizeY",
  //   pixelSizeZ: "pixelSizeZ",
  //   units: "units"
  // },
  // layer: {
  //   cmmImageProcessing: "cmmImageProcessing",
  //   cmmImageProcessingDetails: "cmmImageProcessingDetails",
  //   cropMask: "cropMask",
  //   cropMaskDetail: "cropMaskDetail",
  //   furtherBinningFactorXYZ: "furtherBinningFactorXYZ",
  //   correlatedImage: "correlatedImage",
  //   relocationRegistration: "relocationRegistration",
  //   transformFiducialListEtc: "transformFiducialListEtc",
  //   labelMap: "labelMap",
  //   labeledFeatures: "labeledFeatures",
  //   labelMapDetails: "labelMapDetails",
  //   mlDLModelUsed: "mlDLModelUsed",
  //   derivedFeature: "derivedFeature",
  //   derivedFeatureType: "derivedFeatureType",
  //   sourceFeatures: "sourceFeatures",
  //   meshOrSkeletonDetails: "meshOrSkeletonDetails",
  //   syntheticData: "syntheticData",
  //   syntheticDataDetails: "syntheticDataDetails",
  //   sourceImageType: "sourceImageType",
  //   sourceImageFileFormat: "sourceImageFileFormat",
  //   sourceImageInformation: "sourceImageInformation",
  //   numPixelsX: "numPixelsX",
  //   numPixelsY: "numPixelsY",
  //   numPixelsZ: "numPixelsZ",
  //   pixelSizeX: "pixelSizeX",
  //   pixelSizeY: "pixelSizeY",
  //   pixelSizeZ: "pixelSizeZ",
  //   units: "units"
  // },
  // imageAcquisition: {
  //   instrumentAttributes: "instrumentAttributes",
  //   imageAcquisitionParameters: "imageAcquisitionParameters",
  // },
  // imageRawData : {
  //   rawDataLocation: "rawDataLocation",
  //   imageTrimDetails: "imageTrimDetails",
  //   alignmentDetails: "alignmentDetails"
  // },
  // imageProcessing: {
  //   cmmImageProcessing: "cmmImageProcessing",
  //   cmmBinFactorXY: "cmmBinFactorXY",
  //   cmmBinFactorZ: "cmmBinFactorZ",
  //   temLikeContrast: "temLikeContrast",
  //   cmmFileFormat: "cmmFileFormat",
  //   qcInfo: "qcInfo",
  //   chunkCount: "chunkCount"
  // },
  // imageOrRoiMetadata: {
  //   sourceImageType: "sourceImageType",
  // },
  // layersRoisImageProcessing: {
  //   cmmImageProcessing: "cmmImageProcessing",
  //   cmmImageProcessingDetails: "cmmImageProcessingDetails",
  // },
  // layersRoisDetails: {
  //   cropMask: "cropMask",
  //   cropMaskDetail: "cropMaskDetail",
  //   furtherBinningFactorXYZ: "furtherBinningFactorXYZ",
  //   correlatedImage: "correlatedImage",
  //   relocationRegistration: "relocationRegistration",
  //   transformFiducialListEtc: "transformFiducialListEtc",
  //   labelMap: "labelMap",
  //   labeledFeatures: "labeledFeatures",
  //   labelMapDetails: "labelMapDetails",
  //   mlDLModelUsed: "mlDLModelUsed",
  //   derivedFeature: "derivedFeature",
  //   derivedFeatureType: "derivedFeatureType",
  //   sourceFeatures: "sourceFeatures",
  //   meshOrSkeletonDetails: "meshOrSkeletonDetails",
  //   syntheticData: "syntheticData",
  //   syntheticDataDetails: "syntheticDataDetails"
  // },
  // layersRoisMetadata: {
  //   sourceImageType: "sourceImageType",
  //   sourceImageFileFormat: "sourceImageFileFormat",
  //   sourceImageInformation: "sourceImageInformation",
  //   numPixelsX: "numPixelsX",
  //   numPixelsY: "numPixelsY",
  //   numPixelsZ: "numPixelsZ",
  //   pixelSizeX: "pixelSizeX",
  //   pixelSizeY: "pixelSizeY",
  //   pixelSizeZ: "pixelSizeZ",
  //   units: "units"
  // },
  multiwell: {
    extrinsicVariables: "extrinsicVariables",
    intrinsicVariables: "intrinsicVariables",
    experimentalStatus: "experimentalStatus",
    preparationMethod: "preparationMethod",
    otherPreparationDetails: "otherPreparationDetails",
    caseId: "caseId",
    plateType: "dimension",
    biosample: "biosample",
  }
}

// map to options properties
export const optionsToPropertyMap = {
  biosample: {
    embryoStage: {field: "sampleType", value: "Embryo"}
  }
};

// {
//   "datasetUID": "Dataset UID",
//   "dataProvenance": "Data Provenance",
//   "projectName": "Project Name",
//   "projectPI": "Project PI",
//   "imagingMethod": "Imaging Method",
//   "piLabOrBranchInstitute": "PI lab or branch, institute",
//   "piEmail": "PI email",
//   "projectPOC": "Project POC",
//   "pocEmail": "POC Email",
//   "cmmProjectAppliaction": "CMM project appliaction",
//   "studyDescription": "Study Description",
//   "dateBiosampleReceived": "Date Biosample Received",
//   "biosampleDescription": "Biosample description",
//   "biosampleLocation": "Biosample location",
//   "samplePrepDoneAtCMM": "Sample Prep done at CMM?",
//   "samplePrepStartDate": "Sample prep start date",
//   "specimenLocation": "Specimen location",
//   "studyType": "Study Type",
//   "specimenPrepDate": "Specimen prep date",
//   "biosampleName": "Biosample Name",
//   "biologicalEntity": "Biological Entity",
//   "organismNCBITaxonomy": "Organism (NCBI taxonomy)",
//   "biosampleType": "Biosample Type",
//   "coarseInformalTaxonomy": "Coarse/Informal Taxonomy",
//   "anatomicalOriginNCIThesaurus": "Anatomical Origin (NCI thesaurus)",
//   "coarseAnatomicalOrigin": "Coarse anatomical origin",
//   "intrinsicVariables": "Intrinsic Variables",
//   "extrinsicVariableExperimentalTreatment": "Extrinsic Variable - Experimental Treatment",
//   "experimentalVariables": "Experimental Variables",
//   "experimentalStatus": "Experimental Status",
//   "samplePrepProtocol": "Sample Prep protocol",
//   "specimenPrepDetails": "Specimen prep details",
//   "cmmSpecimenUID": "CMM specimen UID",
//   "signalOrContrastMechanism": "Signal or Contrast Mechanism",
//   "stain": "Stain",
//   "molecularEntity": "Molecular Entity",
//   "instrumentAttributes": "Instrument attributes",
//   "imageAcquisitionParameters": "Image acquisition parameters",
//   "rawDataLocation": "Raw data location",
//   "imageTrimDetails": "Image trim details",
//   "alignmentDetails": "Alignment details",
//   "cmmImageProcessing": "CMM image processing",
//   "cmmBinFactorXY": "CMM Bin factor XY",
//   "cmmBinFactorZ": "CMM Bin factor Z",
//   "temLikeContrast": "TEM-like contrast",
//   "cmmFileFormat": "CMM File Format",
//   "qcInfo": "QC info",
//   "chunkCount": "Chunk Count",
//   "sourceImageType": "Source Image Type",
//   "sourceImageFileFormat": "Source image file format",
//   "sourceImageInformation": "Source image information",
//   "numPixelsX": "Num pixels X",
//   "numPixelsY": "Num pixels Y",
//   "numPixelsZ": "Num pixels Z",
//   "pixelSizeX": "Pixel size X",
//   "pixelSizeY": "Pixel size Y",
//   "pixelSizeZ": "Pixel size Z",
//   "units": "Units",
//   "cropMask": "Crop/ Mask?",
//   "cropOrMaskDetails": "Crop or Mask details",
//   "furtherBinningFactorXYZ": "Further binning factor (x y z)",
//   "correlatedImage": "Correlated image",
//   "relocationRegistration": "Relocation/ Registration? ",
//   "transformFiducialListEtc": "Transform / Fiducial list etc",
//   "labelMap": "Label Map",
//   "labeledFeatures": "Labeled features",
//   "labelMapDetails": "Label Map details",
//   "mlDLModelUsed": "ML/DL model used",
//   "derivedFeature": "Derived feature",
//   "derivedFeatureType": "Derived Feature type",
//   "sourceFeatures": "Source Features",
//   "meshOrSkeletonDetails": "Mesh or skeleton details",
//   "syntheticData": "Synthetic data",
//   "syntheticDataDetails": "Synthetic data details",
//   "cmmImageProcessingDetails": "CMM image processing details"
// }
