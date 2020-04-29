/*
 *  Extracting open data from RRP via SPARQL
 *
 *  @endpoint: https://rpp-opendata.egon.gov.cz/odrpp/sparql
 */

import axios from "axios";
import { SparqlJsonParser } from "sparqljson-parse";

const ENDPOINT='https://rpp-opendata.egon.gov.cz/odrpp/sparql';
const FORMAT='application/sparql-results+json';

const QUERY=`
PREFIX gov: <https://slovník.gov.cz/legislativní/sbírka/111/2009/pojem/>

SELECT (STR(?ico) as ?ico) (STR(?name) as ?name) (STR(?meyer) as ?meyer)
WHERE {
  ?item a gov:osoba-stojící-v-čele-orgánu-veřejné-moci .
  ?organ gov:stojí-v-čele-orgánu-veřejné-moci ?item .
  { ?organ gov:má-právní-formu-osoby ?type . FILTER( 
      STR(?type) = "https://rpp-opendata.egon.gov.cz/odrpp/zdroj/právní-forma/801" 
   || STR(?type) = "https://rpp-opendata.egon.gov.cz/odrpp/zdroj/právní-forma/811" )
  }

  OPTIONAL { ?item gov:má-jméno-a-příjmení-osoby-stojící-v-čele-orgánu-veřejné-moci ?meyer . } 
  OPTIONAL { ?organ gov:má-identifikátor-orgánu-veřejné-moci ?ico . }
  OPTIONAL { ?organ gov:má-název-orgánu-veřejné-moci ?name . }
}
LIMIT 10000
`


export async function getODRRPMetadataDatabase() {
    const endpoint = `${ENDPOINT}?format=${encodeURIComponent(FORMAT)}&query=${encodeURIComponent(QUERY)}`;
    
    const sparql = await axios.get(endpoint);

    const parser = new SparqlJsonParser();
    const results = parser.parseJsonResults(sparql.data).map((e : any) => {
        return {
            ico: e.ico.value,
            //name: e.name.value,
            meyer: e.meyer.value
        }
    });
    

    console.log(results);
}
getODRRPMetadataDatabase();