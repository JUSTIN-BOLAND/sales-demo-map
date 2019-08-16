
var clusterButton = document.getElementById("clusterButton");                              //Button to enable or disable clusters
var heatButton = document.getElementById("heatButton");                                    //Button to enable or disable heatmap
var heatActive = false;                                                                    //Boolean to check if heat layer is active
var pulsating = true;
$.getJSON('https://api.sheety.co/d1d52423-9f56-40da-bfcf-f1cd314dacbc', function(json) {   //retrieveing spreadsheet data as JSON from sheety API
    addPoints(json);
});

/**
Creating map and adding tile layer
*/
var map = L.map('map', {zoomControl: true}).setView([35, -99], 4);
var scaleBar = L.control.scale({imperial: true, metric: false, position: 'bottomright'}).addTo(map);
var ruler = L.control.ruler({position: 'topright', lengthUnit: {display: 'miles',              // This is the display value will be shown on the screen. Example: 'meters'
    decimal: 2,                 // Distance result will be fixed to this value. 
    factor: 0.621373,               // This value will be used to convert from kilometers. Example: 1000 (from kilometers to meters)  
    label: 'Distance:'}}).addTo(map);
map.zoomControl.setPosition('bottomright');
var tonerLayer = new L.StamenTileLayer("toner-lite");
map.addLayer(tonerLayer);




var pointGroupLayer;                                                                           //stores the points created. Useful for zooming to only points present in the map
	
	
	
