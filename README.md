# sales-demo-map

The functionalities are:
<ul>
<li>Data retrieved as JSON from a google spreadsheet using Sheety.co so that map can be updated easily by the user.</li>
<li>Client markers colored to represent 3 attributes: Border color represents Growing or declining sales trend; Fill color represents low, moderate or high growing potential; and number inside represents client tier</li>
<li>Heatmap</li>
<li>Clusters for the client markers</li>
<li>Filter sidebar to filter clients based on tier, growth potential and Sales trend</li>
<li>Popups with info for each client</li>
<li>Draw polygon</li>
<li>click polygon to see a Dialog box with the summary of the clients inside the drawn polygon</li>
</ul>

Made using Leafletjs in javascript and turfjs for the client-side geoprocessing of getting the points inside drawn polygon
