// Dev branch: https://script.google.com/macros/s/AKfycbyAB0RYh2OXacWI_9sLprXQOkXcGi3vYlhbzxJkWzI/dev 

//#region Config

/** Interval, in seconds, that the server is checked for new data */
const UpdateInterval = 1;
        
/** Interval, in seconds, that determines how often a client 
 * checks the server to refresh cached data */
const LastActiveUpdateInterval = 120;

//#endregion

//#region Fields
if (typeof isBoardMaster === 'undefined') 
    isBoardMaster = false;

let DevMode = false;
let LastError = null;
let Misord = null
let AllowClickConfirmButton = true;
let AllowMISORDSelection = true;
let MBoardInit = false;
let BoardOnline = true;
let ClientLoaded = false;
let ClientDoctrine = "";
let ClientShip = "";
let ClientPlaytime = null;
let ClientMisord = null;
let ClientRemarks = "";
let ClientSendFullReport = true;
let JoinReportPlayTime = 0;
let BoardClosed = true;
let draggedItem = null
let allowUpdate = true;
let oldFlight = null;
let timer = 0;
let preventSectionHover = false;
let mboardRefreshing = false;
let dataversion = 0;
let LastDirectives = [];
let directivesProcessed = 0;
let sectionWasDismissed = false;  
let lastRenderedDirective = null;
let EditingParameters = false;
let VoiceCommandArgs = {};

let click1 = new Audio();
click1.src = "http://lfmissionboard.000webhostapp.com/sfx/click1.wav";

let click2 = new Audio();
click2.src = "http://lfmissionboard.000webhostapp.com/sfx/click2.wav";

let startSound = new Audio();
startSound.src = "http://lfmissionboard.000webhostapp.com/sfx/start.wav";

let flights = [];
let sections = [];
let pilots = {};
let pilotsOld = undefined;
//#endregion

//#region Utility functions

const GetPlaytimeHTML = function(pilot) {
    let currentTime = new Date().getTime();
    let html = '';
    if (pilots[pilot] && pilots[pilot].playtime > currentTime) {
        let timeRemaining = pilots[pilot].playtime - currentTime;
        let hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        timeRemaining -= hours * 1000 * 60 * 60;
        let minutes = Math.floor(timeRemaining / (1000 * 60));
        if (minutes === 0) minutes = "00";
        html = ', '+hours+':'+minutes;
    }
    return html;
}

const text2num = function(s) {
    var Small = {
        'zero': 0,
        'one': 1,
        'two': 2,
        'to' : 2,
        'two': 2,
        'three': 3,
        '3s': 3,
        'four': 4,
        'for': 4,
        'fore': 4,
        'five': 5,
        'v':5,
        'six': 6,
        'seven': 7,
        'eight': 8,
        'nine': 9,
        'ten': 10,
        'eleven': 11,
        'twelve': 12,
        'thirteen': 13,
        'fourteen': 14,
        'fifteen': 15,
        'sixteen': 16,
        'seventeen': 17,
        'eighteen': 18,
        'nineteen': 19,
        'twenty': 20,
        'thirty': 30,
        'forty': 40,
        'fifty': 50,
        'sixty': 60,
        'seventy': 70,
        'eighty': 80,
        'ninety': 90
    };
    var Magnitude = {
        'thousand':     1000,
        'million':      1000000,
        'billion':      1000000000,
        'trillion':     1000000000000,
        'quadrillion':  1000000000000000,
        'quintillion':  1000000000000000000,
        'sextillion':   1000000000000000000000,
        'septillion':   1000000000000000000000000,
        'octillion':    1000000000000000000000000000,
        'nonillion':    1000000000000000000000000000000,
        'decillion':    1000000000000000000000000000000000,
    };
    function feach(w) {
        var x = Small[w.toLowerCase()];
        if (x != null) {
            g = g + x;
        }
        else if (w == "hundred") {
            g = g * 100;
        }
        else {
            x = Magnitude[w];
            if (x != null) {
                n = n + g * x
                g = 0;
            }
            else { 
                //alert("Unknown number: "+w); 
            }
        }
    }
    var a, n, g;
    a = s.toString().split(/[\s-]+/);
    n = 0;
    g = 0;
    a.forEach(feach);
    return n + g;
}

const getNATOLetter = function(a) {
    return {
        'a' : 'Alfa',
        'b' : 'Bravo',
        'c' : 'Charlie',
        'd' : 'Delta',
        'e' : 'Echo',
        'f' : 'Foxtrot',
        'g' : 'Golf',
        'h' : 'Hotel',
        'i' : 'India',
        'j' : 'Juliett',
        'k' : 'Kilo',
        'l' : 'Lima',
        'm' : 'Mike',
        'n' : 'November',
        'o' : 'Oscar',
        'p' : 'Papa',
        'q' : 'Quebec',
        'r' : 'Romeo',
        's' : 'Sierra',
        't' : 'Tango',
        'u' : 'Uniform',
        'v' : 'Victor',
        'w' : 'Whiskey',
        'x' : 'X-ray',
        'y' : 'Yankee',
        'z' : 'Zulu',
    }[a.toLowerCase()];
}

Object.compare = function (obj1, obj2) {
	//Loop through properties in object 1
	for (var p in obj1) {
		//Check property exists on both objects
		if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;
 
		switch (typeof (obj1[p])) {
			//Deep compare objects
			case 'object':
				if (!Object.compare(obj1[p], obj2[p])) return false;
				break;
			//Compare function code
			case 'function':
                if (typeof (obj2[p]) == 'undefined' 
                  || (p != 'compare' 
                  && obj1[p].toString() != obj2[p].toString())) 
                    return false;
				break;
			//Compare values
			default:
				if (obj1[p] != obj2[p]) return false;
		}
	}
 
	//Check object 2 for any extra properties
	for (var p in obj2) 
		if (typeof (obj1[p]) == 'undefined') return false;
	return true;
}

const GetFormattedShipName = function(ship) {
    //add formatted ship names here
    let l = ship.toLowerCase();
    if (l.includes('caterpillar')) ship = 'Caterpillar';
    else if (l.includes('buccaneer')) ship = 'Buccaneer';
    else {
        //catch all if no formatting is found
        let words = ship.split(" ");
        _.each(words, function(e, i){
            e.replace(/\s/g, '');
            if (e.length < 1) words.splice(i, 1);
        })
        if (words.length > 0)
            ship = words[words.length - 1];
        else ship = "Random Ship"
    }
    return ship
}

const FuzzyGetPilot = function(pilot) {
    // do a fuzzy search of the pilot names
    let names = Object.keys(pilots);
    var options = {
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
    };
    var fuse = new Fuse(names, options); // "list" is the item array
    var result = fuse.search(pilot);
    if (result.length < 1) {
        // print something somewhere?
        console.log('Voice command: Pilot '+pilot+' does not exist!');
        return false;
    }
    return names[result[0]];
}

//#endregion

//#region User controls/preferences

let AllowVoiceCommands = Cookies.get('AllowVoiceCommands') != undefined ? 
  (Cookies.get('AllowVoiceCommands') === 'true') : false;

let PilotInfoGlobal = Cookies.get('PilotInfoGlobal') != undefined ? 
  (Cookies.get('PilotInfoGlobal') === 'true') : true;

let EnableSound = Cookies.get('EnableSound') != undefined ? 
  (Cookies.get('EnableSound') === 'true') : true;

