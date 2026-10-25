export const organisms = [
  { value: "Homo sapiens", label: "Human" },
  { value: "Mus musculus", label: "Mouse" },
  { value: "Rattus norvegicus", label: "Rat" },
  { value: "Saccharomyces cerevisiae", label: "Yeast" },
  { value: "Canis lupus familiaris", label: "Dog" },
  { value: "Drosophila melanogaster", label: "Fruit Fly" },
  { value: "Danio rerio", label: "Zebrafish" },
  { value: "Caenorhabditis elegans", label: "C. elegans" },
];

export async function queryProteins(
  query,
  organism = "Homo sapiens",
  size = 100,
  baseUrl = "https://rest.uniprot.org/uniprotkb/search"
) {
  const searchParams = new URLSearchParams({
    query: `${query} AND organism_name:${organism}`,
    format: "json",
    fields: ["accession", "gene_names", "protein_name", "organism_name"],
    size,
  });
  const url = `${baseUrl}?${searchParams}`;
  const response = await fetch(url);

  if (!response.ok) {
    console.error(response);
    throw new Error(response);
  }
  
  const { results } = await response.json();
  return results.map((result) => ({
    id: result?.primaryAccession,
    gene: result?.genes
      ?.map((g) => [g.geneName].concat(g?.synonyms || []).map((g) => g?.value))
      .flat()
      .filter(Boolean) || [],
    name: [result?.proteinDescription?.recommendedName]
      .concat(result?.proteinDescription?.alternativeNames || [])
      .concat(result?.proteinDescription?.submissionNames || [])
      .map((p) => p?.fullName?.value)
      .filter(Boolean) || [],
    organism: [result?.organism?.scientificName, result?.organism?.commonName].filter(Boolean).join(" - ") || "N/A",
    link: result?.primaryAccession && `https://www.uniprot.org/uniprotkb/${result?.primaryAccession}/entry`,
  })).filter(result => result.id);
}
