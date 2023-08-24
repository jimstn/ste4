//onLoad
shifts = null;
bridges = null;
poi = null; // other Points Of Interest


document.addEventListener('DOMContentLoaded', (event) => {
  fetch('db/ste4.json').then((response) => response.json()).then((data) => {
    shifts = data.shifts;

    //shifts.all(prepare);
    shifts.forEach((shift) => {
      // normalise date
      dt = new Date(shift.date);
      if(dt instanceof Date && !isNaN(dt)){
        shift.datetime = dt;
      }
		// cope with Excel serial date number (days since 1900?)
      if(shift.date > 40000 && shift.date < 55000){ 
        shift.datetime = new Date(Date.UTC(0, 0, shift.date - 1));
      }

      // normalise structure ID
      const bridge_regex = /^([A-Z]{3}[1-9]?)\W+(\w[\w\/]*)\b/i
      const found = shift.structure.match(bridge_regex);
      shift.structure_normalised = (found && found[1] && found[2]) ? found[1]+"-"+found[2].replace(/[^A-Za-z0-9\-]/, "-") : shift.structure;
	
    });

    //shifts.sort();
    shifts.sort((a,b) => {
      const datcmp = (a.datetime ?? 0) - (b.datetime ?? 0);
      const strcmp = a.structure_normalised.localeCompare(b.structure_normalised)
      return datcmp!=0 ? datcmp : strcmp;
    });

	//shifts.filter();
	// compare adjacent shifts to see if they are the same shift
	for(i=1;i<shifts.length;i++){
	  // not sure why can't compare datetime directly, but it doesnt work... must conver tto ISO
	  const datematch = shifts[i].datetime && shifts[i-1].datetime ?( shifts[i].datetime.toISOString() == shifts[i-1].datetime.toISOString() ) : false;
	  const sidmatch = shifts[i].structure_normalised && shifts[i-1].structure_normalised ?( shifts[i].structure_normalised == shifts[i-1].structure_normalised ) : false;
	   
	  if(
	    datematch && sidmatch
	    /*  shifts[i].datetime == shifts[i-1].datetime && 
	    shifts[i].structure_normalised == shifts[i-1].structure_normalised */
	  ){
	    // shifts are same time, same place, so merge them
				
		 // merge tags
		 shifts[i-1].tags += ","+shifts[i].tags
		 shifts[i].tags = "DUPLICATE";
		 console.log("DUPLICATE: "+shifts[i].structure_normalised);
				
		 // make one null, to be filtered out later
	
	
	  }
	}
	
	  //shifts = array_filter(shifts);
	



    shifts.forEach((shift) => addRow(shift));

    if(bridges && shifts) populateLocs();

  });

  // load LNE structures
  fetch('db/lne_bridges.json').then((response) => response.json()).then((data) => {
    if(bridges==null) bridges = {};
    bridges.LNE = data.LNE;

    if(bridges.LNE && shifts) populateLocs();

  });

// load LNW structures
  fetch('db/lnw_bridges.json').then((response) => response.json()).then((data) => {
    if(bridges==null) bridges = {};
    bridges.LNW = data.LNW;

    if(bridges.LNW && shifts) populateLocs();

  });

  // Load Scotland
  fetch('db/sco_bridges.json').then((response) => response.json()).then((data) => {
    if(bridges==null) bridges = {};
    bridges.SCO = data.SCO;

    if(bridges.SCO && shifts) populateLocs();

  });

  // Load stations
  fetch('db/stations.json').then((response) => response.json()).then((data) => {
    if(poi==null) poi = {};
    poi.stations = data;

    if(poi.stations && shifts) populateLocs();

  });

  // Load TSCs

  // TODO: bridges.find()

  document.getElementById("close_modal").addEventListener('click', (ev) => {
    document.getElementById("bridge_info").close();
    ev.preventDefault();
  });

  fileDropSetup();
  

});