const ApplySoundToggle = function() {
    if (EnableSound) {
        click1.volume = 0.5;
        click2.volume = 0.5;
        startSound.volume = 0.5;
        $('#mb-toggleSound').addClass('mb-top-button-on');
    }
    else {
        click1.volume = 0;
        click2.volume = 0;
        startSound.volume = 0;
        $('#mb-toggleSound').removeClass('mb-top-button-on');
    }
}

const ApplyPilotInfoGlobal = function() {
    if (PilotInfoGlobal){
        $('.shipName').removeClass('hidden');
        $('#mb-togglePilotInfo').addClass('mb-top-button-on');
    } 
    else {
        $('.shipName').addClass('hidden');
        $('#mb-togglePilotInfo').removeClass('mb-top-button-on');
    }
}

const ApplyMicToggle = function() {
    if (!annyang) return;
    if (AllowVoiceCommands) {
        annyang.start();
        $('#mb-toggleMic').addClass('mb-top-button-on');
    } else {
        annyang.abort();
        $('#mb-toggleMic').removeClass('mb-top-button-on');
    } 
}

//#endregion

//#region Event registration

const registerEvents = function(){

    $('#mb-debugBox').click(function(){
        alert(LastError.error + ' at line ' + LastError.lineno);
    });

    $('#LF-mb-welcome-confirmButton').click(function(e) {
        if (!MBoardInit) InitMBoard();
        if (!AllowClickConfirmButton) return;
        JoinReportPlayTime = $('#LF-mb-welcome-playtimeAmount').val();
        ClientPlaytime = new Date().getTime() + (Number(JoinReportPlayTime) * 1000 * 60 * 60);
        ClientCallsign = $('#mboardCallsign').html();
        if (!ClientCallsign || ClientCallsign == '') return;
        ClientRemarks = $('#LF-mb-welcome-remarksText').val();
        let misordText = $('#LF-mb-welcome-misord-selection').text();
        if (!ClientMisord) ClientMisord = misordText.length > 0 && misordText != 'Select a MISORD ...' ? misordText.charAt(0).toLowerCase() : '';

        if (!ClientMisord || ClientMisord == '') {
            $('#mb-welcome-warningbox').text('You must select a MISORD.')
            return;
        }
        if (isNaN(ClientPlaytime)){
            $('#mb-welcome-warningbox').text('Playtime must be a number.')
            return;
        }
        if (ClientDoctrine == "" || ClientShip == "") {
            $('#mb-welcome-warningbox').text('Please select a doctrine and ship.')
            return;
        }
        ConfirmationSuccessful();
    })

    $('#LF-mb-welcome-doctrine-selection, #LF-mb-welcome-ship-selection, #LF-mb-welcome-misord-selection').click(function(e) {
        let type = $(this).attr('data-type');
        if (type == 'misord' && !AllowMISORDSelection) return;
        $('.LF-mb-doctrineListItem, .LF-mb-shipListItem, .LF-mb-misordListItem').click(function(){
            click2.play();
            let type = $(this).attr('data-type');
            let item = $(this).text();
            if (type == 'ship') ClientShip = item;
            else if (type == 'doctrine') ClientDoctrine = item;
            else ClientMisord = item.charAt(0).toLowerCase();
            $('#LF-mb-welcome-'+type+'-selection').text(item);
            $('#LF-mb-'+type+'ListBox').addClass('hidden');
        });
        click2.play();
        $('.LF-mb-welcome-listbox').addClass('hidden');
        $('#LF-mb-'+type+'ListBox').removeClass('hidden');
        e.stopPropagation(); 
    })

    $(':not(.LF-mb-welcome-listbox, .LF-mb-welcome-selection)').click(function() {
        $('.LF-mb-welcome-listbox').addClass('hidden');
    })

    $('#mb-toggleSound').click(()=>{
        EnableSound = !EnableSound;
        Cookies.set('EnableSound', EnableSound, { expires: 30 });
        ApplySoundToggle();
        click2.play();
    });

    $('#button_editParams').click(function() {
        if (EditingParameters === null || !isBoardMaster) return;
        
        click2.play();
        if (!EditingParameters) {
            $('div#parameters').css('border','2px dotted red')
            $('div#parameters').attr('contenteditable', true);
            $('#button_editParams').text('Send Changes');
            EditingParameters = true;
        }
        else {
            $('div#parameters').css('border','2px dotted transparent')
            $('div#parameters').attr('contenteditable', false);
            allowUpdate = false;
            //let text = $('div#parameters').html().replace(/<div>/g, '\n');
            //text = text.replace(/<\/div>/g, '');
            google.script.run
                .withSuccessHandler(function(version) {
                    dataversion = version;
                    EditingParameters = false;
                    allowUpdate = true;
                    $('#button_editParams').text('Edit');
                }).pushMissionParams($('div#parameters').html(), ClientMisord);
            $('#button_editParams').text('Sending changes, please wait ...');
            EditingParameters = null;
        }
    });

    $('#mb-changeInfo').click(function(){
        click2.play();
        ChangePilotInfo();
    });
            
    $('#mb-togglePilotInfo').click(function() {
        click2.play();
        PilotInfoGlobal = !PilotInfoGlobal;
        Cookies.set('PilotInfoGlobal', PilotInfoGlobal, { expires: 30 });
        ApplyPilotInfoGlobal();
    });
            
    $("#mb-toggleMic").click(function() {
        click2.play();
        if (!annyang) return;
        AllowVoiceCommands = !AllowVoiceCommands;    
        Cookies.set('AllowVoiceCommands', AllowVoiceCommands, { expires: 30 });
        ApplyMicToggle();
    });
            
    $('#mb-backToPortal').click(function() {
        BoardClosed = true;
        click2.play();
        setTimeout(function(){ 
            ChangePilotInfo(3000);
            startSound.play();
            setTimeout(()=>{
                try
                { getPage('LOGFORM'); }
                catch(e)
                { console.error(e);}
            }, 1000);
        }, 500);    
    });

    window.addEventListener('error', e => {
        showDebugBox('Line '+e.lineno+': '+String(e.error));
        LastError = e;
    });

    document.onkeydown = function (data) {
        // press E to enter dev mode if the client is not loaded
        // make this more secure in the future
        if (data.which == 27 && !ClientLoaded 
        && !DevMode && typeof ClientCallsign === 'undefined') {
            console.log('DEVMODE');
            DevMode = true;
            ClientCallsign = 'Splen';
            ClientShip = 'Merlin';
            ClientDoctrine = 'Nugget';
            ClientMisord = 'z';
            JoinReportPlayTime = 1;
            ClientRemarks = 'in development mode';
            if (ClientCallsign == 'Splen') isBoardMaster = true;
            ClientPlaytime = new Date().getTime() + (60 * 60 * 1000);
            ConfirmationSuccessful();
        }
    };

}

//#endregion

//#region Rendering

