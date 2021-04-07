var api = require('./neo4jApi');
var pwd = require("../store-password.json")
var viz;

//Some variable used in all function
var typeRecherche = [];
var typeOpe = [];
var langList = [];
var exeEnvList = [];
var landmarkerList = [];
var optionLandmarkerList = [];
var optionParameterList = [];
var optionEvaluationList = [];
var optionEntityClass = [];
var entityClassList = [];
var dsDate = "0001-01-01";
var pDate = "0001-01-01";
var inputECAnames = "";
var algoNames = document.getElementById("algoNames");
var RelationDSArray = []
var lastSelected;


//Beginning of event listener
$(function () {
  //Initialisation of graphic interface
  draw()
  draw2()
  draw3()
  draw4()
  draw5()
  usedOpeInit()

  //Variable to stock tags input
  var tagsinput = $('#tagsinput').tagsinput('items');

  //Function on itemAdded for each key words input
  $("#tagsinput").on('itemAdded', function (event) {
    console.log('item added : ' + event.item);
    console.log('tagsinput : ' + tagsinput)
    //For each new keywords added, it reinitialize the interface to show the three search table and it hide the graphic interface.
    $("#processNames").closest(".collapse").collapse('show');
    $("#dbNames").closest(".collapse").collapse('show');
    $("#analyseNames").closest(".collapse").collapse('show');
    $('#graphco').collapse('hide');
    //Clean column to let the new results appear from the query (dataset, process, analyse)
    $(".names").empty()
    //refresh graphic interface
    draw()
    draw2()
    draw3()
    draw4()
    draw5()
    //Call for search functions with inputs
    showProcesses(tagsinput)
    showStudies(tagsinput)
    showDatabases(tagsinput)
    //Init filters that need database request
    languageProcessInit(tagsinput)
    excutionEnvironmentInit(tagsinput)
    //Clean others interfaces to reset if there was a precedent research
    $(".analyse").empty();
    $("#EntityClassNames").empty()
  });

  //Same if a input tags is removed
  $("#tagsinput").on('itemRemoved', function (event) {
    console.log('item removed : ' + event.item);
    console.log('tagsinput : ' + tagsinput)
    $("#processNames").closest(".collapse").collapse('show');
    $("#dbNames").closest(".collapse").collapse('show');
    $("#analyseNames").closest(".collapse").collapse('show');
    $('#graphco').collapse('hide');
    if (!tagsinput.length == 0) {
      $(".names").empty()
      draw()
      draw2()
      draw3()
      draw4()
      draw5()
      showProcesses(tagsinput)
      showStudies(tagsinput)
      showDatabases(tagsinput)
      languageProcessInit(tagsinput, langList, pDate, typeOpe)
      excutionEnvironmentInit(tagsinput)
      $(".analyse").empty();
      $("#EntityClassNames").empty()
    }
    else {
      $(".names").empty();
      draw()
      draw2()
      draw3()
      draw4()
      draw5()
    }
  });


  //Function onclick to go back to the search table from the graphic interface.
  $('#back').on('click', function () {
    $("#processNames").closest(".collapse").collapse('show');
    $("#dbNames").closest(".collapse").collapse('show');
    $("#analyseNames").closest(".collapse").collapse('show');
    $("#graphco").collapse('hide');
    $(".analyse").empty();
    $("#EntityClassNames").empty()
  });

  //Function onlick on attributes and entityclass interface to show their properties
  $('.attNames').on('click', "td", function () {
    //Clean the precedent list of items
    $('#relationshipOnglet').empty()
    $('#relationshipContent').empty()
    //Check if the target is a attribute or an entity class
    if ($(this).context.className == "Attribute") {
      //Clean the properties windows if a precedent items has been clicked.
      $('#attrProperties').empty()
      //Check if the attributes is numeric or nominal
      if ($(this).attr('id').split('$')[2] = 'nominale') {
        //Call of a function to get database result
        api.getNominalAttribute($(this).attr('id').split('$')[0], $(this).attr('id').split('$')[1]).then(a => {
          //Transform the result format to JSON to have an easier access to informations
          json = JSON.parse(JSON.stringify(a[0]))
          //Get the properties windows emplacement
          $list = $('#attrProperties')
          for (propriete in a[0]) {
            $list.append("<p>" + propriete + " : " + json[propriete] + "</p>");
          }
        })
      }
      //If numeric attribute
      if ($(this).attr('id').split('$')[2] = 'numeric') {
        api.getNumericAttribute($(this).attr('id').split('$')[0], $(this).attr('id').split('$')[1]).then(a => {
          json = JSON.parse(JSON.stringify(a[0]))
          $list = $('#attrProperties')
          for (propriete in a[0]) {
            $list.append("<p>" + propriete + " : " + json[propriete] + "</p>");
          }
        })
      }
    }

    //if the target is an entity class
    if ($(this).context.className == 'EntityClass') {
      $('#EntityClassProperties').empty()
      //Call of a database fucntion to get entity class by analysis
      api.getEntityClassByAnalyse($(this).attr('id').split('$')[2], $(this).attr('id').split('$')[1]).then(ec => {
        console.log(ec)
        json = JSON.parse(JSON.stringify(ec[0]))
        $list = $('#EntityClassProperties')
        for (propriete in ec[0]) {
          $list.append("<p>" + propriete + " : " + json[propriete] + "</p>");
        }
      })
      //or by dataset
      api.getEntityClassByDataset($(this).attr('id').split('$')[0], $(this).attr('id').split('$')[1], $(this).attr('id').split('$')[2]).then(ec => {
        console.log(ec)
        json = JSON.parse(JSON.stringify(ec[0]))
        $list = $('#EntityClassProperties')
        for (propriete in ec[0]) {
          $list.append("<p>" + propriete + " : " + json[propriete] + "</p>");
        }
      })
    }
  })

  //Onlick function for the three tables (dataset, process, analyses)
  $('.names').on('click', "td", function () {
    //To change the color of the element clicked to know which one is clicked
    $(this)[0].style.backgroundColor = '#93e2df'
    if (lastSelected) {
      lastSelected[0].style.backgroundColor = ''
    }
    lastSelected = $(this)

    //When we click on an element, we hide all the tables to only show the table of the element and the graphic interface
    $('.collapse').collapse('hide');
    //The set time out allow to wait for the collapse element to end their changement bootstrap collapse have 3 state (collapse <-> collapsing <-> collapse in)
    setTimeout(() => { $('#graphco').collapse('show'); }, 500);
    //Clean the properties window
    $("#properties").empty()

    //check which element is clicked
    if ($(this).context.className == "Process") {
      //Hide unused tabs
      $('#featureButton')[0].style.display = 'none';
      $('#dsRelationButton')[0].style.display = 'none';
      $('#attRelationButton')[0].style.display = 'none';
      $('#operationButton')[0].style.display = 'block';

      //Get information of the process clicked
      api
        .getProcesses([$(this).text()])
        .then(p => {
          if (p) {
            json = JSON.parse(JSON.stringify(p[0]))
            var $p = $("#properties")
            for (propriete in p[0]) {
              if (propriete == 'creationDate' || propriete == "executionDate" || propriete == 'id') {
                $p.append("<p>" + propriete + " : " + json[propriete].low + "</p>");
              } else {
                $p.append("<p>" + propriete + " : " + json[propriete] + "</p>");
              }
            }
          }
        }, "json");

      //Graph variable
      //query is for lineage
      //query2 is for hyper-graph
      //query3 is for Operation
      query = "MATCH path =(m : DLStructuredDataset)<-[:targetData]-(c:Process {name:'" + $(this).text() + "'})<-[:sourceData]-(d:DLStructuredDataset) OPTIONAL MATCH (c)<-[q:hasSubprocess]-(w: Process) RETURN path, w,q"; //Process
      query2 = "MATCH path= (p:Process {name:'" + $(this).text() + "'})-[:hasSubprocess]-(t:Process) RETURN path"
      query3 = `MATCH (p:Process {name:'` + $(this).text() + `'}) 
      OPTIONAL MATCH (p)-[r3:containsOp]->(c:OperationOfProcess)<-[r4:isUsedBy]-(o:Operation)
      OPTIONAL MATCH (p)-[r5:hasSubprocess]->(p1:Process)-[r1:containsOp]->(c1:OperationOfProcess)<-[r2:isUsedBy]-(o1:Operation)
      RETURN p,r3,c,r4,o,p1,r1,c1,r2,r5,o1`

      //Init each graph window
      if (query2.length > 3) {
        viz2.renderWithCypher(query2);
      } else {
        console.log("reload");
        viz2.reload();
      }
      if (query3.length > 3) {
        viz3.renderWithCypher(query3);
      } else {
        console.log("reload");
        viz3.reload();
      }

      //Show the table of process
      setTimeout(() => { $("#processNames").closest(".collapse").collapse('show') }, 500);

    } else { //Event part for the study
      if ($(this).context.className == "Study") {
        $('#featureButton')[0].style.display = 'block';
        $('#dsRelationButton')[0].style.display = 'none';
        $('#attRelationButton')[0].style.display = 'block';
        $('#operationButton')[0].style.display = 'none';
        api
          .getStudies([$(this).text()], typeRecherche, landmarkerList, algoNames.value)
          .then(p => {
            if (p) {
              console.log(p);
              json = JSON.parse(JSON.stringify(p[0]))
              var $p = $("#properties")
              for (propriete in p[0]) {
                if (propriete == 'creationDate' || propriete == "executionDate" || propriete == 'id') {
                  $p.append("<p>" + propriete + " : " + json[propriete].low + "</p>");
                } else {
                  $p.append("<p>" + propriete + " : " + json[propriete] + "</p>");
                }
              }
            }
          }, "json");
        query = "MATCH path = shortestpath ((d:DLStructuredDataset)-[*]-(u:Study {name:'" + $(this).text() + "'})) RETURN path" //Study

        //Get the analysis of the study clicked to create a list
        var $list = $(this).parent()
        api
          .getAnalyses($(this).text(), '')
          .then(p => {
            p.sort(function(a, b){
              var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
              if (nameA < nameB) //sort string ascending
                  return -1 
              if (nameA > nameB)
                  return 1
              return 0 //default return value (no sorting)
          })
            if (p) {
              $("#EntityClassNames").empty()
              $list.append($("<tr class ='analyse'><td class ='analyse'>  Analyses : </td></tr>"));
              for (var i = 0; i < p.length; i++) {
                $list.append($("<tr class ='analyse'><td class ='analyse' id='" + p[i].name + "$" + p[i].uuid + "'>" + p[i].name + "</td></tr>"));
                showEntityClassByAnalyse(p[i].uuid, p[i].name)
              }
            }
          }, "json");



        setTimeout(() => { $("#analyseNames").closest(".collapse").collapse('show') }, 500);

      } else { //Event part for the Dataset
        if ($(this).context.className == "Database") {
          $('#featureButton')[0].style.display = 'none';
          $('#dsRelationButton')[0].style.display = 'block';
          $('#attRelationButton')[0].style.display = 'block';
          $('#operationButton')[0].style.display = 'none';

          //Clean the different tabs used by dataset information.
          $('#relationshipOnglet').empty()
          $('#relationshipContent').empty()
          $('#relationshipAttOnglet').empty()
          $('#relationshipAttContent').empty()
          $('#attributeList').empty()

          //Check the type of dataset
          if ((($(this).context.id).toLowerCase()).includes("semi")) {
            var typeDS = 'Semi-Structured';
          } else {
            if ((($(this).context.id).toLowerCase()).includes("un")) {
              var typeDS = 'Unstructured';
            } else {
              var typeDS = 'Structured';
            }
          }
          //get dataset informations
          api
            .getDatabases([$(this).text()], typeDS)
            .then(p => {
              if (p) {
                console.log(p[0]);
                json = JSON.parse(JSON.stringify(p[0]))
                var $p = $("#properties")
                for (propriete in p[0]) {
                  $p.append("<p>" + propriete + " : " + json[propriete] + "</p>");
                }
                $('#EntityClassProperties').empty()
                //get entity class by dataset to create a list
                showEntityClassByDataset(p[0].uuid, p[0].name, typeDS)
              }
            }, "json");


          var relationlist = []
          //Get the relation between this dataset and others
          api
            .getRelationshipDSbyDataset($(this).attr('id').split('$')[1], $(this).attr('id').split('$')[2], 'RelationshipDS')
            .then(p => {
              console.log(p)
              $listTab = $('#relationshipOnglet')
              $listContent = $('#relationshipContent')
              //Create tabs for each relation
              for (var i = 0; i < p.length; i++) {
                relationlist.push(p[i].name)
                $listTab.append('<li><a data-toggle="tab" href="#' + p[i].name + '">' + p[i].name + '</a></li>')
                $listContent.append(`
                <div id='`+ p[i].name + `' class="tab-pane fade">
                    <table class='relationshiptable'>
                    <tbody id='dataset_` + p[i].name + `'><tbody>
                    </table>
                </div>`)

              }
              for(var i = 0; i<relationlist.length; i++){
                //for each relation get dataset and relation value
                getDatasetOfRelationship($(this).attr('id').split('$')[1], $(this).attr('id').split('$')[2], relationlist[i])  
              }
            }, 'json')

            //same for the attribute 
          var relationlist = []
          $('#relationshipAttOnglet').empty()
          $('#relationshipAttContent').empty()
          api
            .getRelationshipAttribute($(this).attr('id').split('$')[2], '', 'relation')
            .then(p => {
              console.log(p)
              $listTab = $('#relationshipAttOnglet')
              $listContent = $('#relationshipAttContent')
              for (var i = 0; i < p.length; i++) {
                relationlist.push(p[i].name)
                $listTab.append('<li><a data-toggle="tab" href="#' + p[i].name + '">' + p[i].name + '</a></li>')
                $listContent.append(`
                <div id='`+ p[i].name + `' class="tab-pane fade">
                    <table class='relationshiptable'>
                        <tbody id='attribute_` + p[i].name + `'><tbody>
                    </table>
                </div>`)
              }
              for (var i = 0; i < relationlist.length; i++) {
                getAnalyseOfRelationship($(this).attr('id').split('$')[2], relationlist[i]);
              }
            }, 'json')

          console.log('idname : ' + $(this).context.id)
          if ((($(this).attr('id').split('$')[0]).toLowerCase()).includes("semi")) {
            //graph for Semi-structured dataset
            query = "MATCH path = shortestpath ((ds:DatasetSource)-[*]-(d:DLSemistructuredDataset {name:'" + $(this).text() + "'})) RETURN path"
            query2 = "MATCH (d:DLSemistructuredDataset {name:'" + $(this).text() + "'}) OPTIONAL MATCH (d)-[r:sourceData]->(p:Process)-[:hasSubprocess]->(j:Process) OPTIONAL MATCH (d)<-[s:targetData]-(p1:Process)-[:hasSubprocess]->(j1:Process) with d,p,p1,r,s RETURN d,p,p1,r,s"
          } else {
            if ((($(this).attr('id').split('$')[0]).toLowerCase()).includes("un")) {
              //graph for Unstructured dataset
              query = "MATCH path = shortestpath ((ds:DatasetSource)-[*]-(d:DLUnstructuredDataset {name:'" + $(this).text() + "'})) RETURN path"
              query2 = "MATCH (d:DLUnstructuredDataset {name:'" + $(this).text() + "'}) OPTIONAL MATCH (d)-[r:sourceData]->(p:Process)-[:hasSubprocess]->(j:Process) OPTIONAL MATCH (d)<-[s:targetData]-(p1:Process)-[:hasSubprocess]->(j1:Process) with d,p,p1,r,s RETURN d,p,p1,r,s"
            } else {
              //graph for strudtured dataset
              query = "MATCH path = shortestpath ((ds:DatasetSource)-[*]-(d:DLStructuredDataset {name:'" + $(this).text() + "'})) RETURN path";
              query2 = "MATCH (d:DLStructuredDataset {name:'" + $(this).text() + "'}) OPTIONAL MATCH (d)-[r:sourceData]->(p:Process)-[:hasSubprocess]->(j:Process) OPTIONAL MATCH (d)<-[s:targetData]-(p1:Process)-[:hasSubprocess]->(j1:Process) with d,p,p1,r,s RETURN d,p,p1,r,s"
            }
          }
          //query4 for dataset relationship
          query4 = `MATCH (dl)<-[r1:withDataset]-()-[r2:hasRelationshipDataset]->(rDS:RelationshipDS),(autreDS)<-[r3:withDataset]-()-[r4:hasRelationshipDataset]->(rDS:RelationshipDS),(autreDS)<-[r5:withDataset]-(adrR)-[r6:withDataset]->(dl) 
          WHERE dl.name CONTAINS '`+ $(this).attr('id').split('$')[1] + `' and dl.uuid = '` + $(this).attr('id').split('$')[2] + `'
          AND
          (autreDS:DLStructuredDataset OR autreDS:DLSemistructuredDataset OR autreDS:DLUnstructuredDataset)
          RETURN DISTINCT dl,rDS,autreDS,adrR,r1,r2,r3,r4,r5,r6`
          //query5 for attribute relationship
          query5 = `MATCH (dl)-[]-(e:EntityClass)-[]-(a),(a)-[r1:hasAttribute]-(AA:AnalysisAttribute)-[r2:useMeasure]-(RA:RelationshipAtt),(AA)-[r3:hasAttribute]-(a2)
            WHERE dl.uuid = '` + $(this).attr('id').split('$')[2] + `'
            AND
            (a:NominalAttribute OR a:NumericAttribute OR a:Attribute)
            RETURN DISTINCT a,r1,AA,r2,RA,a2,r3`
          console.log(query5)
          //refresh graph window with the new query
          if (query5.length > 3) {
            viz5.renderWithCypher(query5);
          } else {
            console.log("reload");
            viz5.reload();
          }
          if (query2.length > 3) {
            viz2.renderWithCypher(query2);
          } else {
            console.log("reload");
            viz2.reload();
          }
          if (query4.length > 3) {
            viz4.renderWithCypher(query4);
          } else {
            console.log("reload");
            viz4.reload();
          }

          setTimeout(() => { $("#dbNames").closest(".collapse").collapse('show') }, 500);

        } else { //Event part for the analyse
          if ($(this).context.className == "analyse") {
            $('#featureButton')[0].style.display = 'block';
            $('#dsRelationButton')[0].style.display = 'none';
            $('#attRelationButton')[0].style.display = 'block';
            $('#operationButton')[0].style.display = 'none';


            $('#relationshipAttOnglet').empty()
            $('#relationshipAttContent').empty()
            $('#attributeList').empty()

            api
              .getAnalyses('', $(this).attr('id').split('$')[0], $(this).attr('id').split('$')[1])
              .then(p => {
                console.log(p)
                json = JSON.parse(JSON.stringify(p[0]))
                var $p = $("#properties")
                for (propriete in p[0]) {

                  $p.append("<p>" + propriete + " : " + json[propriete] + "</p>");
                }
              }, "json");

            setTimeout(() => { $("#analyseNames").closest(".collapse").collapse('show') }, 500);

            //Get numeric and nominal features to create an interface with their properties
            api.getNumericFeaturesbyAnalysis($(this).attr('id').split('$')[1]).then(pNu => {
              $('#NumericFeaturesNames').empty()
              json = JSON.parse(JSON.stringify(pNu[0]))
              var $list = $('#NumericFeaturesNames')
              for (propriete in pNu[0]) {
                if (json[propriete]) {
                  $list.append("<p>" + propriete + " : " + json[propriete] + "</p>");
                }
              }
            }, 'json');

            api.getNominalFeaturesbyAnalysis($(this).attr('id').split('$')[1]).then(pNo => {
              $('#NominalFeaturesNames').empty()
              json = JSON.parse(JSON.stringify(pNo[0]))
              var $list = $('#NominalFeaturesNames')
              for (propriete in pNo[0]) {
                if (json[propriete]) {
                  $list.append("<p>" + propriete + " : " + json[propriete] + "</p>");
                }
              }
            }, 'json');
            $('#AttributesNames').empty()

            //get numeric and nominal attribute to get their information
            api.getNominalAttributebyAnalysis($(this).attr('id').split('$')[1]).then(na => {
              var $list = $('#AttributesNames')
              $list.append('"<tr><td><h4>Nominal Attribute</h4></td></tr>')
              console.log(na)
              for (var i = 0; i < na.length; i++) {
                console.log(na[i].name)
                $list.append("<tr><td class='Attribute' id='" + na[i].name + "$" + $(this).attr('id').split('$')[1] + "$nominal'>" + na[i].name + "</td></tr>")
              }
            }, 'json');

            api.getNumericAttributebyAnalysis($(this).attr('id').split('$')[1]).then(na => {
              var $list = $('#AttributesNames')
              $list.append('<tr><td><h4>Numeric Attribute</h4></td></tr>')
              console.log(na)
              for (var i = 0; i < na.length; i++) {
                $list.append("<tr><td class='Attribute' id='" + na[i].name + "$" + $(this).attr('id').split('$')[1] + "$numeric'>" + na[i].name + "</td></tr>")
              }
            }, 'json');


            //Part for the relationship between attribute 
            var relationlist = []
            $('#relationshipAttOnglet').empty()
            $('#relationshipAttContent').empty()
            api
              .getRelationshipAttribute($(this).attr('id').split('$')[1], '', 'relation')
              .then(p => {
                console.log(p)
                $listTab = $('#relationshipAttOnglet')
                $listContent = $('#relationshipAttContent')
                for (var i = 0; i < p.length; i++) {
                  relationlist.push(p[i].name)
                  $listTab.append('<li><a data-toggle="tab" href="#' + p[i].name + '">' + p[i].name + '</a></li>')
                  $listContent.append(`
                <div id='`+ p[i].name + `' class="tab-pane fade">
                    <table class='relationshiptable'>
                        <tbody id='attribute_` + p[i].name + `'><tbody>
                    </table>
                </div>`)
                }
                for (var i = 0; i < relationlist.length; i++) {
                  getAnalyseOfRelationship($(this).attr('id').split('$')[1], relationlist[i]);
                }
              }, 'json')


            //Query part
            query = "MATCH path = shortestpath ((d:DLStructuredDataset)-[*]-(u:AnalysisEntityClass {name:'" + $(this).attr('id').split('$')[0] + "',uuid:'" + $(this).attr('id').split('$')[1] + "'})) RETURN path" //Analyse
            query2 = `MATCH (a:AnalysisEntityClass)
            MATCH (a)<-[r1:hasAnalysis]-(s:Study)
            MATCH (a)<-[r2:evaluateAnalysisEntityClass]-(me:ModelEvaluation)-[r3:useEvaluationMeasure]->(em:EvaluationMeasure)
            WHERE
            toLower(a.name) CONTAINS toLower('`+ $(this).attr('id').split('$')[0] + `') AND a.uuid = '` + $(this).attr('id').split('$')[1] + `'
            WITH a,s,em,me,r1,r2,r3
            OPTIONAL MATCH (a)-[r4:hasImplementation]-(ld:Landmarker)
            WITH a,s,em,me,ld,r1,r2,r3,r4
            OPTIONAL MATCH (a)-[r5:hasImplementation]->(i:Implementation)-[r6:usesAlgo]->(al:AlgoSupervised),(a)-[r7:hasParameterSetting]->(ps:ParameterSetting)<-[r8:hasParameterValue]-(p:Parameter)<-[r9:hasParameter]-(i)
            RETURN a,s,me,em,ld,i,al,p,ps,r1,r2,r3,r4,r5,r6,r7,r8,r9`
            query5 = `MATCH (dl)-[]-(e:EntityClass)-[]-(a),(a)-[r1:hasAttribute]-(AA:AnalysisAttribute)-[r2:useMeasure]-(RA:RelationshipAtt),(AA)-[r3:hasAttribute]-(a2)
            WHERE dl.uuid = '` + $(this).attr('id').split('$')[1] + `'
            AND
            (a:NominalAttribute OR a:NumericAttribute OR a:Attribute)
            RETURN DISTINCT a,r1,AA,r2,RA,a2,r3`
            

            if (query5.length > 3) {
              viz5.renderWithCypher(query5);
            } else {
              console.log("reload");
              viz5.reload();
            }
            if (query2.length > 3) {
              viz2.renderWithCypher(query2);
            } else {
              console.log("reload");
              viz2.reload();
            }
          }
        }
      }
    }
    console.log(query);
    if (query.length > 3) {
      viz.renderWithCypher(query);
    } else {
      console.log("reload");
      viz.reload();
    }

  });

  //Checkbox event for the primary filter (those who are not within the more)
  $('#filter :checkbox').change(function () {
    // this will contain a reference to the checkbox   
    if (this.checked) {
      typeRecherche.push(this.id);
      console.log("cases cochées : " + typeRecherche);
      //Check the type of checkbox
      if (typeRecherche.includes("Structured") || typeRecherche.includes("Semi-Structured") || typeRecherche.includes("Unstructured")) {
        $("#dbNames").empty()
        showDatabases(tagsinput, typeRecherche)
      }
      if (typeRecherche.includes("supervised") || typeRecherche.includes("descriptive") || typeRecherche.includes("diagnostic") || typeRecherche.includes("predictive") || typeRecherche.includes("prescriptive")) {
        $("#analyseNames").empty()
        showStudies(tagsinput, typeRecherche);
      }
      if (typeRecherche.includes("algosupervised") || typeRecherche.includes("algoUnsupervised") || typeRecherche.includes("algoReinforcement")) {
        $("#analyseNames").empty()
        showStudies(tagsinput, typeRecherche);
      }
    } else {
      //Remove the filtre of the unchecked box
      const index = typeRecherche.indexOf(this.id);
      if (index > -1) {
        typeRecherche.splice(index, 1);
      }
      // the checkbox is now no longer checked
      $(".names").empty()
      if (typeRecherche.length == 0) {
        showProcesses(tagsinput)
        showStudies(tagsinput)
        showDatabases(tagsinput)
      }
      else {
        if (typeRecherche.includes("Structured") || typeRecherche.includes("Semi-Structured") || typeRecherche.includes("Unstructured")) {
          $("#dbNames").empty()
          showDatabases(tagsinput, typeRecherche)
        }
        if (typeRecherche.includes("supervised") || typeRecherche.includes("descriptive") || typeRecherche.includes("diagnostic") || typeRecherche.includes("predictive") || typeRecherche.includes("prescriptive")) {
          $("#analyseNames").empty()
          showStudies(tagsinput, typeRecherche);
        }
        if (typeRecherche.includes("algosupervised") || typeRecherche.includes("algoUnsupervised") || typeRecherche.includes("algoReinforcement")) {
          $("#analyseNames").empty()
          showStudies(tagsinput, typeRecherche);
        }
      }
    }
  });

  //Event for checkbox in dropdown menu (mainly for filter)
  $('#usedOpeDropdown').on('click', 'input', function () {
    $("#processNames").empty();
    if (this.checked) {
      typeOpe.push(this.id)
      showProcesses(tagsinput, langList, pDate, typeOpe, exeEnvList);
    } else {
      const index = typeOpe.indexOf(this.id);
      if (index > -1) {
        typeOpe.splice(index, 1);
      }
      showProcesses(tagsinput, langList, pDate, typeOpe, exeEnvList);
    }
    console.log(typeOpe);
  });
  $('#languageDropDown').on('click', 'input', function () {
    $("#processNames").empty();
    if (this.checked) {
      langList.push(this.id)
      showProcesses(tagsinput, langList, pDate, typeOpe, exeEnvList);
    } else {
      const index = langList.indexOf(this.id);
      if (index > -1) {
        langList.splice(index, 1);
      }
      showProcesses(tagsinput, langList, pDate, typeOpe, exeEnvList);
    }
    console.log(langList);
  });
  $('#exeEnvDropdown').on('click', 'input', function () {
    $("#processNames").empty();
    if (this.checked) {
      exeEnvList.push(this.id)
      showProcesses(tagsinput, langList, pDate, typeOpe, exeEnvList);
    } else {
      const index = exeEnvList.indexOf(this.id);
      if (index > -1) {
        exeEnvList.splice(index, 1);
      }
      showProcesses(tagsinput, langList, pDate, typeOpe, exeEnvList);
    }
    console.log(exeEnvList);
  });
  $('#landmarkerDropdown').on('click', 'input', function () {
    $("#analyseNames").empty();
    if (this.checked) {
      landmarkerList.push(this.id)
      showStudies(tagsinput, typeRecherche, landmarkerList);
    } else {
      const index = landmarkerList.indexOf(this.id);
      if (index > -1) {
        landmarkerList.splice(index, 1);
      }
      showStudies(tagsinput, typeRecherche, landmarkerList);
    }
    console.log(landmarkerList);
  });

  //Event to get the date if changed for date filter
  $('#dsDate').change(function () {
    console.log($(this).val());
    dsDate = $(this).val();
    showDatabases(tagsinput, '', dsDate);
  });

  $('#pDate').change(function () {
    $("#processNames").empty();
    console.log($(this).val());
    pDate = $(this).val();
    showProcesses(tagsinput, langList, pDate);
  });


  //Event to show more filter on click
  $('#moreDS').on("click", function () {
    var display = $('#moreDSFilter')[0].style.display;
    if (display === "none") {
      $('#moreDSFilter')[0].style.display = "block";
    } else {
      $('#moreDSFilter')[0].style.display = "none";
    }
    return display;
  });

  $('#moreP').on("click", function () {
    var display = $('#morePFilter')[0].style.display;
    if (display === "none") {
      $('#morePFilter')[0].style.display = "block";
    } else {
      $('#morePFilter')[0].style.display = "none";
    }
    return display;
  });

  $('#moreA').on("click", function () {
    var display = $('#moreAFilter')[0].style.display;
    if (display === "none") {
      $('#moreAFilter')[0].style.display = "block";
    } else {
      $('#moreAFilter')[0].style.display = "none";
    }
    return display;
  });


  //Event to show or hide filters with button
  $('#qualityLevel').on("click", function () {
    var display = $('#qualityDropdown')[0].style.display;
    if (display === "none") {
      $('#qualityDropdown')[0].style.display = "block";
    } else {
      $('#qualityDropdown')[0].style.display = "none";
    }
    return display;
  });

  $('#programmationLanguage').on("click", function () {
    var display = $('#languageDropDown')[0].style.display;
    if (display === "none") {
      $('#languageDropDown')[0].style.display = "block";
      $('#languageInput')[0].style.display = "block";
    } else {
      $('#languageDropDown')[0].style.display = "none";
      $('#languageInput')[0].style.display = "none";
    }
    return display;
  });

  $('#usedOpe').on("click", function () {
    var display = $('#usedOpeDropdown')[0].style.display;
    if (display === "none") {
      $('#usedOpeDropdown')[0].style.display = "block";
    } else {
      $('#usedOpeDropdown')[0].style.display = "none";
    }
    return display;
  });

  $('#exeEnv').on("click", function () {
    var display = $('#exeEnvDropdown')[0].style.display;
    if (display === "none") {
      $('#exeEnvDropdown')[0].style.display = "block";
    } else {
      $('#exeEnvDropdown')[0].style.display = "none";
    }
    return display;
  });

  $('#landmarker').on("click", function () {
    var display = $('#landmarkerDropdown')[0].style.display;
    if (display === "none") {
      $('#landmarkerDropdown')[0].style.display = "block";
    } else {
      $('#landmarkerDropdown')[0].style.display = "none";
    }
    return display;
  });

  $('#parameter').on("click", function () {
    var display = $('#parameterDropdown')[0].style.display;
    if (display === "none") {
      $('#parameterDropdown')[0].style.display = "block";
    } else {
      $('#parameterDropdown')[0].style.display = "none";
    }
    return display;
  });

  $('#evaluation').on("click", function () {
    var display = $('#evaluationDropdown')[0].style.display;
    if (display === "none") {
      $('#evaluationDropdown')[0].style.display = "block";
    } else {
      $('#evaluationDropdown')[0].style.display = "none";
    }
    return display;
  });

  //Event to search a specific filter within a list filter
  $("#qualityInput").keyup(function () {
    var input, filter, ul, li, a, i;
    input = document.getElementById("qualityInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("qualityDropdown");
    a = div.getElementsByTagName("div");
    for (i = 0; i < a.length; i++) {
      txtValue = a[i].textContent || a[i].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        a[i].style.display = "";
      } else {
        a[i].style.display = "none";
      }
    }
  });

  $("#languageInput").keyup(function () {
    var input, filter, ul, li, a, i;
    input = document.getElementById("languageInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("languageDropDown");
    a = div.getElementsByTagName("tr");
    for (i = 0; i < a.length; i++) {
      txtValue = a[i].textContent || a[i].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        a[i].style.display = "";
      } else {
        a[i].style.display = "none";
      }
    }
  });

  $("#landmarkerInput").keyup(function () {
    var input, filter, ul, li, a, i;
    input = document.getElementById("landmarkerInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("landmarkerDropdown");
    a = div.getElementsByClassName("landmarkerList");
    for (i = 0; i < a.length; i++) {
      txtValue = a[i].textContent || a[i].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        a[i].style.display = "";
      } else {
        a[i].style.display = "none";
      }
    }
  });

  $("#evaluationInput").keyup(function () {
    var input, filter, ul, li, a, i;
    input = document.getElementById("evaluationInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("evaluationDropdown");
    a = div.getElementsByClassName("evaluationList");
    for (i = 0; i < a.length; i++) {
      txtValue = a[i].textContent || a[i].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        a[i].style.display = "";
      } else {
        a[i].style.display = "none";
      }
    }
  });

  $("#parameterInput").keyup(function () {
    var input, filter, ul, li, a, i;
    input = document.getElementById("parameterInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("parameterDropdown");
    a = div.getElementsByClassName("parameterList");
    for (i = 0; i < a.length; i++) {
      txtValue = a[i].textContent || a[i].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        a[i].style.display = "";
      } else {
        a[i].style.display = "none";
      }
    }
  });

  //Event to search within result of dataset or studies a specific entity linked to them
  $("#inputECANames").keyup(function () {
    $("#dbNames").empty();
    inputECAnames = document.getElementById("inputECANames");
    console.log(inputECAnames.value)
    showDatabases(tagsinput, "", dsDate, "", "", inputECAnames.value)
  });

  $("#algoNames").keyup(function () {
    $("#analyseNames").empty();
    algoNames = document.getElementById("algoNames");
    console.log(algoNames.value)
    showStudies(tagsinput, typeRecherche, landmarkerList, algoNames.value)
  });

  $("#omNames").keyup(function () {
    $("#analyseNames").empty();
    omNames = document.getElementById("omNames");
    console.log(omNames.value)
    showStudies(tagsinput, typeRecherche, landmarkerList, algoNames.value, omNames.value)
  });
});

