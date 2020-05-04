import axios from "axios";

var stripComments = (function () {
    var re1 = /^\s+|\s+$/g;
    var re2 = /\s*[#].+$/g;
    return function (s : string) {
      return s.replace(re1,'').replace(re2,'');
    };
}());

export interface SparqlNode {
    datatype: any;
    value: string | null;
    language: string | null;
}

//TODO: guard against NaNs ?
export type SparqlQueryOptions = {
    limit? : number;
    offset? : number;
    output? : string;
}

export function sparql_value(obj : SparqlNode) {
    if (obj == null) return null;
    return obj.value;
}

export async function sparql_query(
    endpoint : string,
    query : string,
    options : SparqlQueryOptions
): Promise<any> {
  const { output = 'application/sparql-results+json', limit = 10000, offset = 0 } = options;
  const sparql_query_raw = encodeURIComponent(stripComments(query) + `OFFSET ${offset}\nLIMIT ${limit}`);
  const sparql_query = `${endpoint}?query=${sparql_query_raw}`;
  const response = await axios.get(sparql_query, {
    headers: {
    'Content-Type': output,
    "Access-Control-Allow-Origin": "*",
    }
  });
  return response;
}