const renderMISORDList = function() {
    let misordHTML = '';
    let color = '';
    if (pilots[ClientCallsign] && pilots[ClientCallsign].section !== 0) {
        AllowMISORDSelection = false;
        $('#LF-mb-misordListBox').addClass('hidden');
        $('.balloonTip').remove();
        $('#LF-mb-welcome-misord-selection').text(getNATOLetter(pilots[ClientCallsign].misord))
        $('#LF-mb-welcome-misord-selection').balloon({ 
            position: "left",
            contents:'You are already assigned to a section and cannot change your MISORD.',
            css: {maxWidth: "150px"} 
        });
        $('#LF-mb-welcome-misord-selection').css('color', '#a9a9a945');
        return;
    }
    else {
        if (typeof pilotsOld !== 'undefined' && Object.compare(pilotsOld, pilots)) return;
        $('.balloonTip').remove();
        $('#LF-mb-welcome-misord-selection').balloon({ 
            contents:''
        });
        $('#LF-mb-welcome-misord-selection').css('color', 'white');
        AllowMISORDSelection = true;
    }
    pilotsOld = pilots;
    let activeMisords = [];
    _.each(pilots, (v,k)=>{
        if (v.misord !== 'z' && !activeMisords.includes(v.misord))
            activeMisords.push(v.misord);
    })
    misordHTML+= '<li style="'+color+'" class="LF-mb-misordListItem" alt="If your MISORD has not been'
      +' specified by a flight lead or C2, wait for assignment by joining Zulu." data-type="misord">Zulu*</li>';
    _.each(parameters, (v,k) => {
        color = '';
        if (!activeMisords.includes(k)) {
            v = 'INACTIVE';
            color = 'color: #a9a9a945;';
        }
        v = v.replace(/<div>/g, '\n');
        v = v.replace(/<\/div>/g, '');
        if (v == '') v = 'ACTIVE';
        if (v != 'INACTIVE' || isBoardMaster)
            misordHTML+= '<li style="'+color+'" class="LF-mb-misordListItem" alt="'
              +v+'" data-type="misord">'+getNATOLetter(k)+'</li>';
    });
    $('#LF-mb-misordListBox').html(misordHTML);
    $('.LF-mb-misordListItem').balloon({ 
        position: "left", 
        classname: "balloonTip",
        css: {maxWidth: "150px"} 
    });
}

const showDebugBox = function(msg) {
    $('#mb-debugBox').show();
    $('#mb-debugBox').text(msg);
    setTimeout(function() {
        $('#mb-debugBox').hide();
    }, 10000);
}

const ChangeMisordTitle = function() {
    $('#misordTitle').text('MISORD '+getNATOLetter(ClientMisord));
}

const welcomeBoxLoadingDots = function() {
    setTimeout(function() {
        if (!ClientLoaded) {
            $('#mb-welcome-warningbox').append(' .');
            welcomeBoxLoadingDots();
            return;
        }
    }, 250);
}

const PlaytimeUpdateLoop = function() {
    setTimeout(function(){
        $('.shipName').each(function(){
            let txt = $(this).text();
            let reg = /(\d+):(\d+)/;
            let ma = txt.match(reg);
            if (!ma || ma.length < 3) return true;
            let re = txt.replace(reg, function(m,p1,p2){
                let hr = Number(p1), min = Number(p2);
                if (min === 0 && hr > 0) {
                    hr--;
                    min = 59;
                }
                else if (min > 0) min--;
                if (min < 10) min = '0'+min;
                return hr+':'+min;
            });
            $(this).text(re);
        });
        PlaytimeUpdateLoop();
    }, 60000);
}

const renderDirective = function(directive) {
    directivesProcessed++;
    if (lastRenderedDirective == directive || directive === null || directive == '') return
    lastRenderedDirective = directive;
    let color = '';
    if (directive.includes(ClientCallsign))
        color = ' style="color:Gold;"';
    $('#summary li').css('opacity', function() {
        return Math.max(Number($(this).css('opacity')) - 0.1, 0.1);
    });
    $('#summary').append('<li'+color+'>'+directive+'</li>');
    $('#summaryBox').scrollTop(999 * directivesProcessed);
}

const addDirective = function(directive){
    directive = ClientMisord.toUpperCase() +'> '+directive
    renderDirective(directive);
    if (isBoardMaster) LastDirectives.push(directive);
}

const renderPilots = function() {
    sectionWasDismissed = false;
    //console.log('Rendering pilots');
    //console.log('allowUpdate: ' + allowUpdate+' | mboardRefreshing: '+mboardRefreshing)
    //console.log('isBoardMaster: ' + isBoardMaster+' | PilotsToAdd.length: '+PilotsToAdd.length)
    if (!allowUpdate || mboardRefreshing) return;
    
    if (isBoardMaster && typeof PilotsToAdd !== 'undefined' && PilotsToAdd && PilotsToAdd.length > 0) {
        let changesMade = false;
        _.each(PilotsToAdd,(e)=>{
            if (e && e !== "" && e !== " " && !pilots[e]) {
                changesMade = true;
                console.log('changesMade: ' + changesMade)
                pilots[e] = {
                    ship: "",
                    section: 0,
                    doctrine: "",
                    isActive: false,
                    playtime: 0,
                    misord: 'z',
                }
            }
        });
        if (changesMade) {
            pushDataAndRefresh();
            return;
        }
    }
    
    // pilots exist in more than one section
    let uniquePilots = [];
    for (i=1; i < sections.length; i++) {
        // wings
        let newWings = []
        _.each(sections[i].wings, function(e,i,l){
            if ($.inArray(e, uniquePilots) === -1) newWings.push(e);
        }); 
    }
    
    sections[0] = [];
    let t = new Date().getTime();
    for (var k in pilots) {
        if (k == ClientCallsign && pilots[k] !== undefined && pilots[k].misord !== ClientMisord){
            ClientMisord = pilots[k].misord;
            ChangeMisordTitle();
        }
        if (pilots.hasOwnProperty(k) && pilots[k].section === 0) {
            if (pilots[k].playtime > t) pilots[k].isActive = true;
            if (pilots[k].isActive) sections[0].unshift(k);
            else sections[0].push(k);
        }
    }
    let pilotHTML = '<li id="newPilot" ondragover="allowDrop(event)" class="pilot newElement hidden">Deactivate Pilot ...</li>';
    for (let i = 0; i < sections[0].length; i++) {
        
        let isActiveClass = '';
        if (pilots[sections[0][i]].isActive) 
            isActiveClass = ' mb-pilotActive';
        let shipName = GetFormattedShipName(pilots[sections[0][i]].ship);
        let doctrine = pilots[sections[0][i]].doctrine;
        let pt = GetPlaytimeHTML(sections[0][i]);
        let misord = pilots[sections[0][i]].misord.toUpperCase();
        let shipNameSpan = '';
        if (doctrine != '' && shipName != '')
            shipNameSpan = '<span class="shipName">'+misord+' - '+doctrine+': '+shipName+pt+'</span>';
        if (!pilots[sections[0][i]].isActive && !isBoardMaster) continue;
        pilotHTML += '<li id="pilot" class="pilot'+isActiveClass
          +'" ondragend="dragEnd(event)" ondragstart="dragStart(event)"'
          +' ondragover="allowDrop(event)" draggable="true" data-lastGroup="pilotList" data-section="0" data-handle="' 
          + sections[0][i] + '" data-ship="' + pilots[sections[0][i]].ship + '">' + sections[0][i] + shipNameSpan+'</li>';
    }
    $('#pilotList').html(pilotHTML);
    ApplyPilotInfoGlobal();
    if (isBoardMaster) $('#button_editParams').show();
    else $('#button_editParams').hide();
};

