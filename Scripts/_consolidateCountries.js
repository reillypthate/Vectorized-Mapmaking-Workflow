#target "Illustrator"

/**
 *  For future iterations of the Map Vector project...
 * 
 *  In GQIS, *Export > Project as PDF* outputs a PDF that opens into a
 *  single-layer SVG with thousands of paths.
 *  
 *  Each country will have at least one FILL and at least one STROKE,
 *  representing the country color and border, respectively.
 *  This script will:
 *  > Remove black strokes from SVG to clean up file
 *  > Group the polygons by color to consolidate the countries
 *  > Sort the countries by color to prepare country groups for naming
 *  > Rename the ordered country groups to their respective countries
 *  
 *  I manually attempted this process on April 21, 2022. Time wasted? Maybe not.
 *  > I won't need to spend hours on end grouping the countries together... I'll
 *    have this script to do the job for me!
 *  > I won't need to name every single country next time around if I plan on
 *    implementing "Country Hop" video transitions in the future; I'll only need
 *    to name the countries I plan on hopping between.
 * 
 */

var doc = app.documents[0];   // Focus on the open AI file
var layer = doc.layers[0];    // We only have 1 layer from the GQIS export.
var items = layer.pageItems;

//==============================================================================
//  STEP 1
//  Remove the border strokes.
//==============================================================================
for(it = items.length-1; it >= 0; it-=2) {
  items[it].remove();
}
//==============================================================================

//==============================================================================
//  STEP 2
//  Group the polygons by color; now we've got COUNTRY groups! (04.26.2022)
//  After grouping polygons by color, clean up layers.
//==============================================================================
var groupedLayer = doc.layers.add();
while(items.length !== 0) {
  var newColorGroup = groupedLayer.groupItems.add();
  var workingItem = items[0];
  items[0].moveToEnd(newColorGroup);
  
  //  Grouping loop ends when there are no layers left!
  //  Catch the resulting exception and just move on.
  try {
    while(hasSameColor(workingItem, items[0])) {
      items[0].moveToEnd(newColorGroup);
    }
  } catch(e) {
    //alert("Finished grouping!");
    break;
  }
}
doc.layers[1].remove();
doc.layers[0].name = "World Map";
//==============================================================================

//==============================================================================
//  STEP 3
//  Sort the groups by color; now we've got ORDERED countries! (04.26.2022)
//  After grouping polygons by color, clean up layers.
//==============================================================================
//  Step 3.1: Change the group names to their respective HUE values.
// Reassign the layer value to the one generated in Step 2.
layer = doc.layers[0]; 
var groups = layer.groupItems;
var workingPath;
for(it = 0; it < groups.length; it++) {
  workingPath = groups[it].pageItems[0];
  if(groups[it].pageItems[0].typename == 'CompoundPathItem') {
    workingPath = workingPath.pathItems[0];
  }
  hsl =  RGBtoHSL(
    workingPath.fillColor.red, 
    workingPath.fillColor.green,
    workingPath.fillColor.blue
    );
  if(hsl[0] < 10)
    groups[it].name = "00" + hsl[0]; 
  else
    if(hsl[0] < 100)
      groups[it].name = "0" + hsl[0]; 
    else
      groups[it].name = hsl[0];
}
//==============================================================================
//  Step 3.2: Sort the groups by their respective HUE values.
var toSort = [];

for(it = 0; it < groups.length; it++) {
  toSort.push(groups[it].name);
}
var sortResult = toSort.sort(function (a,b) {return a > b; });
sortGroups(layer, sortResult);
//==============================================================================

//==============================================================================
//  STEP 4
//  Rename the layers to their respective country names. (04.26.2022)
//  Import a list of alphebatized country names mapped to the ordered GROUPS
//==============================================================================
//  Notifies user about next step; clarifies purpose of dialog.
alert("NEXT: Select File...\nSelect the file corresponding to the \"Ordered Country Names\".\n\nWe're renaming the layers to their respective countries.");
var finalMessage = "Countries Consolidated.";
//  Prompt user to give text file containing country names.
//  If file isn't selected or found, end script gracefully.
try {
    var textFile = File.openDialog("Select File (Containing ORDERED Countries)");
    textFile.encoding = 'UTF8';
    textFile.open("r");
    var fileContentsString = textFile.read();
    textFile.close();

    var countries = fileContentsString.split("\n");
    for(it = 0; it < countries.length; it++) {
        groups[it].name = countries[it];
    }
    finalMessage += "\nSUCCESS: Country names assigned.";
//alert("Complete!");
}catch(e) {
    alert("No file selected.");
    finalMessage += "\nWARNING: Country names not assigned."
}
alert(finalMessage);