function addPoints(data) {
	if (pointGroupLayer != null) {
		pointGroupLayer.remove();
	}
	
	
	var clusters;                                                                                 //Will be used as layer where the clusters will be stored
	var clusterZoom = 18;                                                                         //Variable to store the maxZoomLevel for the clusters. Used to disable (clusterZoom=1) or enable clusters (clusterZoom=18)
	pointGroupLayer = L.featureGroup();
	
	var clicks = 0; //click counter for filters. Useful to avoid errors referencing layers that have not been created yet
	var heat;                                                                                    // Heatmap layer                          
	var filtered = new Array();                                                                  //Array that stores only the filtered data after applying filters
	var summaryPoints = new Array();                                                             //array with that are inside of the drawn polygon
	drawPoints();  //draws client points for the first time
	var drawnItems = new L.FeatureGroup();                                                       //Layer that stores the drawn polygons
	
	//variables used in summary----------
				var totTier1 = 0;
				var totTier2 = 0;
				var totTier3 = 0;
				var totTier4 = 0;
				var noTier = 0;
				var totLow = 0;
				var totMod = 0;
				var totHigh = 0;
				var noPotential = 0;
				var sales2017 = 0;
				var avg2017 = 0;
				var sales2018 = 0;
				var avg2018 = 0;
				var mah = 0;
				var inpex = 0;
				var toth12018 = 0;
				var toth12019 = 0;
				
				var h1trend = 0;
				
	//end variables in summary----------
	
	var dialog;                                                                               //dialog box that shows the summary
	var drawnAmount = 0;                                                                      //Variable to check if something has been drawn
    
    function drawPoints(){                                                        //function to draw points. Called whenever filters are applied or heatmap or clusters are enabled and disabled.
		
		/**
		Section to clean out layers and redraw them after
		*/
		if (clicks > 0){clusters.clearLayers(); map.removeLayer(clusters);}     
		if (heatActive ===true){
				map.removeLayer(heat);
			}
		clusters = L.markerClusterGroup({ disableClusteringAtZoom: clusterZoom });
	
		var markers = [];
		coordsHeat = []; //Empties the array of points(coordinates) used to create heatmap
	
			clicks++;
		//filters---------------
		tierfilter = [];
		potentialfilter = [];
		trendfilter = [];
		inpexfilter = [];
		ownerfilter = [];
		
		
		/**
		 * INPEX/MAH filter
		 */
		var flagInpex = $('[name="inpexmah"][value="INPEx"]:checked').length;
		var flagMah   = $('[name="inpexmah"][value="MAH"]:checked').length;
		function inpexFilter(element) {
			var filtered = false;
            if (flagInpex && ( element.inpex_mah=="INPEx" )) {
                filtered = true;
            }
            if (flagMah && ( element.inpex_mah=="MAH" )) {
                filtered = true;
            }
            return filtered;
		} 
				
		/**
		 * Filters the points within INPEX with names selected
		 */
		function ownerFilter(element) {            
			var filtered = true; // by default accept all nodes

			// only filter if node is INPEX (not MAH)
            if (flagInpex && ( element.inpex_mah=="INPEx" )) {
				filtered = false;
				$('[name="clients"]:checked').each(function(i, e) { 
					var name = $(e).val(); 	
					if (element.inpex_ao == name) {
						filtered = true;
					}
				});
			}
			return filtered;
		}
		
		 //--------tier filter-----
		$("input:checkbox[name='tier']:checked").each(function(){
			if($(this).val() === "null"){tierfilter.push(null);}
			else{
			tierfilter.push($(this).val());}});
			
		function tierFilter(element) {
			var valid = tierfilter;
			return (valid.includes(element.tier));
		}
			//-----growth potential filter----
		$("input:checkbox[name='potential']:checked").each(function(){ 
			if($(this).val() === "null" || $(this).val() === "N/A"){potentialfilter.push(null);}
			else{
			potentialfilter.push($(this).val());}});
				
		function potentialFilter(element) {
			var valid = potentialfilter;
			return (valid.includes(element.sales_potential));
		}
			//-----sales trend filter----
		$("input:checkbox[name='trend']:checked").each(function(){ 
			if($(this).val() === "null" || $(this).val() === "N/A"){trendfilter.push(null);}
			else{
			trendfilter.push($(this).val());}});
				
		function trendFilter(element) {
			var valid = trendfilter;
			return (valid.includes(element.trend));
		}
		
		//Applying filters
		filtered = data.filter(tierFilter);
		filtered = filtered.filter(potentialFilter);
		filtered = filtered.filter(trendFilter);
		filtered = filtered.filter(inpexFilter);
		filtered = filtered.filter(ownerFilter);
		
		
		
		//--------------------------------------------------
		//-----------------------Loop to create and draw the points, clusters and heatmap-------------------------------
		for(var row = 0; row < filtered.length; row++) {
			if (filtered[row].lat > 0){
					
					if(filtered[row].tier != null){var index = filtered[row].tier.indexOf(" ");
					var tier_no = filtered[row].tier.substr(index + 1);}else{var tier_no = "0"}
					tier_no = parseInt(tier_no);
					
					
					coordsHeat.push([filtered[row].lat, filtered[row].lon]);
					var marker = L.marker([filtered[row].lat, filtered[row].lon]).addTo(pointGroupLayer);
					//create and add popup to marker:
					var h2018 = 0;
					var h2019 = 0;
					var trend=0;
					if (filtered[row].h1_2018 != null){h2018 = parseFloat((filtered[row].h1_2018).toString().replace(/,/g, ''));}
					if (filtered[row].h1_2019 != null){h2019 = parseFloat((filtered[row].h1_2019).toString().replace(/,/g, ''));}
					if (h2018 != 0){trend = (h2019 - h2018)*100/h2018;}else if (h2018 == 0 && h2019 != 0){trend = 100;}
					
					marker.bindPopup("<dl>" + "<h2>Account Information</h2><dt>Account Name </dt><dd>" + filtered[row].client + "</dd><dt>Address </dt><dd>"+ filtered[row].address+  "</dd><dt>2018 Sales </dt><dd>$" + numeral(filtered[row].sales_2018).format('0,0') + "</dd><dt>Sales Segment </dt><dd>" +tier_no+ "</dd><dt>Growth Potential </dt><dd>" +  filtered[row].sales_potential +"</dd><dt>H1 2018</dt><dd>$"+numeral(filtered[row].h1_2018).format('0,0')+"</dd><dt>H1 2019</dt><dd>$"+numeral(filtered[row].h1_2019).format('0,0')+"</dd><dt>Sales Trend </dt><dd>" + trend.toFixed(2) +"%</dd><dt>Trend Category</dt><dd>" + filtered[row].trend+"</dd><dt>Account Owner</dt><dd>"+filtered[row].account_owner+ "</dd><dt>INPEx AO</dt><dd>"+filtered[row].inpex_ao+ "</dd></dl>", 
					{
					maxWidth: 390,
					maxHeight: 700
					
					}); 
					
					clusters.addLayer(marker);
					map.addLayer(clusters);
					
					var trendCategory;
					
					
					/**
					---------------------Conditions to change svg icon colors according to attributes for the client--------------------
					*/
					if(filtered[row].trend === "Extreme Growth (50+)" || filtered[row].trend === "Major Growth (20 to 49)" || filtered[row].trend ===  "Moderate Growth (5 to 19)"){trendCategory = 'Growing';}
					else if(filtered[row].trend === "Moderate Loss (-19 to -5)" || filtered[row].trend === "Major Loss (-49 to -20)" || filtered[row].trend === "Extreme Loss (-50+)"){trendCategory = 'Declining';}
					else{trendCategory="";}
					
					if (filtered[row].sales_potential === "Low"){
						var color = "MediumOrchid";
					}
					else if (filtered[row].sales_potential === "Moderate"){
						var color = "LightSkyBlue";
					}
					else if (filtered[row].sales_potential === "High"){
						var color = "PeachPuff";
					}
					else{
						var color = "white";
					}
					
					var pulse;
					var pulsation;
					if (pulsating === true){
						pulsation = 'r="63" stroke="blue" stroke-width="8"><animate attributeName="r" from="49" to="63" dur="1.8s" begin="0s" repeatCount="indefinite"/><animate attributeName="opacity" from="1" to="0" dur="1.8s" begin="0s" repeatCount="indefinite"/>';
						//pulsating = !pulsating;
					}
					else{
						pulsation = 'r="52" stroke="blue" stroke-width="8">';
					}
					if (filtered[row].inpex_mah === "MAH"){
						pulse = '<circle cx="64" cy="67" fill="none" '+pulsation+'</circle>';
						
					}
					else{
						
						var clientColor;
						switch (filtered[row].inpex_ao){
							case "Annmarie DeSilva":
								clientColor = "#6BCEAB";
								break;
							case "Dawn Hickman":
								clientColor = "#C4C14E";
								break;
							case "Doreen Gonzalez":
								clientColor = "#8B7FD4";
								break;
							case "Gerri Wunder":
								clientColor = "#C75874";
								break;
							case "Jessica Merritt":
								clientColor = "#BF6240";
								break;
							case "Karen McBeth":
								clientColor = "#D09E71";
								break;
							case "Kelli Manderscheid":
								clientColor = "#1C3C54";
								break;
							case "Michelle Vibonese":
								clientColor = "#53C679";
								break;
							case "Tabitha Fallin":
								clientColor = "#8D2F32";
								break;
							
							default:
								clientColor = "#ffffff00";
						}
						pulse = '<circle cx="64" cy="67" fill="none" r="63" stroke="'+clientColor+'" stroke-width="8"><animate attributeName="r" from="52" to="52" dur="1.8s" begin="0s" repeatCount="indefinite"/><animate attributeName="opacity" from="1" to="0" dur="2s" begin="0s" repeatCount="indefinite"/></circle>';
						}
					
					if (trendCategory === "Growing"){
						var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="500" viewBox="-5 0 130 130"><polygon fill="'+color+'" stroke="black" stroke-width="3" points="64,36,39,86,88,86" />'+pulse+'<circle cx="64" cy="67" r="33" stroke="green" stroke-width="5" fill="transparent" /><text x="64" y="79" text-anchor="middle" fill="black" font-weight="normal" font-size="38">'+tier_no+'</text></svg>';
					}
					else if (trendCategory === "Declining"){
						var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="500" viewBox="-5 0 130 130"><polygon fill="'+color+'" stroke="black" stroke-width="3" points="64,36,39,86,88,86" />'+pulse+'<circle cx="64" cy="67" r="33" stroke="red" stroke-width="5" fill="transparent" /><text x="64" y="79" text-anchor="middle" fill="black" font-weight="normal" font-size="38">'+tier_no+'</text></svg>';
					}
					else if (filtered[row].trend === "No Growth (-4 to 4)"){
						var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="500" viewBox="-5 0 130 130"><polygon fill="'+color+'" stroke="black" stroke-width="3" points="64,36,39,86,88,86" />'+pulse+'<circle cx="64" cy="67" r="33" stroke="orange" stroke-width="5" fill="transparent" /><text x="64" y="79" text-anchor="middle" fill="black" font-weight="normal" font-size="38">'+tier_no+'</text></svg>';
					}
					else{
						var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="500" viewBox="-5 0 130 130"><polygon fill="'+color+'" stroke="black" stroke-width="3" points="64,36,39,86,88,86" />'+pulse+'<circle cx="64" cy="67" r="33" stroke="black" stroke-width="0" fill="transparent" /><text x="64" y="79" text-anchor="middle" fill="black" font-weight="normal" font-size="38">'+tier_no+'</text></svg>';
					}
					var iconUrl = 'data:image/svg+xml;base64,' + btoa(svg);
					
					var icon = L.icon({
					  iconUrl: iconUrl,
					  iconSize: [38, 38],
					  iconAnchor: [19, 19]
					});
	
					
					marker.setIcon(icon);
					
					}	 
					
					
				}
				
				if (heatActive === true && coordsHeat.length > 0){heat = L.heatLayer(coordsHeat, {minOpacity: 0.4}).addTo(map);}
				
							
    }
			
			 
			 map.addLayer(drawnItems);                                      //adds drawn polygon
			 
			 L.drawLocal.draw.toolbar.buttons.polygon = 'Draw a polygon!';   //Message appearing when hvoering over the draw polygon button
			 
			 
			 var drawControl = new L.Control.Draw({                         //creates the draw control
				position: 'topright',
				 draw: {polyline: false, marker: false, circle: false, circlemarker: false},  //only allowed the polygon and rectangle options
				 edit: {
					 featureGroup: drawnItems,
					 remove: true
				 }				 
			 });
			 
			 map.addControl(drawControl);                                    //adds the draw controls to the map
			
			
			//function for new created polygons. Deletes previous polygon and creates new one
			
			function getWithin(e){
					//resetting variables used in summary
				totTier1 = 0;
				totTier2 = 0;
				totTier3 = 0;
				totTier4 = 0;
				totLow = 0;
				totMod = 0;
				totHigh = 0;
				noTier = 0;
				noPotential = 0;
				sales2017 = 0;
				sales2018 = 0;
				mah = 0;
				inpex = 0;
				toth12019 = 0;
				toth12018 = 0;
				h1trend=0;
				
				
				if (dialog != undefined){dialog.destroy();}                 //removes previous dialog box when a new one is created
				
				//------END variables in summary----------
				
				drawnAmount =1;
				summaryPoints=[];                                          //this array stores the data of points within the drawn polygon to allow download as excek file. 
				 
			//Loop to store client data inside drawn polygon	
				 for(var row = 0; row < filtered.length; row++) {
					if (filtered[row].lat>0){
						var ptsTurf = turf.point([filtered[row].lon, filtered[row].lat]);
						
						var poly = drawnItems.toGeoJSON();
						
						if(turf.booleanWithin(ptsTurf, poly.features[0]) === true){
							summaryPoints.push(filtered[row]);
							//assign values to variables for summary
							if (filtered[row].tier === "Tier 1"){totTier1++;}
							if (filtered[row].tier === "Tier 2"){totTier2++;}
							if (filtered[row].tier === "Tier 3"){totTier3++;}
							if (filtered[row].tier === "Tier 4"){totTier4++;}
							if (filtered[row].tier === null || filtered[row].tier === "N/A"){noTier++;}
							if (filtered[row].sales_potential === null || filtered[row].sales_potential === "N/A"){noPotential++;}
							if (filtered[row].sales_potential === "Low"){totLow++;}
							if (filtered[row].sales_potential === "Moderate"){totMod++;}
							if (filtered[row].sales_potential === "High"){totHigh++;}
							if (filtered[row].inpex_mah === "MAH"){mah++;}
							if (filtered[row].inpex_mah === "INPEx"){inpex++;}
							
							if(filtered[row].sales_2017 != null){sales2017 += parseFloat((filtered[row].sales_2017).toString().replace(/,/g, ''));}
							if(filtered[row].sales_2018 != null){sales2018 += parseFloat((filtered[row].sales_2018).toString().replace(/,/g, ''));}
							
							if(filtered[row].h1_2018 != null){toth12018 += parseFloat((filtered[row].h1_2018).toString().replace(/,/g, ''));}
							if(filtered[row].h1_2019 != null){toth12019 += parseFloat((filtered[row].h1_2019).toString().replace(/,/g, ''));}
						}
						
					}
				}
				
				avg2017 = sales2017/(summaryPoints.length);
				avg2018 = sales2018/(summaryPoints.length);
				
				
				if(toth12018 != 0){h1trend = (toth12019 - toth12018)*100/toth12018;} else if (toth12018 == 0 && toth12019 != 0){h1trend = 100;}
				
				//display dialog box summary
				dialog = L.control.dialog({size: [410, 645], maxSize: [410, 600], anchor: [0, 250]})
                 .setContent("<dl class='summary'><h2>INPEx/MAH</h2><dt>No. of INPEx accounts</dt>"+inpex+"<dt>No. of MAH accounts</dt><dd>"+mah+"</dd><h2>Sales Segment</h2><dt>No. of Segment 1 accounts</dt><dd>"+totTier1+"</dd><dt>No. of Segment 2 accounts</dt><dd>"+totTier2+"</dd><dt>No. of Segment 3 accounts</dt><dd>"+totTier3+"</dd><dt>No. of Segment 4 accounts</dt><dd>"+totTier4+"</dd><dt>No. of accounts with no segment</dt><dd>"+noTier+"</dd><h2>Growth Potential</h2><dt>Low</dt><dd>"+totLow+"</dd><dt>Moderate</dt><dd>"+totMod+"</dd><dt>High</dt><dd>"+totHigh+"</dd><dt>Without growth info</dt><dd>"+noPotential+"</dd><h2>Sales</h2><dt>Total sales 2018</dt><dd>$"+numeral(sales2018).format('0,0')+"</dd><dt>Average sales 2018</dt><dd>$"+numeral(avg2018.toFixed(2)).format('0,0')+"</dd><dt>H1'2018</dt><dd>$"+numeral(toth12018).format('0,0')+"</dd><dt>H1'2019</dt><dd>$"+numeral(toth12019).format('0,0')+"</dd><dt>H1 Trend</dt><dd>"+h1trend.toFixed(2)+"%"+"</dd></dl><div style='text-align: center;'><button id='download'>Download selected</button></div>")
			    .addTo(map);
			    dialog.hideResize();
				
			    document.getElementById("download").addEventListener("click", downloadExcel);
				function downloadExcel(){
					var xls = new xlsExport(summaryPoints, 'title');
					 xls.exportToXLS('export.xls')
				};
				
				 
			};
			map.on('draw:created', function (e){
				map.removeLayer(drawnItems); drawnItems.clearLayers(); drawnItems.addLayer(e.layer); 
				// Each time a feaute is created, it's added to the over arching feature group
				 map.addLayer(drawnItems);
				 getWithin(e);
			
			});
			
			map.on('draw:edited', getWithin);
				
			map.fitBounds(pointGroupLayer.getBounds());	 //changes the view and zoom to capture all the created points
			
			
			/**
				Following section has the functions for the filter checkboxes, radioboxes and also the buttons to enable/disable heatmaps and clusters
			*/
			$('input[name="tier"]').click(function(e){
				drawPoints();
				$('input[name="radiotier"]').prop('checked', false);
				if (drawnAmount>0){ getWithin(e);}});
			
			$('input[name="potential"]').click(function(e){
				drawPoints();
				$('input[name="radiopotential"]').prop('checked', false);
				if (drawnAmount>0){ getWithin(e);}});
			
			$('input[name="trend"]').click(function(e){
				drawPoints();
				$('input[name="radiotrend"]').prop('checked', false);
				if (drawnAmount>0){ getWithin(e);}});
			
			$('input[name="inpexmah"]').click(function(e){
				drawPoints();
				if(this.attributes["value"].value === "INPEx"){ document.getElementById("inpexNest").classList.toggle("unactive");}
				if (drawnAmount>0){ getWithin(e);}});
			
			$('input[name="clients"]').click(function(e){
				drawPoints();
				$('input[name="radioclients"]').prop('checked', false);
				if (drawnAmount>0){ getWithin(e);}});
						
			
			$('input[name="pulsation"]').click(function(e){
				pulsating = !pulsating;
				drawPoints();
				if(pulsating===false){
					var circleLegend = document.getElementById("animateradius");
					circleLegend.setAttribute("from", "30");
					circleLegend.setAttribute("to", "30");
					var circleOpacit = document.getElementById("animateopacity");
					circleOpacit.setAttribute("to", "1");
				}
				else{
					var circleLegend = document.getElementById("animateradius");
					circleLegend.setAttribute("from", "28");
					circleLegend.setAttribute("to", "32");
					var circleOpacit = document.getElementById("animateopacity");
					circleOpacit.setAttribute("to", "0");
				}
				
				});
				
			
			
			
			$('input[value="UnselectAll"]').click(function(e){
				switch(this.attributes["name"].value){
					case "radiotier":
						$('input[name="tier"]').prop('checked', false);
						break;
					case "radiotrend":
						$('input[name="trend"]').prop('checked', false);
						break;
					case "radioclients":
						$('input[name="clients"]').prop('checked', false);
						
						break;
					default:
						$('input[name="potential"]').prop('checked', false);
				}
				
				
				drawPoints();
			});
			
			$('input[value="SelectAll"]').click(function(e){
				switch(this.attributes["name"].value){
					case "radiotier":
						$('input[name="tier"]').prop('checked', true);
						break;
					case "radiotrend":
						$('input[name="trend"]').prop('checked', true);
						break;
					case "radioclients":
						$('input[name="clients"]').prop('checked', true);
						break;
					default:
						$('input[name="potential"]').prop('checked', true);
				}
				drawPoints();
			});
			
			clusterButton.addEventListener("click", function(e){
				clusterZoom = (clusterZoom === 18) ? 0 : 18;
				drawPoints();
				console.log(clusterZoom);
			});
			heatButton.addEventListener("click", function(e){
				if (coordsHeat.length > 0 && heatActive===false){heat = L.heatLayer(coordsHeat, {minOpacity: 0.4}).addTo(map);}
				if (heatActive===true){map.removeLayer(heat);}
				heatActive = !heatActive;
				console.log(heatActive);
			});
			
			
			//
			drawnItems.on('click', function(e) { //show dialog box when polygon is clicked
				if (dialog != undefined){dialog.destroy();}
				dialog = L.control.dialog({size: [410, 645], maxSize: [400, 400], anchor: [0, 250]})
                .setContent("<dl class='summary'><h2>INPEx/MAH</h2><dt>No. of INPEx accounts</dt>"+inpex+"<dt>No. of MAH accounts</dt><dd>"+mah+"</dd><h2>Sales Segment</h2><dt>No. of Segment 1 accounts</dt><dd>"+totTier1+"</dd><dt>No. of Segment 2 accounts</dt><dd>"+totTier2+"</dd><dt>No. of Segment 3 accounts</dt><dd>"+totTier3+"</dd><dt>No. of Segment 4 accounts</dt><dd>"+totTier4+"</dd><dt>No. of accounts with no segment</dt><dd>"+noTier+"</dd><h2>Growth Potential</h2><dt>Low</dt><dd>"+totLow+"</dd><dt>Moderate</dt><dd>"+totMod+"</dd><dt>High</dt><dd>"+totHigh+"</dd><dt>Without growth info</dt><dd>"+noPotential+"</dd><h2>Sales</h2><dt>Total sales 2017</dt><dd>$"+numeral(sales2017).format('0,0')+"</dd><dt>Total sales 2018</dt><dd>$"+numeral(sales2018).format('0,0')+"</dd><dt>Average sales 2017</dt><dd>$"+numeral(avg2017.toFixed(2)).format('0,0')+"</dd><dt>Average sales 2018</dt><dd>$"+numeral(avg2018.toFixed(2)).format('0,0')+"</dd><dt>H1'2018</dt><dd>$"+numeral(toth12018).format('0,0')+"</dd><dt>H1'2019</dt><dd>$"+numeral(toth12019).format('0,0')+"</dd><dt>H1 Trend</dt><dd>"+h1trend.toFixed(2)+"%"+"</dd></dl><div style='text-align: center;'><button id='download'>Download selected</button></div>")
			    .addTo(map);
			    dialog.hideResize();
				
			    document.getElementById("download").addEventListener("click", downloadExcel);
				function downloadExcel(){
					var xls = new xlsExport(summaryPoints, 'title');
					 xls.exportToXLS('export.xls')
				};
			});
	
}