const renderFlights = function() {
    if (!allowUpdate || mboardRefreshing) return;
    let renderedSections = [];
    
    let flightHTML = '';
    let newFlightHTML = '<li id="newFlight" ondragover="allowDrop(event)" class="flight newElement hidden">New Flight ...</li>';
    newFlightHTML += '<li class="flight" ondragover="allowDrop(event)" style="height: 100px;visibility:hidden"</li>'
    if (flights.length === 0) {
        flightHTML += '<li id="newFlightEmpty" ondragover="allowDrop(event)" class="flight">Drag Pilots Here ...</li>';
        $('#flights').html(flightHTML + newFlightHTML);
        return;
    }
    for (q=0; q<flights.length; q++) {
        
        // remove duplicate sections, if they exist
        var newSections = [];
        $.each(flights[q].sections, function(i, e) {
            if($.inArray(e, newSections) === -1) newSections.push(e);
        });
        flights[q].sections = newSections;
        
        let k = flights[q].name;
        let flightSections = flights[q].sections;
        let misord = flights[q].misord;
        if (misord !== ClientMisord) continue;

        flightHTML += '<li class="flight" id="flight" data-flight="' 
          + k + '" ondragover="allowDrop(event)">' + k + ' Flight';
        flightHTML += '<ul class="sections">';

        let newSectionHTML = '<li id="newSection" data-flight="' 
          + k + '" class="section newElement hidden" ondragover="allowDrop(event)">Add Section ...</li>';

        let flightLeadFound = false;
        let leads = [];
        for (let i = 0; i < flightSections.length; i++) {
            let sectionNo = flightSections[i];
            
            // check if section was in another flight
            if ($.inArray(sectionNo, renderedSections) !== -1) {
                console.log('A section tried to render in two separate flights!');
                continue;
            }
            
            renderedSections.push(sectionNo);
            let section = sections[sectionNo];
            if (section.lead == "") {
                continue;
            }
            
            // check if flight lead is in wrong section
            if (pilots[section.lead].section !== sectionNo) {
                section.lead = '';
                section.wings = [];
                continue;
            }
            
            leads.push(section.lead);
            if (section.lead == k) flightLeadFound = true;

            flightHTML += '<li class="section" data-flight="' + k + '" data-section=' 
              + sectionNo + ' ondragstart="dragStart(event)" ondragover="allowDrop(event)" id="section" data-handle="' 
              + sectionNo + '" ondragend="dragEnd(event)" draggable="true">Section ' 
              + sectionNo + '<ul class="wings" id="wings" data-flight="' + k + '" ondragover="allowDrop(event)" data-section=' 
              + sectionNo + '>';

            let newWingHTML = '<li id="newWing" data-flight="' + k + '" data-section=' 
              + sectionNo + ' class="wing newElement hidden" ondragover="allowDrop(event)">Add Wing ...</li>'

            let doctrine = pilots[section.lead].doctrine;
            let shipName = GetFormattedShipName(pilots[section.lead].ship);
            let shipNameSpan = '';
            let pt = GetPlaytimeHTML(section.lead);
            if (doctrine != '' && shipName != '')
                shipNameSpan = '<span class="shipName">'+misord+' - '+doctrine+': '+shipName+pt+'</span>';

            flightHTML += '<li id="wing" class="wing" data-flight="' + k + '" data-section=' 
              + sectionNo + ' ondragstart="dragStart(event)" ondragover="allowDrop(event)" ondragend="dragEnd(event)" draggable="true" data-handle="' 
              + section.lead + '" data-ship="' + pilots[section.lead].ship + '"><div class="leadButton" data-flight="' 
              + k + '" data-section=' + sectionNo + ' data-handle="' + section.lead + '" ></div>[' + section.number + '-1] ' 
              + section.lead + ' (Lead)'+shipNameSpan+'</li>';

            for (let j = 0; j < section.wings.length; j++) {
                
                //check if wing is in the wrong section
                if (pilots[section.wings[j]].section !== sectionNo) {
                    section.wings.splice(j,1);
                    continue;
                }
                doctrine = pilots[section.wings[j]].doctrine;
                shipName = GetFormattedShipName(pilots[section.wings[j]].ship);
                pt = GetPlaytimeHTML(section.wings[j]);
                flightHTML += '<li id="wing" class="wing" data-section=' + sectionNo + ' data-flight="' 
                  + k + '" ondragstart="dragStart(event)" ondragover="allowDrop(event)" ondragend="dragEnd(event)" draggable="true" data-handle="' 
                  + section.wings[j] + '" data-ship="' + pilots[section.wings[j]].ship + '"><div class="leadButton" data-flight="' 
                  + k + '" data-section=' + sectionNo + ' data-handle="' + section.wings[j] 
                  + '" ></div>[' + section.number + '-' + (Number(j) + 2) + '] ' + section.wings[j] 
                  + '<span class="shipName">'+doctrine+': '+shipName+pt+'</span></li>'
                  + '<ul class="mb-pilot-options" data-handle="'+section.wings[j]+'">Options'
                  + '<li>Change doctrine</li>'
                  + '<li>Change ship</li>'
                  + '<li>Change playtime</li>'
                  + '</ul>'
            }
            flightHTML += newWingHTML;
            flightHTML += '</ul></li>';
        }
        flightHTML += newSectionHTML;
        flightHTML += '</ul></li>';

        if (!flightLeadFound) {
            let newFlightLead = "";
            for (i = 0; i < leads.length; i++) {
                newFlightLead = leads[i];
                flightLeadFound = true;
                break;
            }
            if (!flightLeadFound) {
                flights.splice(q, 1);
                if (isBoardMaster) pushDataAndRefresh();
                else renderFlights();
                return;
            } else {
                if (oldFlight == null) oldFlight = k;
                flights[q].name = newFlightLead;
                if (isBoardMaster) 
                    addDirective(oldFlight + ' flight is now ' + newFlightLead + ' flight');
                oldFlight = null;
                if (isBoardMaster) pushDataAndRefresh();
                else renderFlights();
                return;
            }
        }
    }
    
    // Check for pilots/sections that were not rendered at all
    // NEEDS UPDATED TO ONLY CHECK THE CURRENT MISORD --done
    let unassignedPilotsNeedRendered = false;
    for (i=1; i < sections.length; i++) {
        if ($.inArray(i, renderedSections) !== -1 || sections[i].lead === '') 
            continue;
        let lead = sections[i].lead;
        if (pilots[lead].misord !== ClientMisord) continue;
        unassignedPilotsNeedRendered = true; 
        changePilotSection(lead);
        _.each(sections.wings, function(e,i,l) {
            changePilotSection(e);
        });
        sections[i].lead = '';
        sections[i].wings = [];
    }
    
    if (unassignedPilotsNeedRendered) renderPilots();

    $('#flights').html(flightHTML + newFlightHTML);
    
    $('.wing').hover(function() {
        $(this).addClass('fakeHover');
        $('.section').removeClass('fakeHover');
        let handle = $(this).attr('data-handle');
        let flight = $(this).attr('data-flight');

        if (isBoardMaster)
            $('.leadButton').each((i, e)=> {
                if ($(e).attr('data-handle') == handle && flight != handle)
                    $(e).addClass('active');
            })

        preventSectionHover = true;
    }, function() {
        $(this).removeClass('fakeHover');
        let section = $(this).attr('data-section');
        $('.section').each(function(i, e) {
            if (section === $(e).attr('data-section')) $(e).addClass('fakeHover');
        })
        $('.leadButton').removeClass('active');
        preventSectionHover = false;
    });

    $('.section').hover(function() {
        if (!preventSectionHover) $(this).addClass('fakeHover');
    }, function() {
        $(this).removeClass('fakeHover');
    });

    $('.leadButton').click(function() {
        click2.play();
        let handle = $(this).attr('data-handle');
        let secNo = $(this).attr('data-section');
        let flightName = $(this).attr('data-flight');
        let section = sections[secNo];
        if (section.lead === handle) {
            PromoteToFlightLead(handle, flightName) ;
            pushDataAndRefresh();
            return;
        }
        
        addDirective(handle + ' take section ' + secNo + ' lead');
        section.wings.push(section.lead);
        section.lead = handle;
        section.wings = _.filter(section.wings, function(h) {
            return h != handle;
        });
        pushDataAndRefresh();
    });
    
    $('.pilot, .wing').each(function(){
        if ($(this).attr('data-handle') == ClientCallsign)
        {
            if ($(this).hasClass('wing')) $(this).css('color','Gold'); 
            else if ($(this).hasClass('pilot')) $(this).css('color','Midnightblue'); 
            $(this).css('font-weight','700'); 
        }
    })
    $('.pilot, .wing').click(function(e) {
        click2.play();
        $('.mb-pilot-options').prop('display', 'none');
        $('.mb-pilot-options').each(function(){
            if ($(this).attr('data-handle') == $(e).attr('data-handle')){
                $(this).prop('display','block');
            }  
        })
        e.stopPropagation();
    });
    $(':not(.mb-pilot-options, .mb-pilot-options li)').click(()=>{
        $('.mb-pilot-options').prop('display', 'none');
    })
    $('#summaryBox').scrollTop(999 * directivesProcessed);
    ApplyPilotInfoGlobal();
};

