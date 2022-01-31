# sparqler

sparqler - google appscript - based tool for converting sparql queries from a human-readble format into machine-interpretable representation with minimal impact on the knowledge base.

To run from the command line (you will also need to log into the google api itself):

```sh
clasp run map -p '["SELECT DISTINCT ?flour WHERE {?_ o:non_wheat_flour ?flour.}"]'
```

Expected result:

```sh
SELECT DISTINCT ?flour WHERE {
    ?_ orkgp:P37571 ?flour.
}
```