//Function to get entity class by analyse and build a list fo result
async function showEntityClassByAnalyse(anUuid, anName) {
  $("#EntityClassNames").empty()
  api.getEntityClassByAnalyse(anName, anUuid).then(ec => {
    $listEc = $("#EntityClassNames")
    for (var i = 0; i < ec.length; i++) {
      if (optionEntityClass.indexOf(ec[i].name) === -1) {
        entityClassList.push(ec[i])
        $listEc.append("<tr><td class='EntityClass' id='" + ec[i].name + "$" + anUuid + "$" + anName + "'>" + ec[i].name + "</td></tr>")
        optionEntityClass.push(ec[i].name)
      }
    }
  }, 'json')
}

//Function to get entity class by dataset and build a list fo result
async function showEntityClassByDataset(dsId, dsName, typeDS) {
  $("#EntityClassNames").empty()
  api.getEntityClassByDataset(dsName, dsId, typeDS).then(ec => {
    optionEntityClass = [];
    $listEc = $("#EntityClassNames")
    for (var i = 0; i < ec.length; i++) {
      if (optionEntityClass.indexOf(ec[i].name) === -1) {
        entityClassList.push(ec[i])
        $listEc.append("<tr><td class='EntityClass' id='" + dsName + "$" + dsId + "$" + typeDS + "'>" + ec[i].name + "</td></tr>")
        optionEntityClass.push(ec[i].name)
      }
    }
  }, 'json')
}

