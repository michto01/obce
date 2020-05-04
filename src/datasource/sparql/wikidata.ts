/*
 * Extracting open data from WikiData SPARQL endpoint
 *
 * Extracting information Wikipedia's database.
 * 
 * @discussion: Extracted informations are: ico, population, area, firstRecord, CoA, flag, website
 *
 * @endpoint: https://query.wikidata.org/bigdata/namespace/wdq/sparql
 */

import { SparqlJsonParser } from "sparqljson-parse";
import { SparqlNode, sparql_query, sparql_value } from "./@generic";

const ENDPOINT='https://query.wikidata.org/bigdata/namespace/wdq/sparql';

const QUERY=`
SELECT (REPLACE(STR(?lua), "CZ", "") as ?municipalityID) ?ico ?population ?area ?firstRecord ?CoA ?flag ?website (?item as ?source) WHERE {
    SERVICE wikibase:label { bd:serviceParam wikibase:language "cs". }
    # Select Municipalites with propper RÚIAN ZUJ (municipality ID)
    { ?item wdt:P31 wd:Q5153359; wdt:P7606 ?lua . }  
    UNION
    # as some of them don't have it, select Municipalities with Czech LUA (NUTS4)
    # !!! beware that in some cases data marked as LUA are districts
    #  => select only LUA with length greater then RUIAN ("CZxxxxxx")
    { ?item wdt:P31 wd:Q5153359; wdt:P782 ?lua . FILTER (STRLEN(STR(?lua)) > 6) }
  
    # Select info about municipality
    OPTIONAL { ?item wdt:P4156 ?ico . }
    OPTIONAL { ?item wdt:P1082 ?population . }
    OPTIONAL { ?item wdt:P2046 ?area . }
    OPTIONAL { ?item wdt:P1249 ?firstRecord . }
    OPTIONAL { ?item wdt:P94 ?CoA . }
    OPTIONAL { ?item wdt:P41 ?flag . }
    OPTIONAL { ?item wdt:P856 ?website . }
  }
`

interface WikiQueryResult {
    ico: SparqlNode;
    population: SparqlNode,
    area: SparqlNode;
    firstRecord: SparqlNode;
    CoA: SparqlNode;
    flag: SparqlNode;
    website: SparqlNode;
    municipalityID: SparqlNode;
    source: SparqlNode;
}

//NOTE: number may return NaN!
interface WikiResponse {
    ico: string;
    municipalityID: string;
    source: string;

    population: number;
    area: number;
    firstRecord: Date;
    CoA: string | null;
    flag: string | null;
    website: string | null;
}

export async function queryWikidata( 
    limit : number = 10000, 
    offset : number = 0
) : Promise<[WikiResponse]> {
    const sparql = await sparql_query(ENDPOINT, QUERY, {offset: offset, limit: limit});

    const parser = new SparqlJsonParser();
    return parser.parseJsonResults(sparql.data).map((e: any) => { 
        const tc = e as WikiQueryResult;
        if (tc == null) return;
        return {
            ico: sparql_value(tc.ico),
            municipalityID: sparql_value(tc.municipalityID),
            source: sparql_value(tc.source),
            population: Number(sparql_value(tc.population)),
            area: Number(sparql_value(tc.area)),
            firstRecord: new Date(String(sparql_value(tc.firstRecord))),
            CoA: sparql_value(tc.CoA),
            flag: sparql_value(tc.flag),
            website: sparql_value(tc.website),
        }
    }) as [WikiResponse];
}

queryWikidata().then((result) => {
    console.log(result);
}).catch((err) => {
    console.error(err);
});