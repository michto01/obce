/*
 * Extracting open data from RRP via SPARQL
 *
 * Extracting information from Czech national OD catalog via SPARQL.
 * 
 * @discussion: Extracted informations are: meyer, id, name
 *
 * @endpoint: https://rpp-opendata.egon.gov.cz/odrpp/sparql
 */

import axios from "axios";
import { SparqlJsonParser } from "sparqljson-parse";
import { SparqlNode, sparql_query, sparql_value } from "./@generic";

const ENDPOINT='https://rpp-opendata.egon.gov.cz/odrpp/sparql';
const FORMAT='application/sparql-results+json';

const QUERY = `
PREFIX gov: <https://slovník.gov.cz/legislativní/sbírka/111/2009/pojem/>
PREFIX pf: <https://rpp-opendata.egon.gov.cz/odrpp/zdroj/právní-forma/>

SELECT ?ico ?addr ?meyer
WHERE {
 ?ovm rdf:type gov:orgán-veřejné-moci;
               gov:má-právní-formu-osoby ?f .
 VALUES ?f { pf:801 pf:811 }

 ?ovm gov:má-identifikátor-orgánu-veřejné-moci ?ico .

 OPTIONAL { ?ovm gov:má-adresu-sídla-orgánu-veřejné-moci ?addr . }
 OPTIONAL { ?ovm gov:stojí-v-čele-orgánu-veřejné-moci/gov:má-jméno-a-příjmení-osoby-stojící-v-čele-orgánu-veřejné-moci ?meyer . }
 OPTIONAL { ?ovm gov:má-název-orgánu-veřejné-moci ?name . }
}
`

interface QueryResult {
    ico: SparqlNode;
    addr: SparqlNode;
    meyer: SparqlNode | null;
}

interface Meyer {
    ico: string;
    meyer: string | null;
}

export async function queryODRRPMetadataDatabase(
    limit : number = 10000,
    offset : number = 0
) : Promise<[Meyer]> {
    const sparql = await sparql_query(ENDPOINT, QUERY, { limit: limit, offset: offset});
    const parser = new SparqlJsonParser();
    
    return parser.parseJsonResults(sparql.data).map((e: any) => { 
        const tc = e as QueryResult;
        if (tc == null) return;
        return {
            ico: tc.ico != null ? tc.ico.value : null,
            //name: e.name.value,
            meyer: tc.meyer != null ? tc.meyer.value : null
        }
    }) as [Meyer];
}

queryODRRPMetadataDatabase().then((result) => {
    console.log(result);
})