//Function to get relationship value between two dataset
async function getAnalysisRelationshipDS(ds1Uuid, ds2uuid, name, dsName, ds2Name ,mapRelationAttDS, resolve) {
  api
    .getRelationshipDSAnalysisbyDataset(ds1Uuid, ds2uuid, name)
    .then(p => {
      if (p !== undefined && p.length > 0) {
        console.log('key : ' + dsName + '&' + ds2Name + '&' + name + ' ||| value : ' + p[0].value)
        mapRelationAttDS.set(dsName + '&' + ds2Name + '&' + name, p[0].value)
      } else {
        mapRelationAttDS.set(nameAtt + '&' + nameAtt2 + '&' + name, '');
      }
      if (resolve !== undefined) {
        resolve();
      }
    }, 'json')
}

//Function to get all dataset linked by a relation with the target
async function getDatasetOfRelationship(dsName, dsId, relationlist) {
  var promisesDS = [];
  var mapRelationAttDS = new Map;
  api
    .getRelationshipDSbyDataset(dsName, dsId, 'Dataset', relationlist)
    .then(p => {
      $listHead = $('#dataset_' + relationlist)
      console.log($listHead)
      for (var i = 0; i < p.length; i++) {
        if (p[i].uuid != dsId) {
          promisesDS.push(new Promise ((resolve, reject) => {getAnalysisRelationshipDS(p[i].uuid, dsId, $listHead.closest('div').attr('id'), dsName, p[i].name,mapRelationAttDS, resolve); }));
          
        }
      }
      Promise.all(promisesDS).then(() => {
        console.log('Promise finit : ' + mapRelationAttDS.size);
        for (var [key, value] of mapRelationAttDS) {
          console.log('HashMap : ' + key + ' = ' + value)
          $listBody = $('#dataset_' + key.split('&')[2])
          if (value) {
            $listBody.append('<p>' + key.split('&')[0] + ' - ' + key.split('&')[1] + ' : ' + value + '</p>')
          }
        }
      });
    }, 'json')
}

