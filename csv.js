/**
 * Management of CSV files 
 */

/**
 * Convert the data from CSV in a list of Maps.
 * csvData can be:
 * - indexedByKey:true (def) an array of maps
 * - indexedByKey:false      ar array 
 */
function csvData2ListOfMaps(csvData, csvFieldsDef, indexedByKey, fTransforms) {
  var listOfMaps=[];

  // Loop over all the rows
  for ( var ind in csvData ) {
    var row=csvData[ind];
    // console.log("row[" + ind + "] : (" + row + ")"); // . length=" + row.length);

    // No data
    if ( indexedByKey ) {
      // if ( ind>240 ) console.log ("[" + ind + "] : " + Object.keys(row));
      if ( Object.keys(row).length<=1 ) continue;
    } else {
      if ( row.length<=1 ) continue;
    }


    // Check header if we do not read by key
    if ( ind==0  && !indexedByKey ) {
      console.log(row);
      for ( var key in csvFieldsDef ) {
        var nf=csvFieldsDef[key]["nf"];
        var header=csvFieldsDef[key]["header"];
        var msg="Field '" + key + "' in position " + nf  + " : found '" + row[nf] + "' and expecting '" + header +"'";

        console.log(msg);
        if  ( row[nf]!=header ) {
          alert ("ERROR " + msg);
          throw msg;
        }
      }
    // Row
    } else {
      // Map containing all the values we're interested in
      // (csvFieldsDef)
      var item={};
      for ( var key in csvFieldsDef ) {
        var value=null;

        if ( indexedByKey ) {
          value=row[csvFieldsDef[key]["header"]];
        } else {
          value=row[csvFieldsDef[key]["nf"]];
        }
        // console.log(key + " : " + value);

        item[key]=value;
      }
      // Transform the fields
      if ( fTransforms ) {
        for ( var key in fTransforms ) {
          item[key]=fTransforms[key](item, row);
        }
      } 
      /*
      if ( item['key']==='INV-2461' ) {
        console.log('INV-2461 : ' + JSON.stringify(row));
      }
      */
      listOfMaps.push(item);
    }
  }
  // console.log(listOfMaps);

  return listOfMaps;
}

/**
 * Process a CSV that contains issues for a certain project:
 * - Updates _listOfIssues and other derived data
 * - "Render" the data.
 *
 * @param csvData list/map :the CSV's content in form of array or map
 * @indexedByKey bool : if indexedByKey==false csvData is an array, if indexedByKey==true it is a map
 */
function processCSVData(csvData, indexedByKey) {
  // Get the new Issues and add them to _listOfIssues
  var tmpArray = 
    csvData2ListOfMaps(csvData, CSV_FIELDS_DEF, indexedByKey, {
      // Calculate project from Issue Key
      "prj" : function(item, originalData) {
        return item['key'].split("-")[0];
      },
      "isOpen" : function (item, originalData) {
        var status=item['status'];
        if ( ['Open', 'In Review', 'In Progress', 'Analyzed'].includes(status) ) {
          return true;
        } else if ( ['Closed'].includes(status) ) {
          return false;
        } else {
          alert("Unknown status '" + status + "'");
        }
      },
      // Convert reamining to hours
      "remaining" : function(item, originalData) {
        var value=item['remaining'];

        // console.log("value '" + value + "' : " + (parseFloat(value)/3600).toFixed(2));
        if ( !value || value.length==0) {
          return 0;
        } else {
          return parseFloat(value)/3600;
        }
      },
      // Convert reamining to hours
      "sum_remaining" : function(item, originalData) {
        var value=item['sum_remaining'];

        // console.log("value '" + value + "' : " + parseFloat(value)/3600);
        if ( !value || value.length==0) {
          return 0;
        } else {
          return parseFloat(value)/3600;
        }
      },
      // Usually it is an array 
      // TODO : this could be generalized to convert any
      // property multivalues to a list
      "components" : function(item, originalData) {
        var data=[];
        if ( originalData["Component/s"] ) {
          data.push(originalData["Component/s"]);
          for (var ind=1; ; ++ind) {
            var key="Component/s" + "_" + ind;
            if ( key in originalData && originalData[key] ) {
              data.push(originalData[key]);
            } else {
              break;
            }
          }
          console.log("components : " + JSON.stringify(data));
        }

        return data;
      }
    });
  // TODO : find a better way to add an array to end of array
  for ( var ind=0; ind<tmpArray.length; ++ind) {
    _listOfIssues.push(tmpArray[ind]);
  }

  renderIssues(_listOfIssues);
}

/**
 * Unfortuntely, the CVSs we can get from the Jira's export can have
 * duplicated headers :-( and then only the last value is stored.
 * As a workaround, those headers are renamed adding a suffix so the CSV has
 * different names
 * @return a string with the csv (header + body) with the duplicated fields in header renamed
 */
