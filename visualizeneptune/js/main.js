
//var PROXY_API_URL = "https://abcxyz.execute-api.eu-west-1.amazonaws.com/test";
var PROXY_API_URL = "https://abcxyz.execute-api.eu-west-1.amazonaws.com/test";

// var nodes = null;
var edges = null;
var network = null;
var resp =null;
var options =null;

var searchfill=null;

var LENGTH_MAIN = 350,
LENGTH_SERVER = 150,
LENGTH_SUB = 50,
WIDTH_SCALE = 2,
GREEN = 'green',
RED = '#C5000B',
ORANGE = 'orange',
//GRAY = '#666666',
GRAY = 'gray',
BLACK = '#2B1B17';
$(document).ready(function(){
    
    console.log('Initializing the page..and loading the values in the Search LoV');
    /*
    $.get(PROXY_API_URL + "/initialize", function(data) {
        console.log(data);
        var js=JSON.parse(JSON.stringify(data))
        searchfill=[];
        for(i=0;i< js.length; i++)
        {
            searchfill.push(js[i].name);
        }
        console.log(searchfill);
        
        $( "#users" ).autocomplete({
            source:
            function (request, response) {
                var filteredArray = $.map(searchfill, function (item) {
                    //console.log(item);
                    if (item.startsWith(request.term)) {
                        return item;
                    }
                    else {
                        return null;
                    }
                });
                response(filteredArray);
            }
        });
        
    }
    );
    */
    
    <!-- called when user clicks on the Search button to find Resource by ID -->
    $( "#go_id" ).click(function(event){
        var resource_id = $("#resource_id").val();
        //var lastchar= username.substring(username.length-1, username.length);
        //var nextletter= String.fromCharCode(lastchar.charCodeAt(0)+1);
        //var touser = username.substring(0,username.length-1)
        //touser = touser+nextletter;
        console.log("resource_id: " + resource_id);
        
        $.get(PROXY_API_URL + "/searchbyid?resource_id="+resource_id, function(data) {
            var resp = JSON.parse(JSON.stringify(data));
            console.log(resp);
            var x=0;
            var y=0;
            for(let i=0;i< resp.length;i++) {
                try {
                    nodes.add({
                        shape:'image',
                        id:resp[i].id, 
                        label:resp[i].id, 
                        image: 'images/ec2.png',
                        size:10
                    });
                    console.log("Adding");
                    console.log(resp[i].id + " : " +  resp[i].label[0]);
                }
                catch (e) { //if node is already added just continue
                    //throw e;
                    //nodes.remove({id:resp[i].id });
                    nodes.add({id:resp[i].id, label:resp[i].id, value:resp[i].label /*, color: 'red', font: {color:'white'} */});
                }
            }
        });
        
    });
    
    <!-- called when user clicks on the Search button to find Resource by Label -->
    $( "#go_label" ).click(function(event){
        var resource_label = $("#resource_label").val();
        //var lastchar= username.substring(username.length-1, username.length);
        //var nextletter= String.fromCharCode(lastchar.charCodeAt(0)+1);
        //var touser = username.substring(0,username.length-1)
        //touser = touser+nextletter;
        console.log("resource_label: " + resource_label);
        
        $.get(PROXY_API_URL + "/searchbylabel?resource_label="+resource_label, function(data) {
            var resp = JSON.parse(JSON.stringify(data));
            console.log(resp);
            var x=0;
            var y=0;
            for(let i=0;i< resp.length;i++) {
                try {
                    nodes.add({id:resp[i].id, 
                        shape: 'circularImage',
                        label:resp[i].label[0], 
                        image:'images/ec2.png',
                        size:10    
                    });
                    console.log("Adding");
                    console.log(resp[i].id + " : " +  resp[i].label[0]);
                }
                catch (e) { //if node is already added just continue
                    //throw e;
                    //nodes.remove({id:resp[i].id });
                    nodes.add({id:resp[i].id, 
                        label:resp[i].id, 
                        value:resp[i].label /*, color: 'red', font: {color:'white'} */});
                    }
                }
            });
            
        });
        
        
        <!-- call to render the VIS.js canvas -->
        draw();
        
    });
    
    // Called when the Visualization API is loaded.
    function draw() {
        resp = "";
        console.log('Inside draw function to render graph elements (nodes/edges)...');
        
        // Create a data table with nodes.
        nodes = []; //this will be converted to an object below
        // Create a data table with links.
        edges = []; //this will be converted to an object below
        
        nodes = new vis.DataSet();
        //handle events on "nodes" object that is added to network
        //for e.g. add a node to the "nodes" object invokes this event
        nodes.on("*", function (event) {
            //document.getElementById('nodes').innerHTML = JSON.stringify(nodes.get(), null, 4);
            //console.log('you just added on a node... :');
            //console.log(event);
        });
        
        edges = new vis.DataSet();
        var container = document.getElementById('mynetwork');
        var data = {
            nodes: nodes,
            edges: edges
        };
        
        //options = { };
        
        options = {
            width: (window.innerWidth - 450) + "px",
            height: (window.innerHeight - 200) + "px",
            layout:{
                randomSeed: undefined,
                improvedLayout:true,
                hierarchical: {
                    enabled:false,
                    levelSeparation: 5,
                    nodeSpacing: 500,
                    treeSpacing: 600,
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: true,
                    direction: 'UD',        // UD, DU, LR, RL
                    sortMethod: 'hubsize'  // hubsize, directed
                
                }
            },
            nodes: {
                shape: 'image'
            }
        };
        
        network = new vis.Network(container, data, options);
        network.on("click", function (params) {
            params.event = "[original event]";
            console.log('click event, getNodeAt returns: ' + this.getNodeAt(params.pointer.DOM));
            console.log(this);
            var fromnode = this.getNodeAt(params.pointer.DOM);
            
            if (typeof nodes.get(fromnode).label != "undefined") {
                console.log(nodes.get(fromnode).label);
                
                callneptunegetneighbours(fromnode, nodes, edges);
                
                //callneptunegettweets(fromnode, nodes, edges);
                
                //if (nodes.get(fromnode).value == 'Tweet') {
                    //    console.log('getting user who like this tweet now............');
                    //    whichusersliketweet(fromnode, nodes, edges);
                    //}
                }
                
                
            });
        }
        
        
        function whichusersliketweet(fromnode, nodes, edges)
        {
            console.log('inside whichusersliketweet');
            $.get(PROXY_API_URL + "/whichusersliketweet?tweetid="+fromnode, function(data) {
                console.log(data);
                var resp = JSON.parse(JSON.stringify(data));
                console.log(resp);
                for(let i=0;i< resp.length;i++) {
                    try {
                        nodes.add({id:resp[i].id, label:resp[i].name[0], value:resp[i].label});
                    }
                    catch (e) { //if node is already added just continue
                        console.log('clicked on the same node twice');
                    }
                }
                
                console.log('creating user-likes-tweet relations');
                
                for(let j=0;j< resp.length;j++)
                {
                    console.log('adding edges');
                    try{
                        edges.add({id: resp[j].id+''+fromnode, from: resp[j].id, to: fromnode, label:"likes",
                        color:{color:'rgba(229,77,159,0.78)', highlight:'rgba(229,77,159,0.78)', inherit: false},
                        arrows: {to: {enabled: true } }
                    });
                } //add an edge
                catch(e)
                {
                    console.log('clicked on the same node twice');
                }
            }
        });
        
    } //end of function
    
    function callneptunegettweets(fromnode, nodes, edges)
    {
        $.get(PROXY_API_URL + "/getusertweets?userid="+fromnode, function(data) {
            console.log(data);
            var resp = JSON.parse(JSON.stringify(data));
            console.log(resp);
            for(let i=0;i< resp.length;i++) {
                try {
                    nodes.add(
                    {
                        shape: 'circularImage',
                        image:'images/ec2.png',
                        size:10,
                        id:resp[i].id, 
                        label:resp[i].text[0].substring(0, 50)+'...', 
                        color: 'grey'});
                    }
                    catch (e) { //if node is already added just continue
                        console.log('clicked on the same node twice');
                    }
                }
                
                console.log('creating user-tweets-tweet relations');
                
                for(let j=0;j< resp.length;j++)
                {
                    console.log('adding edges');
                    try{
                        edges.add({id: fromnode+''+resp[j].id, from: fromnode, to: resp[j].id, label:"tweets", color:{color:'grey'},  arrows: {to: {enabled: true } } });
                    } //add an edge
                    catch(e)
                    {
                        console.log('clicked on the same node twice');
                    }
                }
            });
        }
        
        function callneptunegetneighbours(fromnode, nodes, edges)
        {
            console.log('Inside callneptunegetneighbours fromnode: ' + fromnode);
            <!-- below code is without using jQuery -->
            var xhr = new XMLHttpRequest();
            var  resparr;
            const Http = new XMLHttpRequest();
            const url = PROXY_API_URL + '/neighbours?resource_id='+fromnode;
            Http.open("GET", url);
            Http.send();
            Http.onreadystatechange = (e) =>
            {
                console.log(Http.responseText);
                resp = Http.responseText;
                if (Http.readyState === 4) {
                    resparr = JSON.parse(resp);
                    console.log("resparr[0]: " + resparr[0]);
                    for(let i=0;i< resparr[0].length;i++) {
                        if(resparr[0][i].id != fromnode)
                        {
                            try {
                                console.log("id: " + resparr[0][i].id + " label: " + resparr[0][i].label);
                                var tmpImg = 'images/'+resparr[0][i].id.substring(0,resparr[0][i].id.indexOf('-'))+'.png'
                                console.log(tmpImg)
                                nodes.add(
                                {
                                    shape: 'circularImage',
                                    size:10,
                                    image:tmpImg,
                                    id:resparr[0][i].id, 
                                    label: resparr[0][i].id
                                });
                            }
                            catch (e) { //if node is already added just continue
                                continue;
                            }
                        }
                    }
                    
                    console.log('printing nodes');
                    console.log(nodes);
                    console.log("resparr[1]: " + resparr[1]);
                    
                    for(let j=0;j< resparr[1].length;j++)
                    {
                        console.log('adding edges: ' + resparr[1][j] + " resparr[1][j].split " + resparr[1][j].id.split(":")[1]);
                        try{
                            edges.add(
                            {
                                id: resparr[1][j].id, 
                                from: fromnode, 
                                to: resparr[1][j].id.split(":")[1], 
                                label:resparr[1][j].label, 
                                length:500,
                                arrows: {to: {enabled: true } }});
                            } //add an edge
                            catch(e)
                            {
                                console.log('clicked on the same node twice');
                            }
                        }
                    }
                }
            }
            
            document.addEventListener('DOMContentLoaded', function() {
                
                var container = document.querySelector('#graph');
                
                var data = {
                    nodes: [
                    {
                        id: 1, 
                        shape: 'image', 
                        image: 'https://lenguajehtml.com/img/html5-logo.png',
                        label: 'HTML5'
                    },
                    {
                        id: 2,
                        shape: 'image',
                        image: 'https://lenguajecss.com/img/css3-logo.png',
                        label: 'CSS3'
                    },
                    {
                        id: 3,
                        shape: 'image',
                        image: 'http://ryanchristiani.com/wp-content/uploads/2015/06/js-logo.png',
                        label: 'JS'
                    },
                    {
                        id: 4,
                        shape: 'image',
                        image: 'http://www.freeiconspng.com/uploads/less-icon-17.png',
                        label: 'LESS'  
                    },
                    {
                        id: 5,
                        shape: 'image',
                        image: 'https://static.raymondcamden.com/images/2016/11/pug.png',
                        label: 'PUG'
                    },
                    {
                        id: 6,
                        shape: 'image',
                        image: 'https://cdn-images-1.medium.com/max/529/1*XmHUL5DeySv_dGmvbPqdDQ.png',
                        label: 'Babel'
                    },
                    {
                        id: 7,
                        shape: 'image',
                        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/PostCSS_Logo.svg/2000px-PostCSS_Logo.svg.png',
                        label: 'PostCSS'
                    },
                    {
                        id: 8,
                        shape: 'image',
                        image: 'http://www.unixstickers.com/image/cache/data/stickers/bootstrap/xbootstrap.sh-340x340.png.pagespeed.ic.rjul6vd1jk.png',
                        label: 'Bootstrap'
                    }
                    ],
                    edges: [
                    {from: 1, to: 2},
                    {from: 1, to: 3},
                    {from: 2, to: 4},
                    {from: 1, to: 5},
                    {from: 3, to: 6},
                    {from: 2, to: 7},
                    {from: 2, to: 8}
                    ]
                }
                
                var options = {
                    nodes: {
                        borderWidth:0,
                        size:42,
                        color: {
                            border: '#222',
                            background: 'transparent'
                        },
                        font: {
                            color: '#111',
                            face: 'Walter Turncoat',
                            size: 16,
                            strokeWidth: 1,
                            strokeColor: '#222'
                        }
                    },
                    edges: {
                        color: {
                            color: '#CCC',
                            highlight: '#A22'
                        },
                        width: 3,
                        length: 275,
                        hoverWidth: .05
                    }
                }
                
                var network = new vis.Network(container, data, options);
                
            });
            