//Function to get relationship value between two attribute
async function getAnalysisRelationshipAtt(idsource, nameAtt, relationName, nameAtt2, mapRelationAtt, resolve) {
  var timestamp = Date.now();
  api
    .getRelationshipAttribute(idsource, nameAtt, 'relationValue', relationName, nameAtt2)
    .then(p => {
      if (p !== undefined && p.length > 0) {
        console.log('key : ' + nameAtt + '&' + nameAtt2 + '&' + relationName + ' ||| value : ' + p[0].value)
        mapRelationAtt.set(nameAtt + '&' + nameAtt2 + '&' + relationName, p[0].value)
      } else {
        mapRelationAtt.set(nameAtt + '&' + nameAtt2 + '&' + relationName, '');
      }
      if (resolve !== undefined) {
        resolve();
      }
    }, 'json')
}

//Function to get all attribute linked by a relation with the target
async function getAnalyseOfRelationship(id, relationlist) {
  var promises = [];
  var mapRelationAtt = new Map;
  api
    .getRelationshipAttribute(id, '', 'analyse', relationlist)
    .then(p => {
      $listBody = $('#attribute_' + relationlist)
      for (var i = 0; i < p.length; i++) {
        for (var j = i; j < p.length; j++) {
          if (p[j].name != p[i].name) {
            promises.push(new Promise((resolve, reject) => { getAnalysisRelationshipAtt(id, p[i].name, $listBody.closest('div').attr('id'), p[j].name, mapRelationAtt, resolve) }));
          }
        }
      }

      Promise.all(promises).then(() => {
        console.log('Promise finit : ' + mapRelationAtt.size);
        for (var [key, value] of mapRelationAtt) {
          //console.log('HashMap : ' + key + ' = ' + value)
          $listBody = $('#attribute_' + key.split('&')[2])
          if (value) {
            $listBody.append('<p>' + key.split('&')[0] + ' - ' + key.split('&')[1] + ' : ' + value + '</p>')
          }
        }
      });
    }, 'json')
}