//==============================================================================
//  HELPER FUNCTIONS
//==============================================================================

/**
 * Helper function; sorts the groups by name in a layer.
 * Used in STEP 3 to properly order the countries by hue.
 */
function sortGroups(layer, groups) {
  for(var si = 0, sj = groups.length; si < sj; si++) {
    layer.groupItems.getByName(groups[si]).zOrder(ZOrderMethod.SENDTOBACK);
  }
}


/**
 * Helper function; simply returns a color string.
 */ 
function stringColor(color) {
  return "(" + color.red + ", " + color.green + ", " + color.blue + ")";
}

/**
 * Helper function: converts the RGB values to HSL.
 * Used in STEP 3 for country sorting (by color)
 * 
 * SOURCE: Jon Kantner, CSS-Tricks.com
 * https://css-tricks.com/converting-color-spaces-in-javascript/#aa-rgb-to-hsl
 * *** Altered for clarity and precision.
 */
function RGBtoHSL(r,g,b) {
  //  Convert RGB values to fractions.
  var red = r / 255.0;
  var green = g / 255.0;
  var blue = b / 255.0;
  
  //  Find greatest and smallest channel values
  var cmin = Math.min(red,green,blue);
  var cmax = Math.max(red,green,blue);
  var delta = cmax - cmin;
  var h = 0;
  var s = 0;
  var l = 0;
  
  //  Calculate hue (determined by greatest channel value in cmax)
  if(delta === 0) {
    //  It's a gray
    h = 0;
  } else if(cmax == red) {
    h = ((green - blue) / delta) % 6;
  } else if(cmax == green) {
    h = (blue - red) / delta + 2;
  } else {
    h = (red - green) / delta + 4;
  }
  h = Math.round(h*60);
  
  // Make negative hues positive behind 360º.
  if(h < 0) {
    h += 360;
  }
  
  //  Calculate lightness; saturation is dependent on this.
  l = (cmax + cmin) / 2.0;
  if(delta === 0) {
    s = 0;
  } else {
    s = delta / (1.0 - Math.abs(2*l - 1));
  }
  
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
  
  return [h, s, l]; // return "hsl(" + h + "," + s + "%," + l + "%)";
}
/**
 * Helper function; checks the fillColor of two pathItems to see if they match.
 * Used in STEP 2 for country grouping.
 */
function hasSameColor(item1, item2) {
  var color1, color2;
  //  Check to see if the first item is a 'CompoundPathItem'.
  //  If it is, it's a container without a fillColor; check its 1st pathItem.
  if(item1.typename == 'CompoundPathItem') {
    color1 = item1.pathItems[0].fillColor;
  }else{
    color1 = item1.fillColor;
  }
  
  if(item2.typename == 'CompoundPathItem') {
    color2 = item2.pathItems[0].fillColor;
  }else {
    color2 = item2.fillColor;
  }
  
  if(color1.red != color2.red 
    || color1.green != color2.green 
    || color1.blue != color2.blue) {
        return false;
  }
  return true;
}
//alert("Strokes removed!");

//  Start from the final fill.

//var firstColor = items[items.length-2].fillColor;
//items[items.length-2].selected = true;
//alert(firstColor.red + ", " + firstColor.green + ", " + firstColor.blue);

/*
var numGroups = 0;
var numItemsProcessed = 0;
while(items.length - (numGroups+2) > 0) {//items.length - (2 + numGroups) > 0) {
  //items = layer.pageItems;
  items[items.length - (numGroups+2)].selected = true;
  var colorToFind = items[items.length - (numGroups+2)].fillColor;
  app.executeMenuCommand('Find Fill Color menu item');
  app.executeMenuCommand('group');
  app.executeMenuCommand('deselectall');
  numGroups++;
}

//app.executeMenuCommand('deselectall');
//layer.selected = true;
//layer.selected = false;
*/
/*
for(it = 0; it < 10; it++) {
  var item = items[it];
  item.selected = true;
  for(jt = it+1; jt < items.length; jt++) {
    if(isSameColor(item.fillColor, items[jt].fillColor)) {
      items[jt].selected = true;
    } else {
      app.executeMenuCommand('group');
      for(kt = it; kt < jt; kt++) {
        items[kt].selected = false;
      }
    }
  }
}
*/
/*
for(jt = it+1; jt < items.length; jt++) {
  if(isSameColor(item.fillColor, items[jt].fillColor)) {
    items[jt].selected = true;
  } else {
    //app.executeMenuCommand('group');
  }
}
*/