function addRow(shift){
  tr = document.createElement('tr');
  tr.innerHTML = '<td class="date"></td><td class="location"></td><td class="popout"><img src="inc/popout.jpeg" width="16px" height="16px" style="opacity:0.5"/></td><td class="tags"><ul></ul></td>';

  shift_time = document.createElement('time');
  if(shift.datetime){
    shift_time.setAttribute("datetime", shift.datetime.toISOString().substring(0, 10));
    shift_time.innerText = shift.datetime.toDateString();
  }
  else
    shift_time.innerText = shift.date;

  tr.querySelector('td.date').appendChild(shift_time);
  if(shift.nights)tr.querySelector('td.date').append(" "+shift.nights+" night");
  if(shift.days)tr.querySelector('td.date').append(" "+shift.days+" day");
  tr.querySelector('td.location').innerText = shift.structure;
  
  tr.querySelector('td.popout img').addEventListener("click", ev => {
    // make objects
    dg = document.getElementById("bridge_info");
    tr = ev.target.closest('tr');
    locdata = tr.querySelector('td.location').dataset;

    // update modal
    dg.querySelector('#bridge_id').innerText = locdata.tlc ?? locdata.original ;
    dg.querySelector('#bridge_name').innerText = locdata.name;

    yds = locdata.yards;
    miyd = yds ? Math.floor(yds/1760) + "mi "+ yds%1760 + "yds" : "";

    dg.querySelector('#bridge_at').innerText = miyd;

    dg.querySelector('#bridge_tags').innerHTML = tr.querySelector('td.tags').innerHTML;
    dg.className = locdata.territory ?? '';

    dg.querySelector('#shift_details').innerHTML = tr.querySelector('td.date').innerHTML;

    if(locdata.lon && locdata.lat){
const APIKEY = "pk.eyJ1Ijoiamltc3RuIiwiYSI6ImNsazJwNzVqZzBmNzAzbmxzMmF2aXZqMmEifQ.LOITIaZYGNaYdmltk7Qu5w";
const MAPSTYLE = "v1/jimstn/clk2pljhs00eu01qr62evbsl0";
const MAPSIZE = "400x300";
const LONLAT = locdata.lon + "," + locdata.lat;
const MAPZOOM = 14; // vary if you vary mapsize, and want to show the same area 
const MAPPIN = ("pin-s+0ae("+LONLAT+")");
const MAPLOC = LONLAT + "," + MAPZOOM + ",0";
const MAPURL = "https://api.mapbox.com/styles/" + MAPSTYLE + "/static/" + MAPPIN + "/" + MAPLOC + "/" + MAPSIZE + "?access_token=" + APIKEY;

dg.querySelector('#bridge_map').style.backgroundImage = "url('" + (MAPURL) + "')";
console.log(MAPURL)
dg.querySelector('#bridge_map').innerHTML = "";

    }
    else {
      dg.querySelector('#bridge_map').style.backgroundImage = "none";
      dg.querySelector('#bridge_map').innerHTML = "Map location not known";
    }

    dg.querySelector('.osgridref').innerHTML = locdata.osgridref ?? 'N/A';
    dg.querySelector('.wsg84').innerHTML = locdata.lat ? locdata.lat+","+locdata.lon : 'N/A';

    dg.querySelector('#bridge_photo #gallery').innerHTML = "";

// make async call to get list of images and then add them to container
callforimages({"sid": locdata.sid, "tlc": locdata.tlc});

    dg.querySelector('form #sid_input').value = locdata.sid ?? '';

    dg.querySelector('form #tlc_input').value = locdata.tlc ?? '';

    // show modal and put focus on button.
    dg.showModal();
    dg.querySelector('#close_modal').focus();
    ev.preventDefault();
  });
  tr.querySelector('td.location').innerText = shift.structure;

  tr.querySelector('td.location').dataset.original = shift.structure;
  if(shift.station) tr.querySelector('td.location').dataset.station = shift.station; /* TODO: WHYYYY? */

  
   // unless is an array
  if(shift.tags){
	tags = shift.tags.split(',');
	tags.forEach((t) => {
	  tt = document.createElement('li');
	  tt.innerText = t;
	  tt.className = 'tag';
	  if(t) tr.querySelector('td.tags ul').appendChild(tt);
	});
  }

  tb = document.querySelector('table tbody');
  tb.appendChild(tr);

}





function callforimages(criteria){
  // search for images that match 1 or more criteria
 /* fetch('https://example.com?' + ) */
  const query = new URLSearchParams({
    date: '2023',
    sid: criteria.sid,
    tlc: criteria.tlc
  })
  fetch('ste4-assets.php?' + query).then((response) => response.json()).then((data) => {
    data.photos.forEach((photo) => {
      img = document.createElement("IMG")
      img.src = photo.src
      document.getElementById("gallery").appendChild(document.createElement("FIGURE")).appendChild(img)
    });

  });


}