//function to create a list of filter
function usedOpeInit() {
  api.getOperations().then(p => {
    var $list = $("#usedOpeDropdown")
    for (var i = 0; i < p.length; i++) {
      $list.append("<div class='usedOpeList'> <input type='checkbox' classe='usedOperation' name='usedOpe" + p[i].name + "' id='" + p[i].name + "' '><label for='usedOpe" + p[i].name + "'>" + p[i].name + "</label></div>")
    }
  }, "json");
}

//function to create a list of filter
function landmarkersInit(study = 'default') {
  api.getLandmarkers(study).then(p => {
    $("#landmarkerDropdown div").each(function () { if (optionLandmarkerList.indexOf($(this).text()) === -1) { optionLandmarkerList.push($(this).text()) } });
    var $list = $("#landmarkerDropdown")
    for (var i = 0; i < p.length; i++) {
      if (!optionLandmarkerList.includes(" " + p[i].name)) {
        $list.append("<div class='landmarkerList'> <input type='checkbox' classe='landmarkers' name='landmarker$" + p[i].name + "' id='" + p[i].name + "' '><label for='landmarker$" + p[i].name + "'>" + p[i].name + "</label></div>")
      }
    }
  }, "json");
}

//function to create a list of filter
function parameterInit(study = 'default') {
  api.getParameter(study).then(p => {
    $("#parameterDropdown div").each(function () { if (optionParameterList.indexOf($(this).text()) === -1) { optionParameterList.push($(this).text()) } });
    var $list = $("#parameterDropdown")
    for (var i = 0; i < p.length; i++) {
      if (!optionParameterList.includes(" " + p[i].name)) {
        $list.append("<div class='parameterList'> <input type='checkbox' classe='parameter' name='parameter$" + p[i].name + "' id='" + p[i].name + "' '><label for='parameter$" + p[i].name + "'>" + p[i].name + "</label></div>")
      }
    }
  }, "json");
}