//#endregion

//#region Assignment logic

const MoveSection = function(secNo, flightName) {
    if (!isSectionInFlight(secNo, flightName)) {
        let lead = sections[secNo].lead;
        let q = _.findIndex(flights, function(v){ return v.name == lead});
        if (q !== -1) oldFlight = lead;
        let g = _.findIndex(flights, function(v){ return v.name == flightName});
        removeSectionFromAllFlights(secNo);
        flights[g].sections.push(secNo);
        addDirective('Section ' + secNo + ' go ' + flightName + ' flight');
        return true;
    }
    return false;
}

const PromoteToFlightLead = function(pilot, flight = null) {
    let section = sections[pilots[pilot].section];
    let oldname = null;
    let success = false;
    if (flight !== null) {
        oldname = flight;
        let i = _.findIndex(flights, function(v){ return v.name == flight});
        flights[i].name = pilot;
        success = true;
    }
    else _.each(flights, function(e,i,l){
        if (e.sections.includes(section.number)) {
            success = true;
            oldname = e.name;
            e.name = pilot;
        }    
    });
    if (success) {
        addDirective(pilot + ' take flight lead');
        addDirective(oldname + ' flight is now ' + pilot + ' flight');
        return true;
    }
    return false;
}

const isSectionInFlight = function(section, flight) {
    let i = _.findIndex(flights, function(v){ return v.name == flight});
    var result = _.find(flights[i].sections, function(num) {
        return num == section;
    });
    if (result == undefined) return false;
    else return true;
}

const removeSectionFromAllFlights = function(section) {
    _.each(flights, function(e, i) {
        let newSections = _.filter(e.sections, function(num) {
            return num != section
        });
        flights[i].sections = newSections;
    });
}

const changePilotMisord = function(pilot) {
    if (ClientMisord && pilots[pilot].misord != ClientMisord) {
        pilots[pilot].misord = ClientMisord;
        addDirective(pilot+' joining with '+getNATOLetter(ClientMisord));
    }
}

const DismissSection = function(secNo) {
    let _pilots = [];
    if (secNo) {
        let section = sections[secNo];
        if (section.lead == "") return false;
        _pilots.push(section.lead);
        for (i = 0; i < section.wings.length; i++) {
            _pilots.push(section.wings[i]);
        }
        removeSectionFromAllFlights(secNo);
        sections[secNo] = {
            lead: "",
            wings: [],
            number: secNo
        }
        addDirective('Section ' + String(secNo) + ' dismissed');
        sectionWasDismissed = true;
    } else return false; // log an error?

    for (i = 0; i < _pilots.length; i++) {
        if (flights[_pilots[i]] != [] && flights[_pilots[i]] != null) 
            oldFlight = _pilots[i];

        changePilotSection(_pilots[i]);
    }
    return true;
}
        
const changePilotSection = function(pilot, newSection = 0, flight = null) {
    
    if (!pilots.hasOwnProperty(pilot)) {
        console.log(pilot + ' didnt exist in pilots object!');
        return 'Pilot '+pilot+' does not exist!';
    }
    changePilotMisord(pilot);
    let oldSectionNumber = pilots[pilot].section;
    let oldSection = sections[oldSectionNumber];
    let oldPosition = 1;
    let noFreeSections = '';
    
    if (oldSectionNumber !== newSection) {
        
        if (oldSectionNumber !== 0) {
            // If pilot was lead, see if a wing can fill the spot
            if (oldSection.lead == pilot) {
                if (oldSection.wings.length > 0) {
                    let newLead = oldSection.wings.shift();
                    sections[oldSectionNumber].lead = newLead;
                    addDirective(newLead + ' go section ' + oldSectionNumber);
                } else sections[oldSectionNumber].lead = '';
            } else
                for (j = 0; j < oldSection.wings.length; j++)
                    if (oldSection.wings[j] == pilot) {
                        oldPosition = (j + 2);
                        sections[oldSectionNumber].wings.splice(j, 1);
                        break;
                    }
        }

        // find the first free section
        if (VoiceCommandArgs.ForceNewSection || (newSection == -1 && !VoiceCommandArgs.ForceJoinSection)) {
            for (i = 1; i < 26; i++)
                if (sections[i].lead == "") {
                    newSection = i;
                    break;
                }

            // If all sections are filled, put pilot as unassigned
            if (newSection == -1) {
                newSection = 0;
                noFreeSections = ' (no free sections!)';
            }
        }
        pilots[pilot].section = newSection;
    }

    // If pilot is unassigned, do nothing with flights
    if (newSection < 1) {
        if (!sectionWasDismissed) addDirective(pilot + ' dismissed' + noFreeSections);
        return;
    }
    // lets define the section, if nessisary
    if (sections[newSection].lead == '') {
        sections[newSection] = {
            lead: pilot,
            wings: [],
            number: newSection
        }
    } else if (sections[newSection].lead != pilot && !sections[newSection].wings.includes(pilot)) {
        sections[newSection].wings.push(pilot);
        addDirective(pilot + ' go section ' + newSection + ' with ' + sections[newSection].lead);
        return;
    }

    // Now that we have a new section, if flight == null, we need a new flight.
    // Otherwise, put the new section in the provided flight (if it exists)
    
    // If pilot was flight lead in old flight, old flight needs new lead
    let g = _.findIndex(flights, function(v){ return v.name == pilot});
    if (g !== -1) oldFlight = source;
    
    if (VoiceCommandArgs.ForceNewFlight || flight == null || flight == undefined) {
        flights.push({
            name:pilot,
            sections:[newSection],
            misord:ClientMisord,
        });
        addDirective(pilot + ' go section ' + newSection + ' as flight lead');
    } else {
        
        // If the section is already in a flight, remove it from that flight
        _.each(flights, function(e,i,l) {
           for (i=0;i<e.sections.length;i++) 
               if (e.sections[i] === newSection)
                   e.sections.splice(i, 1);
        });
        if (isNaN(flight))
            flight = _.findIndex(flights, function(v){ return v.name == flight});
        flights[flight].sections.push(newSection);
        addDirective(pilot + ' go section ' + newSection + ' (' + flights[flight].name + ' flight)');
    }

    return true;
};

