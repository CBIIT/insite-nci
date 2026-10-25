


export const generateMetadataJson = (from, hierarchyMapping) => {
    console.log('generate mapping');
    const hierarchies = Object.keys(hierarchyMapping.namespaceMapping);
    console.log(hierarchies);
    for (let hierarchy of hierarchies) {
      console.log(hierarchy);
      const hierarchyItems = hierarchyMapping.namespaceMapping[hierarchy];
      console.log(hierarchyItems);
      // console.logh(hierarchyMapping.namespaceMapping[hierarchy])
      if (hierarchy === "Project Level") {
          
      }
    }
}