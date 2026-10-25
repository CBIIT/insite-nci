
export const fetchTaxonomyId = async (
  organism
) => {
    const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=taxonomy";
    const searchParams = new URLSearchParams({
      term: organism,
      retmode: "json"
    });
    const url = `${baseUrl}&${searchParams}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(response);
      throw new Error(response);
    }
    const { esearchresult: result } = await response.json();
    const { translationstack : term = {} } = result;
    return {
       id: result.idlist[0],
       ...term[0]
    }
};