function populateLocs(){
  
  rows = document.querySelectorAll('table td.location:not(.lne):not(.lnw):not(.sco)');
  bridge_regex = /^([A-Z]{3}[1-9]?)\W+(\w[\w\/]*)\b/i
  elr_regex = /^([A-Z]{3}[1-9]?)\b/i

  rows.forEach((loc)=> {
    if(loc.dataset.original.match(bridge_regex)){
      loc.classList.add('matched');
      const found = loc.dataset.original.match(bridge_regex);
      const elr = found[1];
      const bid = found[2];

		// this will get applied multiple times
      loc.innerHTML = loc.dataset.original.replace(bridge_regex, '<span class="match">$&</span>');

      // Todo: use Array.find
      if(bridges.LNE) bridges.LNE.some((bridge) => {
        if(bridge.elr == elr && bridge.bridge_id == bid){
          loc.classList.add('lne');
			 if(bridge.lat && bridge.lon){
			   loc.appendChild(getMapLink(bridge.lat,bridge.lon,loc.dataset.original ?? 'noname'));
			   loc.dataset.lon = bridge.lon;
			   loc.dataset.lat = bridge.lat;
			 }
			loc.innerHTML += "<br/><small>" + bridge.name;
			if(bridge.osgridref) loc.dataset.osgridref = bridge.osgridref;
			if(bridge.yards) loc.dataset.yards = bridge.yards;
			loc.dataset.territory = "lne";
			loc.dataset.sid = bridge.elr+"-"+bridge.bridge_id.replace(/[^A-Za-z0-9\-]/, "-");
			loc.dataset.name = bridge.name; // could serialise the whole bridge object here?
          return true;
        }
      });
      if(bridges.LNW) bridges.LNW.some((bridge) => {
        if(bridge.elr == elr && bridge.bridge_id == bid){
          loc.classList.add('lnw');
			 if(bridge.lat && bridge.lon){
			   loc.appendChild(getMapLink(bridge.lat,bridge.lon,loc.dataset.original ?? 'noname'));
			 }
			loc.innerHTML += "<br/><small>" + bridge.name;
			if(bridge.osgridref) loc.dataset.osgridref = bridge.osgridref;
			if(bridge.yards) loc.dataset.yards = bridge.yards;
			loc.dataset.territory = "lnw";
			loc.dataset.sid = bridge.elr+"-"+bridge.bridge_id.replace(/[^A-Za-z0-9\-]/, "-");
			loc.dataset.name = bridge.name; // could serialise the whole bridge object here?
          
          return true;
        }
      });
      if(bridges.SCO) bridges.SCO.some((bridge) => {
        if(bridge.elr == elr && bridge.bridge_id == bid){
          loc.classList.add('sco');
			 if(bridge.lat && bridge.lon){
			   loc.appendChild(getMapLink(bridge.lat,bridge.lon,loc.dataset.original ?? 'noname'));
			 }
			loc.innerHTML += "<br/><small>" + bridge.name;
			if(bridge.osgridref) loc.dataset.osgridref = bridge.osgridref;
			if(bridge.yards) loc.dataset.yards = bridge.yards;
			loc.dataset.territory = "sco";
			loc.dataset.sid = bridge.elr+"-"+bridge.bridge_id.replace(/[^A-Za-z0-9\-]/, "-");
			loc.dataset.name = bridge.name; // could serialise the whole bridge object here?
          
          return true;
        }
      });
      
      // TODO: stop on find
    }
  }); // end rows.forEach

  rows = document.querySelectorAll('table td.location:not(.station)');

  rows.forEach((loc)=> {
    if(loc.dataset.station && poi && poi.stations) poi.stations.some((station) => {
        if(station.tlc == loc.dataset.station){
          loc.classList.add('station');
			 loc.innerHTML += "<br/><small class='station'><span class='tlc'>"+station.tlc+'</span> '+station.name;
			  loc.dataset.name = station.name;
			  loc.dataset.territory = "station";
			  loc.dataset.tlc  = station.tlc; // could serialise the whole bridge object here?
			
			 if(station.latitude && station.longitude){
			   loc.appendChild(getMapLink(station.latitude, station.longitude,station.name));
			 }
          
          return true;
        }
      });
  }); // end rows.forEach



}


function getMapLink(lat, lon, text){
  let a = document.createElement('a');
  a.className= 'maplink';
  a.href = 'https://google.com/maps/place/'+lat+','+lon;
  a.innerText = lat + ',' + lon;
  return a;

}



function fileDropSetup(){

// file upload handling
let dropArea = document.getElementById('drop_area');

function preventDefaults (e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropArea.classList.add('highlight')
}

function unhighlight(e) {
  dropArea.classList.remove('highlight')
}

dropArea.addEventListener('drop', handleDrop, false);
document.getElementById('photo_input').addEventListener('change', (e)=>{ handleFiles(e.target.files) }, false);

function handleDrop(e) {
  let dt = e.dataTransfer
  let files = dt.files

  handleFiles(files)
}
function handleFiles(files) {
  files = [...files]
  files.forEach(previewFile)
    if(!document.querySelector('form#drop_area').classList.contains('bulk')){
    files.forEach(uploadFile)
  }
  else alert("no") //console.log(files)
    
}
function uploadFile(file) {
  let url = 'ste4-upload.php'
  let formData = new FormData()

  formData.append('file', file)
  sid = document.getElementById("sid_input").value;
  formData.append('structure-id', sid)

  fetch(url, {
    method: 'POST',
    body: formData
  })
  .then(() => { /* Done. Inform the user */ })
  .catch(() => { /* Error. Inform the user */ })
}

function previewFile(file) {
  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = function() {
    let img = document.createElement('img')
    img.src = reader.result
    document.getElementById('gallery').appendChild(img)
  }
}

} // end filedropsetup