//function to create a list of filter
function evaluationInit(study = 'default') {
  api.getEvaluation(study).then(p => {
    $("#evaluationDropdown div").each(function () { if (optionEvaluationList.indexOf($(this).text()) === -1) { optionEvaluationList.push($(this).text()) } });
    var $list = $("#evaluationDropdown")
    for (var i = 0; i < p.length; i++) {
      if (!optionEvaluationList.includes(" " + p[i].name)) {
        $list.append("<div class='evaluationList'> <input type='checkbox' classe='evaluation' name='evaluation$" + p[i].name + "' id='" + p[i].name + "' '><label for='evaluation$" + p[i].name + "'>" + p[i].name + "</label></div>")
      }
    }
  }, "json");
}

//function to create a list of filter
function languageProcessInit(tagsinput, language = "", date = "0001-01-01", type = []) {
  api.getProcesses(tagsinput, language, date, type).then(p => {
    if (p) {
      $("#languageDropDown").empty()
      var $list2 = $("#languageDropDown");
      var listLanguage = [];
      for (var i = 0; i < p.length; i++) {
        if (listLanguage.indexOf(p[i].programmationLanguage) === -1) {
          $list2.append($("<div class='languageList'> <input type='checkbox' classe='language' name='language" + p[i].programmationLanguage + " ' id='" + p[i].programmationLanguage + "'> <label for='language" + p[i].programmationLanguage + "'>" + p[i].programmationLanguage + "</label></div>"));
          listLanguage.push(p[i].programmationLanguage)
        }
      }
    }
  }, "json");
}

