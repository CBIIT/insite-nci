import { safeClone } from "../../utils2";

const domain = "https://evsexplore.semantics.cancer.gov/";
const path = "evsexplore/api/v1/concept/search?"
export const fetchNCITerm = async (
  query
) => {
    // const baseUrl = domain.concat(path).concat("terminology=ncit&include=summary,highlights,properties&pageSize=100");
    // const searchParams = new URLSearchParams({
    //   term: query,
    //   retmode: "json"
    // });
    // const url = `${baseUrl}&${searchParams}`;
    // const response = await fetch(url);

    
    const response = await fetch("api/fetch_ncit_term", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      // console.error(response);
      throw new Error(response);
    }
    const data = await response.json();
    // 
    const results = safeClone(data?.concepts)
    results?.forEach(item => {
      const synonymsList = item?.synonyms.map(sy => sy?.name);
      const distinct = new Set(synonymsList);
      item.synonyms = Array.from(distinct);
    });

    return results || [];
};


// https://evsexplore.semantics.cancer.gov/evsexplore/api/v1/concept/
// search?terminology=ncit&include=summary,highlights,properties
// &term=Liver&type=contains&export=false&fromRecord=0
// &pageSize=10&synonymSource=&synonymTermTyp