//#endregion

//#region Voice command processing

const MoveSectionVoice = function (secNo, flightName) {
    if (!isBoardMaster) return;
    secNo = GetSectionNumVoice(secNo);
    flightName = GetFlightNameVoice(flightName);
    if (!flightName) return;
    if (!MoveSection(secNo, flightName)) return;
    click2.play();
    pushDataAndRefresh();
}

const dismissPilotVoice = function(pilot) {
    if (!isBoardMaster) return;
    
    pilot = FuzzyGetPilot(pilot);   
    if (!pilot || pilots[pilot].section === 0) return;
    
    changePilotSection(pilot);
    click2.play();
    pushDataAndRefresh();
}

const dismissSectionVoice = function(secNo) {
    if (!isBoardMaster) return;
    secNo = GetSectionNumVoice(secNo); 
    if (!DismissSection(secNo)) return;
    click2.play();
    pushDataAndRefresh();
}

const GetFlightNameVoice = function(flightLead) {
    flightLead = FuzzyGetPilot(flightLead);
    if (!flightLead)  return false;
    let success = false;
    _.each(flights, function(e,i,l)
        { if (e.name == flightLead) success = true; });
     if (success) return flightLead;
    console.log(flightLead +' does not lead a flight.');
    return false;
}

const GetSectionNumVoice = function(secNo) {
    if (isNaN(Number(secNo))) return text2num(secNo);
    else return Number(secNo);
}

const ChangeFlightLeadVoice = function(pilot) {
    if (!isBoardMaster) return;
    pilot = FuzzyGetPilot(pilot);   
    if (!pilot || pilots[pilot].section === 0) return;
    if (sections[pilots[pilot].section].lead !== pilot) {
        // send error to voicebox that flightleads must be section leads first
        return;
    }
    if (PromoteToFlightLead(pilot)) {
        click2.play();
        pushDataAndRefresh();
    }
}
        
const changePilotSectionVoice = function(pilot, newSection = 0, args = null) {
    
    if (!isBoardMaster) return;
    // BoardMaster only for now, but in the future, lets do some permission checks to see 
    // if the person is a flight or section lead and has the right to order that pilot around
    
    VoiceCommandArgs = {
        ForceNewFlight: false,
        ForceJoinFlight: false,
        ForceJoinSection: false,
        ForceNewSection: false,
    };
    
    let flightLeadName = null;
    
    console.log("changePilotSectionVoice triggered with pilot = "+pilot+" and section = "+newSection+" with args "+args);
    
    newSection = GetSectionNumVoice(newSection);
    
    if (newSection !== 0 && args) {
        // we're making a new flight: Cleric go section 1 as flight lead
        if (args.includes('flight lead')) VoiceCommandArgs.ForceNewFlight = true;

        // we're joining a specific flight: Cleric go section 1, Zerker flight
        else if (args.includes('flight')) {
            var regex = /([\w\s]+) flight/;
            var re = args.match(regex);
            if (re.length > 0) {
                let flightLead = re[1];
                flightLeadName = FuzzyGetPilot(flightLead);
                flightLead = GetFlightNameVoice(flightLead);
                if (flightLead) VoiceCommandArgs.ForceJoinFlight = flightLead;
            } else {
                console.log('Could not recognize flight lead: "'+args+'"');
            }
        }
        
        // join as wing in specific section: Cleric go section 1 with Zerker
        else if (args.includes('with')) {
            var regex = /with ([\w\s]+)/;
            var re = args.match(regex);
            if (re.length > 0) {
                let sectionLead = re[1];
                sectionLead = FuzzyGetPilot(sectionLead);
                if (sectionLead) {
                    let success = false;
                    _.each(sections, function(e,i){
                        if (i !== 0 && e.lead == sectionLead && i === newSection) {
                            VoiceCommandArgs.ForceJoinSection = sectionLead;
                            success = true;
                        }
                    })
                    if (!success) {
                        // Print something to the voice feedback box
                        console.log(sectionLead +' is not the lead of section '+newSection);
                        return;
                    }
                }
            }
        } 
        
        // at this point, the only option is to join some flight, as that's our protocol
        else VoiceCommandArgs.ForceNewSection = true;
    } else if (newSection !== 0) VoiceCommandArgs.ForceNewSection = true;

    pilot = FuzzyGetPilot(pilot);   
    if (!pilot) return;
       
    if (VoiceCommandArgs.ForceJoinFlight) args = VoiceCommandArgs.ForceJoinFlight;
    else if (!VoiceCommandArgs.ForceNewFlight && flightLeadName && pilot === flightLeadName)
        VoiceCommandArgs.ForceNewFlight = true;
    
    // join the first flight on the table, by default
    else if (VoiceCommandArgs.ForceNewSection) {
        if (flights[0] && !VoiceCommandArgs.ForceNewFlight) args = 0
        else args = null;
        
        if (VoiceCommandArgs.ForceNewFlight && sections[newSection].lead != "") {
            //cannot create new flight with an occupied section!
            return;
        }

        //If a section is already occupied, our pilot
        // needs to be promoted to section lead
        if (sections[newSection].lead != "" && sections[newSection].lead != pilot) {
            sections[newSection].wings.push(sections[newSection].lead);
            sections[newSection].lead = pilot;
            pilots[pilot].section = newSection;
            _.filter(sections[newSection].wings, function(e)
                { return e !== pilot; });
            click2.play();
            pushDataAndRefresh();
            return;
        }
    }
    
    if (typeof changePilotSection(pilot, newSection, args) !== 'string') {
        pushDataAndRefresh();
        click2.play();
    }
}

//#endregion

//#region Drag/Drop logic

const dragStart = function(event) {
    if (!isBoardMaster) return;
    draggedItem = event.target;
    allowUpdate = false;
};

const dragEnd = function(event) {
    allowUpdate = true;
}

const allowDrop = function(event) {
    if (!isBoardMaster) return;
    event.preventDefault();
    timer++;
    if (timer < 60) return;
    timer = 0;
    $('.newElement').addClass('hidden');
    let id = $(event.target).attr('id') || $(event.target).attr('data-id');
    if (id === undefined || id === null || id == '')
        id = $(event.target).attr('data-id');
    let cl = null;
    let newText = null;
    let ignoreDistance = false;
    let source = $(draggedItem).attr('id') || $(draggedItem).attr('data-id');
    switch (id) {
        case "section": case "wing": case "wings": case "newWing":
            if (source == "section") newText = "Add Wings ...";
            else if (source == "wing" || source == "pilot") newText = "Add Wing ...";
            cl = ".wing";
            break;
        case "flight": case "newSection":
            cl = ".section";
            break;
        case "newFlight": case "newFlightEmpty": case "flights":
            id = "#newFlight";
            $('#newFlightEmpty').addClass('hidden');
            ignoreDistance = true;
            break;
        case "pilot": case "newPilot": case "pilotList": case "pilots":
            if (source == "section") newText = "Deactivate Section ...";
            else if (source == "pilot") return;
            else newText = "Deactivate Pilot ...";
            id = "#newPilot";
            ignoreDistance = true;
            break;
        default:
            $('.newElement').addClass('hidden');
            $('#newFlightEmpty').removeClass('hidden');
            return;
    }
    if (cl != null) {
        $(cl).removeClass('hidden');
        if (newText != null) $(cl + '.newElement').text(newText);
    } else {
        if (newText != null) $(id).text(newText);
        $(id).removeClass('hidden');
    }
    
    if (ignoreDistance) return;
    
    let choices = [];
    $('*').each(function(i, e) {
        if (!$(this).hasClass('newElement')) return true;

        if ($(this).attr('data-flight') != $(event.target).attr('data-flight')) {
            $(this).addClass('hidden');
            return true;
        } 

        let pos = $(this).offset(), 
            distance = 50, 
            height = $(event.target).parent().height(),
            diff = Math.abs(pos.top - event.clientY);

        if ((id == "flight" || id == "wing" || id == "section") && height > distance) 
            distance = height;

        if (diff > distance || $(this).attr('data-section') === $(draggedItem).attr('data-section')) 
            $(this).addClass('hidden');

        else if (source == "pilot" && (id == "section" || id == "wing" || id == "wings") 
          && $(this).attr('data-section') !== $(event.target).attr('data-section'))
            $(this).addClass('hidden');

        else if (!$(this).hasClass('hidden'))
            choices.push({ ele: this, diff: diff });
    })

    if (choices.length > 1) {
        _.sortBy(choices, 'diff');
        choices.shift();
        _.each(choices, function(e, i, l) 
            { $(e.ele).addClass('hidden'); });
    }
};

