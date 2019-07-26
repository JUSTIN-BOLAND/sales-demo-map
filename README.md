# sales-demo-map
Map representing info for different clients.

The functionalities are:
<ul>
<li>Data retrieved as JSON from a google spreadsheet using Sheety.co so that map can be updated easily by the user.</li>
<li>Client markers colored to represent 3 attributes: Border color represents Growing or declining sales trend; Fill color represents low, moderate or high growing potential; and number inside represents client tier</li>
<li>Ability to enable/disable heatmap</li>
<li>Ability to enable/disable clusters for the client markers</li>
<li>Sidebar with filters for type of client, client tier, growth potential and Sales trend.</li>
<li>Legend in the sidebar.</li>
<li>Popups with info for each client</li>
<li>Ability to draw polygon to select a group of clients</li>
<li>Click polygon to see a Dialog box with the summary of the clients inside the drawn polygon</li>
<li>Icons are SVGs so animations can be used in the markers (see blue pulsing markers), and colors and shapes can be changed to represent different attributes for each client.</li>
</ul>

Made using Leafletjs in javascript and turfjs for the client-side geoprocessing of getting the points inside drawn polygon
