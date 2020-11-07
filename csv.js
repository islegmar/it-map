/**
 * Management of CSV files 
 */

/**
 * CSV files uploaded
 */
function eventCSVUpload(event, onItem, onDone, hasHeader) {
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
      if ( onItem ) {
        csvData.data.forEach(function(item){
          onItem(item);
        });
      }
      if ( onDone ) {
        onDone(csvData.data);
      }
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