const finishDrop = function(event) {
    click1.play();
    pushDataAndRefresh();
};
        
const drop = function(event) {
    if (!isBoardMaster) return;
    event.preventDefault();
    $('.newElement').addClass('hidden');
    let item = $(draggedItem);
    let target = $(event.target).attr('id');
    let source = item.attr('data-handle')
    let isSection = !isNaN(Number(source));

    if (target == "newPilot" || target == "pilots" || target == "pilotList" || target == "pilot") {
        let _pilots = [];
        
        if (isSection) {
            let secNo = Number(source);
            if (DismissSection(secNo)) finishDrop(event);
        } else if (pilots[source].section !== 0) {
            changePilotSection(source);
            finishDrop(event);
        }

    } else if (target == "newFlight" || target == "flights") {
        if (isSection) { // Create new flight with section lead as flight lead
            let sectionNo = Number(source);
            let section = sections[sectionNo];
            removeSectionFromAllFlights(sectionNo);
            
            // If section lead was flight lead, flight needs a new name
            let g = _.findIndex(flights, function(v){ return v.name == section.lead});
            if (g !== -1) oldFlight = section.lead;
            
            flights.push({
                name:section.lead,
                sections:[sectionNo],
                misord:ClientMisord,
            });
            changePilotMisord(section.lead);
            addDirective('Section ' + sectionNo + ' go ' + section.lead + ' flight');
        } else { // Create new flight and new section with pilot as lead for both
            let newSection = -1;
            if (pilots[source].section != 0 && sections[pilots[source].section].lead == source && sections[pilots[source].section].wings.length == 0) {
                removeSectionFromAllFlights(pilots[source].section);
                newSection = pilots[source].section;
            } 
            
            changePilotSection(source, newSection);
        }

        finishDrop(event);

    } else if (target == "flight" || target == "newSection") {
        let flightName = $(event.target).attr('data-flight');
        let g = _.findIndex(flights, function(v){ return v.name == flightName});
        let flight = flights[g];
        if (!isSection) { // Start a new section in the flight with pilot as lead

            let doNotContinue = false;
            _.each(flights[g].sections, function(e, i, l) {
                if (sections[e].lead == source && sections[e].wings.length === 0)
                    doNotContinue = true;
            })
            if (doNotContinue) return;
            
            //If pilot was alone in section, move whole section instead
            let pilotSection = sections[pilots[source].section]
            if (pilotSection.lead == source && pilotSection.wings.length === 0) {
                isSection = true;
                source = pilots[source].section;
            }
            else changePilotSection(source, -1, g);
        }
        if (isSection) { // Move a section to a new flight
            let sectionNo = Number(source);
            if (!MoveSection(sectionNo, flightName)) return;
        }

        finishDrop(event);

    } else if (target == "section" || target == "wing" || target == "wings" || target == "newWing") {
        let sectionNo = null;
        switch (target) {
            case "section":
                sectionNo = Number($(event.target).attr('data-handle'));
                break;
            case "wing":
                sectionNo = pilots[$(event.target).attr('data-handle')].section;
                break;
            case "wings":
            case "newWing":
                sectionNo = Number($(event.target).attr('data-section'));
                break;
        }
        let section = sections[sectionNo];
        if (isSection) { // make all members of a section wings of the new section
            let sourceSectionNo = Number(source);
            if (sourceSectionNo == sectionNo) return;
            let sourceSection = sections[sourceSectionNo];
            sourceSection.wings
            for (var i = sourceSection.wings.length; i-- > 0;)
                changePilotSection(sourceSection.wings[i], sectionNo);
            changePilotSection(sourceSection.lead, sectionNo);
            
            sections[sourceSectionNo].lead = "";
            sections[sourceSectionNo].wings = [];
            removeSectionFromAllFlights(sourceSectionNo);
        } else { // make pilot a wing in the target section
            let pilot = pilots[source];
            if (pilot.section !== sectionNo) {
                changePilotSection(source, sectionNo);
            } else return;
        }
        finishDrop(event);
    }
};

//#endregion

//#region Google server connections

const getMISORDParametersLoop = function(){
    setTimeout(()=>{
        getMISORDParameters(() => {
            if (ClientLoaded) return;
            renderMISORDList();
            getMISORDParametersLoop();
        });
    },1000)
}

const getMISORDParameters = function(callback) {
    google.script.run
        .withSuccessHandler(r => {
            parameters = r.parameters;
            pilots = r.pilots;
            callback();
        }).withFailureHandler(e => {
            console.error(e);
            getMISORDParameters();
        })
        .getMisordData();
}

const ChangePilotInfo = function(t = 1) {
    $('#LF-mb-buttonBar').animate({
        'margin-top': "-=1000",
    }, 1, function() {});
    $('#mb-welcome-head').text('Adjust your credentials and press CONFIRM')
    ClientLoaded = false;
    BoardClosed = true;
    dataversion = 0;
    $('#mb-welcome-warningbox').css('color','red');
    $('#mb-welcome-warningbox').text('')
    $('.mb-container').css('opacity', 0);
    getMISORDParameters(()=> {
        setTimeout(()=>{
            renderMISORDList();
            AllowClickConfirmButton = true;
            $("#LF-mb-welcome").fadeTo(1000, 1, function() {});
            getMISORDParametersLoop();
        }, t)
    });
}

const pushDataAndRefresh = function() {
    mboardRefreshing = true;

    var data = {
        pilots,
        flights,
        sections,
        directives: LastDirectives
    };
    
    google.script.run
        .withSuccessHandler(function(response) {
            console.log('Successfully pushed data and recieved UUID ' + response);
            dataversion = response;
            LastDirectives = [];
            mboardRefreshing = false;
            $(draggedItem).remove();
            renderPilots();
            renderFlights();
        })
        .withFailureHandler(function(error) {
            pushDataAndRefresh();
        })
        .pushMboard(data);
}