function renameDuplicatedHeaders(csv, sep, reqFields) {
  // Break the textblock into an array of lines
  var lines = csv.split('\n');

  // Header : rename duplicated fields
  var header=lines[0];
  var headerFields=header.split(sep);
  var newHeader=null;
  var newHeaderFields=[];

  // Empty CSV
  console.log("header '" + header + "' length=" + header.length);
  if ( !header || header.length==0 ) return null;

  // Replace some special characters in header as 'Σ'
  for (var ind=0; ind<headerFields.length; ++ind){
    var field=headerFields[ind];
    console.log('FIELD "' + field + '" => "' + field.substring(1) + '"');
    /*
    if ( field=='Σ Remaining Estimate') {
      alert('Found ' + field);
    }
    */
    if ( field.includes(' Remaining Estimate') ) {
      console.log('Replacing "' + headerFields[ind] + '" by ...');
      headerFields[ind]='SUM Remaining Estimate';
      console.log('"' + headerFields[ind] + '"');
    }
  }

  // First, chech if we have all the required fields
  if ( reqFields ) {
    for (var ind=0; ind<reqFields.length; ++ind ) {
      var field=reqFields[ind];
      console.log("Checking '" + field + "' against '" + headerFields + "' ...");
      if ( !(headerFields.includes(field)) ){
        var msg="Required field '" + field + "' not found in header '" + header + "'";
        alert(msg);
        throw msg;
      }
    }
  }

  // Number of times a field appear in the CSV so we can add the suffix '_1', '_2', .... (default is _0, no suffix is added)
  var numOccurencesField={};
  for (var ind=0; ind<headerFields.length; ++ind){
    var field=headerFields[ind];
    // Duplicated!
    if ( field in numOccurencesField ) {
      console.log("WARNING : found duplicated field in header '" + field + "'");
      newHeaderFields.push(field+"_"+(numOccurencesField[field]));
      numOccurencesField[field] += 1;
    // First time this field appear
    } else {
      newHeaderFields.push(field);
      numOccurencesField[field]=1;
    }
  }
  newHeader=newHeaderFields.join(sep);
  console.log("HEADER (" + header + ") -> (" + newHeader + ")");

  // Body
  // Remove one line, starting at the first position
  lines.splice(0,1);
  // join the array back into a single string
  var body = lines.join('\n');
  
  return newHeader + '\n' + body;
}

/**
 * Generate the links to download the CSV files
 */
$('#bGenerateLinks').on('click', function(){
  var prjName=$('#inputPrjCode').val();
  var $pLinks=$('#links2Download');
  $pLinks.html('');

  var query='project = "' + prjName + '"';
  query += ' and issuetype != Sub-task';
  // var oneLink=null;
  for (var ind=0; ind<10; ++ind) {

    var link = "https://jira.scytl.net/sr/jira.issueviews:searchrequest-csv-current-fields/temp/SearchRequest.csv";
    // Ok I have tried to do an export with ALL fields but very weird when I do it with MEAE the value Fix version/s (that exists and
    // has bvalue) was not exported :-(
    // var link = "https://jira.scytl.net/sr/jira.issueviews:searchrequest-csv-all-fields/temp/SearchRequest.csv";
    link += "?jqlQuery=" + encodeURIComponent(query);
    link += "&delimiter=,";
    link += "&tempMax=1000";
    link += "&pager/start=" + (1000*ind);

    $pLinks.append('<a href="' + link + '">Download' + (ind) + '</a>&nbsp;&nbsp;');
  }
});

/**
 * CSV files uploaded
 */
function eventCSVUpload(event, onDone, hasHeader) {
  var files=event.target.files;
  var indFile=0;
  var reader = new FileReader();

  reader.onload = function () {
    console.log('Reading file ' + (indFile) + " of " + files.length + " ...");

    // In some cases, reading by key had problems with Encoding? bom? 
    // in the first field
    // Remove duplicated headers in the file
    console.log(this.result);
    var csvText=this.result;
    var csvData = null;
    if ( csvText ) {
      csvData = Papa.parse(csvText, {
          'delimiter' : ',',
          'header' : hasHeader,
          'skipEmptyLines' : true,
          // TODO : it seems it is not working .. The names with special characters
          // as accents 
          'encoding' : 'UTF-8'
        }
      );
      onDone(csvData.data);
      console.log('Done with file ' + (indFile) + " of " + files.length + " ...");
    }
 
    ++indFile;
    // Read next
    if ( indFile<files.length ) {
      // reader.readAsBinaryString(files[indFile], 'UTF-8');
      // TODO : hmmm having problems with encoding ...
      reader.readAsText(files[indFile], 'UTF-8');
    }
  };

  // start reading the file. When it is done, calls the onload event defined above.
  reader.readAsBinaryString(files[indFile], 'ISO-8859-1');
}
