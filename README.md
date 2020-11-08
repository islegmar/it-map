# it-map

## Format CSV 

The CSV must:
* Have header
* Delimiter with ,
* Other options (as quoteChar, scapeChar,...) please check [Papa Parse](https://www.papaparse.com/docs#config)

The possible headers are:
* Id : unique identifer. It will be used as refernce in parentID nad relatedID but also to identify DOM elements so it can be any string without spaces neither special characters.
* Name : the name
* Type : the type, used to reference to the image [img/<Type>.jpeg](./img/)
* parentID : NOT IN USE
* X : x coordinates in pixel (0 at top left)
* Y : y coordinates in pixel (0 at top left)
* relatedID : linked node to draw a connection
* Any values starting by _ (eg. _IP, _DNS1, ....) : their values (if not empty) will be shown as information when clicking