//function to create a list of filter
function excutionEnvironmentInit(tagsinput, language = "", date = "0001-01-01", type = [], execuEnv = []) {
  api.getProcesses(tagsinput, language, date, type, execuEnv).then(p => {
    if (p) {
      $("#exeEnvDropdown").empty()
      var $list2 = $("#exeEnvDropdown");
      var listexeEnv = [];
      for (var i = 0; i < p.length; i++) {
        if (listexeEnv.indexOf(p[i].executionEnvironment) === -1) {
          $list2.append($("<div class='languageList'> <input type='checkbox' classe='language' name='language" + p[i].executionEnvironment + " ' id='" + p[i].executionEnvironment + "'> <label for='language" + p[i].executionEnvironment + "'>" + p[i].executionEnvironment + "</label></div>"));
          listexeEnv.push(p[i].executionEnvironment)
        }
      }
    }
  }, "json");
}

//Function to get process
function showProcesses(tags, language = "", date = "0001-01-01", type = [], execuEnv = []) {
  api
    .getProcesses(tags, language, date, type, execuEnv)
    .then(p => {
      if (p) {
        //var $list = $(".names").empty();
        var $list = $("#processNames")
        for (var i = 0; i < p.length; i++) {
          $list.append($("<tr><td class='Process' id='" + p[i].name + "$" + p[i].id + "'>" + p[i].name + "</td></tr>"));
        }
        console.log('nb items liste : ' + p.length)
      }
    }, "json");
}