const PushClientData = function() {
    
    let userdata = {
        callsign: ClientCallsign,
        doctrine: ClientDoctrine,
        ship: ClientShip,
        playtime: ClientPlaytime,
        jrplaytime: JoinReportPlayTime,
        remarks: ClientRemarks,
        misord: ClientMisord,
        sendFullReport: ClientSendFullReport,
    }
    
    google.script.run
        .withSuccessHandler(function(response) {
            //console.log(response);
            if (!ClientLoaded) {
                if (response == null) {
                    PushClientData();
                    return;
                }
                $('#mb-welcome-warningbox').text('Receiving board data');
                BoardClosed = false;
                ClientSendFullReport = false;
                if (!DevMode)
                    ClientCallsign = $('#mboardCallsign').html();
            } 
        })
        .pushClientData(userdata);
    
    $('#mb-welcome-warningbox').text('Sending client data');
}

const requestBoardDataLoop = function() {

    // At a regular interval (seconds),
    // client compares UUID with server
    // and pulls new board data if
    // clientUUID !== serverUUID
    setTimeout(function() {
        
        if (!mboardRefreshing && allowUpdate && !BoardClosed && ClientCallsign) {
            google.script.run
                .withSuccessHandler(function(response) {
                    if (response && !mboardRefreshing && allowUpdate) {
                        pilots = response.pilots;
                        if (!_.keys(pilots).includes(ClientCallsign))
                            PushClientData();
                        flights = response.flights;
                        sections = response.sections;
                        dataversion = response.dataversion;
                        $('div#parameters').html(response.parameters[ClientMisord]);
                        //console.log(response.directives);
                        _.each(response.directives, function(e)
                            { renderDirective(e); });
                        renderPilots();
                        renderFlights();
                        if (ClientLoaded && !BoardClosed) {
                            click1.play();
                        } else {
                            ClientLoaded = true;
                            $('#mb-welcome-warningbox').text('Success!!');
                            $('#LF-mb-welcome').css('opacity',0);
                            setTimeout(function(){
                                $('#LF-mb-welcome').hide();
                                welcomeBoxCompleted();
                            },1500)
                        }
                    }
                    requestBoardDataLoop();
                })
                .withFailureHandler(function(e){
                    requestBoardDataLoop();
                })
                .pullMboard(dataversion, directivesProcessed);
        } else requestBoardDataLoop();
        
    }, UpdateInterval * 1000);
};

const updateLastActiveLoop = function() {
    
    // At a regular interval (~ 2 minutes),
    // client updates server with activity
    setTimeout(()=> {
        if (ClientCallsign != null) {
            google.script.run
                .withSuccessHandler((response)=>{
                    if (response == null) {
                        console.error('updateLastActiveLoop RETURNED NULL!');
                        return;
                    }
                    console.log('updateLastActive returned from server with editsMade = '+response[1]);
                    pilots = response[0].pilots;
                    flights = response[0].flights;
                    sections = response[0].sections;
                    if (!BoardOnline || mboardRefreshing || !allowUpdate){
                        console.log('updateLastActiveLoop did not render results.'
                          +' Status: BoardOnline = '+BoardOnline+' | mboardRefreshing: '
                          +mboardRefreshing+' | allowUpdate:'+allowUpdate);
                        return;
                    } 
                    renderFlights();
                    renderPilots();
                }).updateLastActive({
                    isBoardMaster: isBoardMaster,
                    callsign: ClientCallsign
                })
        }
        updateLastActiveLoop();
    }, LastActiveUpdateInterval * 1000);
}

//#endregion

//#region Core
const welcomeBoxCompleted = function() {
    setTimeout(function() {
        if (!ClientLoaded) {
            welcomeBoxCompleted();
            return;
        }
        $('.mb-container').css('opacity',1);
        $('#LF-mb-buttonBar').animate({
            'margin-top': "+=1000",
        }, 1, function() {});
            
        startSound.play(); 

    } ,100);
}

const ConfirmationSuccessful = function() {
    $('#mb-welcome-warningbox').css('color','white');
    $('#mb-welcome-warningbox').text('Contacting server')
    AllowClickConfirmButton = false;
    ChangeMisordTitle();
    click2.play();
    PushClientData();
    welcomeBoxLoadingDots();
}
        
const InitMBoard = function() {
    setTimeout(()=>{
        if (typeof ClientCallsign !== 'undefined' && ClientCallsign) {
            MBoardInit = true;
            $('#mb-debugBox').hide();
            getMISORDParameters(() => {
                InitVoiceCommands();
                requestBoardDataLoop();
                PlaytimeUpdateLoop();
                updateLastActiveLoop();
                $("#LF-mb-welcome-handle")
                  .html('Callsign: <span id="mboardCallsign" class="Callsign">'+ClientCallsign+'</span>');
                renderMISORDList();
                if ($('#LF-mb-doctrineListBox').html() == '')
                    $('#LF-mb-doctrineListBox')
                      .append('<li class="LF-mb-doctrineListItem" data-type="doctrine">Nugget</li>');
                if ($('#LF-mb-shipListBox').html() == '')
                    $('#LF-mb-shipListBox')
                      .append('<li class="LF-mb-shipListItem" data-type="ship">Unspecified</li>');
                $("#LF-mb-welcome").fadeTo(500, 1, () => {});
                getMISORDParametersLoop();
            });
        }
        else {
            let msg = 'Could not load ClientCallsign. Press ESC to enter development mode.';
            console.error(msg);
            showDebugBox(msg);
            InitMBoard();
        }
    }, 1000);
}
//#endregion

//#region Voice Command init

const voiceCommands = {
    // annyang will capture anything after a splat (*) and pass it to the function.
    // e.g. saying "Show me Batman and Robin" is the same as calling showFlickr('Batman and Robin');
    //'show me *tag': showFlickr,

    // A named variable is a one word variable, that can fit anywhere in your command.
    // e.g. saying "calculate October stats" will call calculateStats('October');
    //'calculate :month stats': calculateStats,

    // By defining a part of the following command as optional, annyang will respond to both:
    // "say hello to my little friend" as well as "say hello friend"
    //'say hello (to my little) friend': greeting,
    
    '*pilot go section :number (*args)': changePilotSectionVoice,
    
    'section :number dismissed': dismissSectionVoice,
    'section :number dismiss': dismissSectionVoice,
    'section :number miss': dismissSectionVoice,
    
    '*pilot dismissed': dismissPilotVoice,
    '*pilot dismiss': dismissPilotVoice,
    '*pilot miss': dismissPilotVoice,
    
    'section :number go *flightname flight': MoveSectionVoice,
    
    '*pilot take flight lead': ChangeFlightLeadVoice,
    '*pilot go flight lead': ChangeFlightLeadVoice,
};

const InitVoiceCommands = function() {
    if (!annyang) {
        console.error("Speech Recognition is not supported on this browser.");
        $('#mb-toggleMic').prop('background-color', 'darkred');
        $('#mb-toggleMic:hover').prop('background-color', 'transparent');
        $('#mb-toggleMic').attr('alt', 'Speech Recognition is not supported on this browser.');
        return;
    }

    annyang.addCommands(voiceCommands);

    annyang.addCallback('error', function() {
        console.error('Voice Commands: There was an error!');
    });

    annyang.addCallback('result', function(array) {
        console.log('Voice input:')
        let e = array[0];
        // fixes for weird and unexpected phrases
        if (e.toLowerCase().includes('gosection8')) {
            let f = e.toLowerCase();
            f = f.replace('gosection8','go section 8');
            annyang.trigger(f);
            return;
        }
    });
    
    ApplyMicToggle(); 
}

//#endregion

//#region Init
registerEvents();
InitMBoard();
$('.mb-top-button').balloon({ position: "bottom right" });
ApplySoundToggle();
//#endregion