//fucnction to get studies
function showStudies(tags, type = '', landmarker = '', algoNames = '', omNames = '') {
  api
    .getStudies(tags, type, landmarker, algoNames, omNames = '')
    .then(p => {
      if (p) {
        //var $list = $(".names").empty();
        var $list = $("#analyseNames")
        var landList = []
        for (var i = 0; i < p.length; i++) {

          $list.append($("<tr><td class='Study'>" + p[i].name + "</td></tr>"));
          if (!landList.includes(p[i].name)) {
            parameterInit(p[i])
            evaluationInit(p[i]);
            landmarkersInit(p[i]);
            landList.push(p[i].name);
          }
        }
        console.log('nb items liste : ' + p.length)
      }
    }, "json");
}

//function to get dataset
function showDatabases(tags, type = 'defaultValue', date = '0001-01-01', quality = "", sensitivity = "", ECANames = "") {
  api
    .getDatabases(tags, type, date, quality, sensitivity, ECANames)
    .then(p => {
      if (p) {
        //var $list = $(".names").empty();
        var $list = $("#dbNames")
        for (var i = 0; i < p.length; i++) {
          $list.append($("<tr><td class='Database' id='" + p[i].type + "$" + p[i].name + "$" + p[i].uuid + "'>" + p[i].name + "</td></tr>"));
        }
        console.log('nb items liste : ' + p.length)
      }
    }, "json");
}


//Fucntion to init graph interface
function draw() {
  var config = {
    container_id: "viz",
    server_url: "bolt://localhost",
    server_user: "neo4j",
    server_password: pwd.password,
    labels: {
      "Process": {
        caption: "name",
        font: {
          "size": 26,
          "color": "#000000"
        },
      },

      "DLStructuredDataset": {
        caption: "name",
      },

      "sourceData": {
        caption: "name",
      },

      "AnalysisEntityClass": {
        caption: "name",
      },

      "DLStructuredDataset": {
        caption: "name",
      },
      "Study": {
        caption: "name",
      },
      "EntityClass": {
        caption: "name",
      }
    },
    arrows: true
  }

  viz = new NeoVis.default(config);
  viz.render();
}

function draw2() {
  var config = {
    container_id: "viz2",
    server_url: "bolt://localhost",
    server_user: "neo4j",
    server_password: pwd.password,
    labels: {
      "Process": {
        caption: "name",
        font: {
          "size": 26,
          "color": "#000000"
        },
      },

      "DLStructuredDataset": {
        caption: "name",
      },

      "sourceData": {
        caption: "name",
      },

      "AnalysisEntityClass": {
        caption: "name",
        font: {
          "size": 26,
          "color": "#7be141"
        },
      },

      "DLStructuredDataset": {
        caption: "name",
      },

      "EvaluationMeasure": {
        caption: "name",
        font: {
          "size": 26,
          "color": "#d2e5ff"
        },
      },

      "ModelEvaluation": {
        caption: "value",
        font: {
          "size": 26,
          "color": "#ab83e1"
        },
      },

      "Landmarker": {
        caption: "name",
      },

      "Implementation": {
        caption: "name",
      },

      "AlgoSupervised": {
        caption: "name",
      },

      "Study": {
        caption: "name",
      },

      "Parameter": {
        caption: "name",
        font: {
          "size": 25,
          "color": "##f87d7f"
        },
      },

      "ParameterSetting": {
        caption: "value",
        font: {
          "size": 25,
          "color": "#e87cf1"
        },
      }
    },
    arrows: true
  }
  viz2 = new NeoVis.default(config);
  viz2.render();
}

function draw3() {
  var config = {
    container_id: "viz3",
    server_url: "bolt://localhost",
    server_user: "neo4j",
    server_password: pwd.password,
    labels: {
      "Process": {
        caption: "name",
        font: {
          "size": 26,
          "color": "#000000"
        },
      },

      "Operation": {
        caption: "name",
      },

      "OperationOfProcess": {
        caption: "label",
      }
    },
    arrows: true
  }
  viz3 = new NeoVis.default(config);
  viz3.render();
}

function draw4() {
  var config = {
    container_id: "viz4",
    server_url: "bolt://localhost",
    server_user: "neo4j",
    server_password: pwd.password,
    labels: {
      "RelationshipDS": {
        caption: "name",
      },
      "AnalysisDSRelatinship": {
        caption: "value",
      },
      "DLStructuredDataset": {
        caption: "name",
      },
      "DLSemistructuredDataset": {
        caption: "name",
      },
      "DLUnstructuredDataset": {
        caption: "name"
      }
    },
    arrows: true
  }
  viz4 = new NeoVis.default(config);
  viz4.render();
}
function draw5() {
  var config = {
    container_id: "viz5",
    server_url: "bolt://localhost",
    server_user: "neo4j",
    server_password: pwd.password,
    labels: {
      "NominalAttribute": {
        caption: "name",
      },
      "AnalysisAttribute": {
        caption: "value",
      },
      "NumericAttribute": {
        caption: "name",
      },
      "RelationshipAtt": {
        caption: "name",
      },
      "DLUnstructuredDataset": {
        caption: "name"
      }
    },
    arrows: true
  }
  viz5 = new NeoVis.default(config);
  viz5.render();
}
  